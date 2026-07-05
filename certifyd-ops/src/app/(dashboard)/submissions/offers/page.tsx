import React from 'react';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { OffersClient, OfferRecord } from '@/components/submissions/OffersClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function OffersPage() {
  const session = await getSession();
  const userRole = session?.role || 'SUPER_ADMIN';

  let records: OfferRecord[] = [];
  const seenIds = new Set<string>();

  try {
    const [subRes, altRes] = await Promise.all([
      supabaseAdmin.from('offer_letter_submissions').select('*').order('submitted_at', { ascending: false }).limit(2000),
      supabaseAdmin.from('offer_analyses').select('*').limit(2000),
    ]);

    if (subRes.data && subRes.data.length > 0) {
      subRes.data.forEach((item) => {
        seenIds.add(item.id);
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
          status: (item.status as any) || 'pending',
          extracted_data: item.extracted_data || {},
          rejection_reason: item.rejection_reason,
          internal_notes: Array.isArray(item.internal_notes) ? item.internal_notes : [],
        });
      });
    }

    if (altRes.data && altRes.data.length > 0) {
      altRes.data.forEach((item) => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          records.push({
            id: item.id,
            submitted_at: item.created_at || new Date().toISOString(),
            city: item.location || 'Unspecified',
            domain: item.role || item.title || 'General Tech',
            ctc_band: item.ctc_stated ? `₹${Math.round(item.ctc_stated/100000)}L` : 'Unspecified',
            role_category: item.role || item.title || 'Unspecified',
            employer_sector: item.company_tier || 'Tech',
            trap_flags: Array.isArray(item.red_flags) ? item.red_flags : [],
            counter_offer_shown: item.target_compensation ? `₹${Math.round(item.target_compensation/100000)}L` : 'N/A',
            negotiation_email: item.email_script || 'N/A',
            anomaly_score: 10,
            status: 'pending',
            extracted_data: item || {},
            rejection_reason: undefined,
            internal_notes: [],
          });
        }
      });
    }
  } catch (e) {
    console.warn('Offer letter submissions fetch error:', e);
  }

  // Sort newest first
  records.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

  return <OffersClient initialRecords={records} userRole={userRole} />;
}
