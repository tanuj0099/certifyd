'use server';

import { supabaseAdmin } from '../lib/supabase/server';
import { assertPermission, logAudit } from '../lib/rbac/permissions';
import { revalidatePath } from 'next/cache';

export interface DemandObservation {
  id?: string;
  created_at?: string;
  cert_name: string;
  city: string;
  role: string;
  open_roles_count?: number | null;
  source: 'adzuna_api' | 'manual_pull' | 'user_aggregate' | string;
  observed_at: string;
  notes?: string;
}

export async function addDemandObservationAction(observation: DemandObservation) {
  await assertPermission('EDIT_STAGING');

  const { data, error } = await supabaseAdmin
    .from('market_demand_observations')
    .insert({
      cert_name: observation.cert_name,
      city: observation.city,
      role: observation.role,
      open_roles_count: observation.open_roles_count ?? null,
      source: observation.source || 'manual_pull',
      observed_at: observation.observed_at || new Date().toISOString().split('T')[0],
      notes: observation.notes || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add demand observation: ${error.message}`);
  }

  await logAudit({
    action_type: 'ADD_DEMAND_OBSERVATION',
    target_table: 'market_demand_observations',
    target_id: data.id,
    new_value: observation,
  });

  // Automatically trigger scoring after logging an observation (A3)
  try {
    await computeDemandScoresAction();
  } catch (e) {
    console.warn('Post-observation demand score re-computation failed:', e);
  }

  revalidatePath('/data/demand');
  revalidatePath('/data/jobs');
  return { success: true, data };
}

export async function getDemandObservationsAction() {
  const { data, error } = await supabaseAdmin
    .from('market_demand_observations')
    .select('*')
    .order('observed_at', { ascending: false })
    .limit(1000);

  if (error && error.code !== '42P01') { // ignore table not found if migration pending
    console.warn('Failed to fetch demand observations:', error.message);
  }

  return data || [];
}

/**
 * A3: Compute demand_score from observations
 * Groups by cert+city+role, takes most recent (or averages last 3),
 * writes normalized 0-100 score + sample_confidence ('low' / 'medium' / 'high') + last_observed_at to demand_scores.
 */
export async function computeDemandScoresAction() {
  await assertPermission('EDIT_STAGING');

  const { data: obs, error } = await supabaseAdmin
    .from('market_demand_observations')
    .select('*')
    .order('observed_at', { ascending: false });

  if (error || !obs || obs.length === 0) {
    return { success: true, count: 0, message: 'No observations found to compute scores.' };
  }

  // Group by cert_name + city + role
  const groups: Record<string, any[]> = {};
  obs.forEach((o) => {
    const key = `${o.cert_name.toLowerCase().trim()}||${o.city.toLowerCase().trim()}||${o.role.toLowerCase().trim()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(o);
  });

  // Find max open_roles across all observations to normalize 0-100
  let maxCount = 1;
  obs.forEach((o) => {
    if (typeof o.open_roles_count === 'number' && o.open_roles_count > maxCount) {
      maxCount = o.open_roles_count;
    }
  });

  const scoresToUpsert: any[] = [];

  // Fetch existing demand_scores to prevent downgrading high -> low confidence
  const { data: existingScores } = await supabaseAdmin.from('demand_scores').select('slug, score, sample_confidence, last_observed_at');
  const existingMap: Record<string, any> = {};
  if (existingScores) {
    existingScores.forEach((s) => { if (s.slug) existingMap[s.slug] = s; });
  }

  Object.entries(groups).forEach(([key, list]) => {
    const first = list[0];
    const cert_name = first.cert_name;
    const city = first.city;
    const role = first.role;
    const last_observed_at = first.observed_at || first.created_at || new Date().toISOString();

    // Check distinct sources and sample size to determine confidence
    const sourcesSet = new Set(list.map((item) => item.source));
    const hasManual = sourcesSet.has('manual_pull');
    const hasAdzuna = sourcesSet.has('adzuna_api');
    const totalObservations = list.length;

    let sample_confidence = 'low';
    if (totalObservations >= 5 || (hasManual && hasAdzuna)) {
      sample_confidence = 'high';
    } else if (totalObservations >= 2 || hasAdzuna) {
      sample_confidence = 'medium';
    }

    // Average last 3 counts if multiple exist, or take most recent
    const top3 = list.filter((i) => typeof i.open_roles_count === 'number').slice(0, 3);
    let avgCount = 0;
    if (top3.length > 0) {
      const sum = top3.reduce((acc, curr) => acc + (curr.open_roles_count || 0), 0);
      avgCount = Math.round(sum / top3.length);
    }

    // Normalize 0-100 (log scale or linear scale capped at 100)
    let score = Math.min(100, Math.round((avgCount / maxCount) * 100));
    if (score < 10 && avgCount > 0) score = Math.min(100, score + 15); // baseline lift for active jobs

    // Create unique slug/id for upsert
    const slugKey = `${cert_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${role.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    // A3 rule: Don't overwrite existing scores if sample_confidence would drop from 'high' to 'low' — keep the last high-confidence score and flag it as aging instead.
    const existing = existingMap[slugKey];
    if (existing && existing.sample_confidence && existing.sample_confidence.includes('high') && sample_confidence === 'low') {
      scoresToUpsert.push({
        slug: slugKey,
        certification: cert_name,
        role: role,
        city: city,
        score: existing.score,
        sample_confidence: 'high (aging)',
        last_observed_at: existing.last_observed_at || last_observed_at,
        source: existing.source || Array.from(sourcesSet).join(', '),
      });
    } else {
      scoresToUpsert.push({
        slug: slugKey,
        certification: cert_name,
        role: role,
        city: city,
        score: score,
        sample_confidence: sample_confidence,
        last_observed_at: last_observed_at,
        source: Array.from(sourcesSet).join(', '),
      });
    }
  });

  if (scoresToUpsert.length > 0) {
    const { error: upsertErr } = await supabaseAdmin
      .from('demand_scores')
      .upsert(scoresToUpsert, { onConflict: 'slug' });

    if (upsertErr) {
      console.warn('Could not upsert computed demand_scores (slug check):', upsertErr.message);
      // Fallback insert without onConflict if slug unique constraint not yet created
      for (const s of scoresToUpsert) {
        try {
          await supabaseAdmin.from('demand_scores').upsert(s);
        } catch {
          // ignore fallback errors
        }
      }
    }
  }

  await logAudit({
    action_type: 'COMPUTE_DEMAND_SCORES',
    target_table: 'demand_scores',
    new_value: { count: scoresToUpsert.length },
  });

  revalidatePath('/data/demand');
  revalidatePath('/data/jobs');
  return { success: true, count: scoresToUpsert.length };
}

/**
 * A2: Automated Adzuna API demand pull
 * Fetches real job counts for target Indian tech hubs and logs to market_demand_observations.
 */
export async function pullAdzunaDemandAction() {
  await assertPermission('EDIT_STAGING');

  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    throw new Error('Adzuna API credentials (ADZUNA_APP_ID, ADZUNA_APP_KEY) are not configured in environment variables.');
  }

  const targetQueries = [
    { cert: 'AWS Certified Solutions Architect', role: 'Cloud Architect', query: 'AWS Solutions Architect' },
    { cert: 'Certified Kubernetes Administrator', role: 'DevOps Engineer', query: 'Kubernetes CKA' },
    { cert: 'Azure Administrator Associate', role: 'Cloud Engineer', query: 'Azure Administrator' },
    { cert: 'GCP Professional Cloud Architect', role: 'Cloud Architect', query: 'GCP Cloud Architect' },
    { cert: 'CISSP / Security+ Certified', role: 'Security Engineer', query: 'Cloud Security CISSP' },
  ];
  const cities = ['Bengaluru', 'Hyderabad', 'Pune', 'Gurugram'];

  let pulledCount = 0;
  for (const q of targetQueries) {
    for (const city of cities) {
      try {
        const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}&what=${encodeURIComponent(q.query)}&where=${encodeURIComponent(city)}`;
        const res = await fetch(url, { method: 'GET' });
        if (res.ok) {
          const json = await res.json();
          const count = json.count || 0;
          await supabaseAdmin.from('market_demand_observations').insert({
            cert_name: q.cert,
            city: city,
            role: q.role,
            open_roles_count: count,
            source: 'adzuna_api',
            observed_at: new Date().toISOString().split('T')[0],
            notes: `Automated pull via Adzuna search for '${q.query}' in '${city}'`,
          });
          pulledCount++;
        }
      } catch (e) {
        console.warn(`Adzuna API pull failed for ${q.query} in ${city}:`, e);
      }
    }
  }

  if (pulledCount > 0) {
    await computeDemandScoresAction();
  }

  revalidatePath('/data/demand');
  revalidatePath('/data/jobs');
  return { success: true, count: pulledCount };
}

