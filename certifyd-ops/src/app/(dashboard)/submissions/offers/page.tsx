import React from 'react';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { OffersClient, OfferRecord } from '@/components/submissions/OffersClient';

export const revalidate = 0;

export default async function OffersPage() {
  const session = await getSession();
  const userRole = session?.role || 'SUPER_ADMIN';

  let records: OfferRecord[] = [];

  try {
    const { data, error } = await supabaseAdmin
      .from('offer_letter_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (data && data.length > 0) {
      records = data.map((item) => ({
        id: item.id,
        submitted_at: item.submitted_at || new Date().toISOString(),
        city: item.city || 'Bengaluru',
        domain: item.domain || 'Cloud Engineering',
        ctc_band: item.ctc_band || '₹10L - ₹15L',
        role_category: item.role_category || 'Cloud Engineer',
        employer_sector: item.employer_sector || 'Product / SaaS',
        trap_flags: Array.isArray(item.trap_flags) ? item.trap_flags : [],
        counter_offer_shown: item.counter_offer_shown || '₹14.2L',
        negotiation_email: item.negotiation_email || 'Dear Hiring Manager,\n\nThank you for the offer...',
        anomaly_score: item.anomaly_score || 20,
        status: (item.status as any) || 'pending',
        extracted_data: item.extracted_data || { headline_ctc: '₹12.5L', gross_takehome: '₹11.2L' },
        rejection_reason: item.rejection_reason,
        internal_notes: Array.isArray(item.internal_notes) ? item.internal_notes : [],
      }));
    }
  } catch (e) {
    console.warn('Offer letter submissions fetch error (using fallback defaults):', e);
  }


  return <OffersClient initialRecords={records} userRole={userRole} />;
}
