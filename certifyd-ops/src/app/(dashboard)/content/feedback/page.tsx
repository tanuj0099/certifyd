import React from 'react';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { FeedbackClient, FeedbackRecord } from '@/components/content/FeedbackClient';

export const revalidate = 0;

export default async function FeedbackPage() {
  const session = await getSession();
  const userRole = session?.role || 'SUPER_ADMIN';

  let records: FeedbackRecord[] = [];

  try {
    const { data, error } = await supabaseAdmin
      .from('feedback_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      records = data.map((item) => ({
        id: item.id,
        created_at: item.created_at || new Date().toISOString(),
        tool: item.tool || item.tool_used || 'ROI Calculator',
        rating: item.rating || 5,
        sentiment: item.sentiment || item.category || 'Positive',
        message: item.message || item.full_feedback || item.excerpt || 'Great tool!',
        user_id: item.user_id || 'user_0011',
        submission_id: item.submission_id,
        submission_type: item.submission_type,
        status: (item.status as any) || 'New',
        device_info: item.device_info || 'Chrome / MacOS',
        internal_notes: Array.isArray(item.internal_notes) ? item.internal_notes : [],
      }));
    }
  } catch (e) {
    console.warn('Feedback fetch error:', e);
  }

  return <FeedbackClient initialRecords={records} userRole={userRole} />;
}
