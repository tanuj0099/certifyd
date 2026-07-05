import React from 'react';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { AuditClient, AuditRecord } from '@/components/system/AuditClient';

export const revalidate = 0;

export default async function AuditPage() {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  let logs: AuditRecord[] = [];

  try {
    const { data, error } = await supabaseAdmin
      .from('audit_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(200);

    if (data && data.length > 0) {
      logs = data.map((l) => ({
        id: l.id,
        timestamp: l.timestamp || new Date().toISOString(),
        admin_email: l.admin_email || session?.email || 'admin@certifyd.in',
        admin_role: l.admin_role || 'SUPER_ADMIN',
        action_type: l.action_type || 'UPDATE_STATUS',
        target_table: l.target_table || 'resume_submissions',
        target_id: l.target_id,
        ip_address: l.ip_address || '103.21.244.0 (CF)',
        old_value: l.old_value,
        new_value: l.new_value,
      }));
    }
  } catch (e) {
    console.warn('Audit logs fetch error:', e);
  }

  return <AuditClient initialLogs={logs} />;
}
