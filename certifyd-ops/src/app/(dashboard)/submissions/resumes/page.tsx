import React from 'react';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { ResumesClient, ResumeRecord } from '@/components/submissions/ResumesClient';
import { getSubmissionOverrides } from '@/lib/cache/submissionsCache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ResumesPage() {
  const session = await getSession();
  const userRole = session?.role || 'SUPER_ADMIN';

  let records: ResumeRecord[] = [];
  const seenIds = new Set<string>();

  try {
    const overrides = getSubmissionOverrides();
    const results = await Promise.allSettled([
      supabaseAdmin.from('resume_submissions').select('*').order('submitted_at', { ascending: false }).limit(2000),
      supabaseAdmin.from('resumes').select('*').order('updated_at', { ascending: false }).limit(2000),
    ]);

    const subRes = results[0].status === 'fulfilled' ? results[0].value : { data: null };
    const resRes = results[1].status === 'fulfilled' ? results[1].value : { data: null };

    if (subRes.data && subRes.data.length > 0) {
      subRes.data.forEach((item) => {
        seenIds.add(item.id);
        const ov = overrides[item.id];
        records.push({
          id: item.id,
          submitted_at: item.submitted_at || item.created_at || new Date().toISOString(),
          city: item.city || 'Unspecified',
          domain: item.domain || item.extracted_data?.role_category || 'General Tech',
          certs_found: Array.isArray(item.certs_found) ? item.certs_found : [],
          exp_band: item.exp_band || (item.extracted_data?.experience_years ? `${item.extracted_data.experience_years} yrs` : 'Unspecified'),
          pii_scan: item.pii_scan || { pass: true },
          anomaly_score: item.anomaly_score || 12,
          status: ov?.status || (item.status as any) || 'pending',
          extracted_data: item.extracted_data || {},
          rejection_reason: ov?.rejection_reason || item.rejection_reason,
          internal_notes: ov?.internal_notes || (Array.isArray(item.internal_notes) ? item.internal_notes : []),
        });
      });
    }

    if (resRes.data && resRes.data.length > 0) {
      resRes.data.forEach((item) => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          const ov = overrides[item.id];
          records.push({
            id: item.id,
            submitted_at: item.updated_at || item.created_at || new Date().toISOString(),
            city: item.city || 'Unspecified',
            domain: item.domain_bucket || item.current_role || 'General Tech',
            certs_found: Array.isArray(item.existing_certifications) ? item.existing_certifications : [],
            exp_band: item.experience_years ? `${item.experience_years} yrs` : 'Unspecified',
            pii_scan: { pass: true },
            anomaly_score: 10,
            status: ov?.status || (item.status as any) || 'pending',
            extracted_data: {
              role_category: item.current_role || undefined,
              cert_stack: item.existing_certifications || [],
              ...item
            } as any,
            rejection_reason: ov?.rejection_reason || item.rejection_reason,
            internal_notes: ov?.internal_notes || [],
          });
        }
      });
    }
  } catch (e) {
    console.warn('Resume submissions fetch error:', e);
  }

  // Sort newest first
  records.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

  return <ResumesClient initialRecords={records} userRole={userRole} />;
}
