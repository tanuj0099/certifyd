import React from 'react';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { OffersClient, OfferRecord } from '@/components/submissions/OffersClient';
import { getSubmissionOverrides } from '@/lib/cache/submissionsCache';
import { ConfidentialDataShield } from '@/components/ui/ConfidentialDataShield';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function OffersPage() {
  const session = await getSession();
  const userRole = session?.role || 'SUPER_ADMIN';

  let records: OfferRecord[] = [];
  const seenIds = new Set<string>();

  try {
    const overrides = getSubmissionOverrides();
    const results = await Promise.allSettled([
      supabaseAdmin.from('offer_letter_submissions').select('*').order('submitted_at', { ascending: false }).limit(2000),
      supabaseAdmin.from('offer_analyses').select('*').order('created_at', { ascending: false }).limit(2000),
      supabaseAdmin.from('offer_letters').select('*').order('created_at', { ascending: false }).limit(2000),
    ]);

    const subRes = results[0].status === 'fulfilled' ? results[0].value : { data: null };
    const anaRes = results[1].status === 'fulfilled' ? results[1].value : { data: null };
    const letRes = results[2].status === 'fulfilled' ? results[2].value : { data: null };

    // 1. Check offer_letter_submissions table if available
    if (subRes.data && subRes.data.length > 0) {
      subRes.data.forEach((item) => {
        seenIds.add(item.id);
        const ov = overrides[item.id];
        records.push({
          id: item.id,
          submitted_at: item.submitted_at || item.created_at || new Date().toISOString(),
          city: item.city || 'Unspecified',
          domain: item.domain || item.role_category || 'General Tech',
          ctc_band: item.ctc_band || (item.extracted_data?.ctcStated ? `₹${Math.round(item.extracted_data.ctcStated/100000)}L` : 'Unspecified'),
          role_category: item.role_category || item.domain || 'Unspecified',
          employer_sector: item.employer_sector || 'Tech',
          trap_flags: Array.isArray(item.trap_flags) ? item.trap_flags : [],
          counter_offer_shown: item.counter_offer_shown || (item.extracted_data?.targetCompensation ? `₹${Math.round(item.extracted_data.targetCompensation/100000)}L` : 'N/A'),
          negotiation_email: item.negotiation_email || item.extracted_data?.emailScript || 'N/A',
          anomaly_score: item.anomaly_score || 15,
          status: ov?.status || (item.status as any) || 'pending',
          extracted_data: item.extracted_data || {},
          rejection_reason: ov?.rejection_reason || item.rejection_reason,
          internal_notes: ov?.internal_notes || (Array.isArray(item.internal_notes) ? item.internal_notes : []),
        });
      });
    }

    // 2. Check offer_analyses table (Primary storage from public site offer analyzer)
    if (anaRes.data && anaRes.data.length > 0) {
      anaRes.data.forEach((item) => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          const ov = overrides[item.id];
          const raw = item.raw_json || {};
          const ctcVal = item.offered_ctc || raw.CTC_Breakdown?.Total_CTC_Stated || 0;
          const targetRole = item.target_job_title || raw.Database_Payload?.role || raw.Offer_Metadata?.Designation || 'Tech Engineering';
          const redFlags = Array.isArray(item.red_flags) ? item.red_flags : (Array.isArray(raw.Strategic_Negotiation_Output?.Red_Flags) ? raw.Strategic_Negotiation_Output.Red_Flags : []);
          const p75 = raw.Market_Intelligence_2026?.Market_75th_Percentile || item.market_median || 0;
          
          records.push({
            id: item.id,
            submitted_at: item.created_at || new Date().toISOString(),
            city: item.city || raw.Analysis_Metadata?.Target_Location || 'Unspecified',
            domain: targetRole,
            ctc_band: ctcVal > 0 ? `₹${Math.round(ctcVal/100000)}L` : 'Unspecified',
            role_category: targetRole,
            employer_sector: raw.Database_Payload?.company_tier || raw.Analysis_Metadata?.Company_Tier || raw.Offer_Metadata?.Company_Name || 'Tech / SaaS',
            trap_flags: redFlags,
            counter_offer_shown: p75 > 0 ? `₹${Math.round(p75/100000)}L` : (ctcVal > 0 ? `₹${Math.round((ctcVal * 1.15)/100000)}L` : 'N/A'),
            negotiation_email: raw.Strategic_Negotiation_Output?.Counter_Offer_Email_Script || raw.Strategic_Negotiation_Output?.Blunt_Assessment || item.blunt_assessment || 'N/A',
            anomaly_score: item.percentile_rank ? Math.abs(50 - item.percentile_rank) : 12,
            status: ov?.status || (item.status as any) || 'pending',
            extracted_data: {
              headline_ctc: ctcVal > 0 ? `₹${(ctcVal/100000).toFixed(1)}L` : undefined,
              gross_takehome: raw.CTC_Breakdown?.Estimated_Monthly_In_Hand ? `₹${(raw.CTC_Breakdown.Estimated_Monthly_In_Hand * 12 / 100000).toFixed(2)}L` : undefined,
              pf_inclusion: raw.Database_Payload?.employer_pf_included ?? true,
              notice_period_days: raw.Database_Payload?.notice_period_days || raw.Offer_Metadata?.Notice_Period_Days || 30,
              clawback_clause: raw.Database_Payload?.bond_or_clawback_detected || raw.Offer_Metadata?.Bond_or_Clawback_Detected || false,
              ...raw
            },
            rejection_reason: ov?.rejection_reason || item.rejection_reason,
            internal_notes: ov?.internal_notes || [],
          });
        }
      });
    }

    // 3. Check offer_letters table (Structured payload table from public site)
    if (letRes.data && letRes.data.length > 0) {
      letRes.data.forEach((item) => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          const ov = overrides[item.id];
          const totalCalc = (item.fixed_base || 0) + (item.variable_pay || 0) + (item.hra || 0) + (item.special_allowance || 0) + (item.pf || 0) + (item.joining_bonus || 0);
          records.push({
            id: item.id,
            submitted_at: item.created_at || new Date().toISOString(),
            city: item.work_model || 'Unspecified',
            domain: item.role || 'Tech Engineering',
            ctc_band: totalCalc > 0 ? `₹${Math.round(totalCalc/100000)}L` : 'Unspecified',
            role_category: item.role || 'Unspecified',
            employer_sector: item.company_tier || item.company_name || 'Tech / SaaS',
            trap_flags: item.bond_or_clawback_detected ? ['Bond / Clawback Clause Detected'] : [],
            counter_offer_shown: totalCalc > 0 ? `₹${Math.round((totalCalc * 1.15)/100000)}L` : 'N/A',
            negotiation_email: `Dear Hiring Manager,\n\nThank you for extending the offer for the ${item.role || 'position'}. Based on market benchmarking for my experience level, I would like to request a revision to the fixed base structure.\n\nBest regards,\nCandidate`,
            anomaly_score: (item.notice_period_days || 0) > 60 ? 25 : 10,
            status: ov?.status || (item.status as any) || 'pending',
            extracted_data: {
              headline_ctc: totalCalc > 0 ? `₹${(totalCalc/100000).toFixed(1)}L` : undefined,
              gross_takehome: item.fixed_base ? `₹${((item.fixed_base + (item.hra || 0))/100000).toFixed(2)}L` : undefined,
              pf_inclusion: item.employer_pf_included ?? true,
              notice_period_days: item.notice_period_days || 30,
              clawback_clause: item.bond_or_clawback_detected || false,
              ...item
            },
            rejection_reason: ov?.rejection_reason || item.rejection_reason,
            internal_notes: ov?.internal_notes || [],
          });
        }
      });
    }
  } catch (e) {
    console.warn('Offer letter submissions fetch error:', e);
  }

  // Sort newest first
  records.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

  const userEmail = session?.email || 'employee@certifyd.in';

  return (
    <ConfidentialDataShield userEmail={userEmail} userRole={userRole} sectionName="Offer Letters Verification Database">
      <OffersClient initialRecords={JSON.parse(JSON.stringify(records))} userRole={userRole} />
    </ConfidentialDataShield>
  );
}
