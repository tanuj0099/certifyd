import React from 'react';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { SettingsClient, AdminUserRecord } from '@/components/system/SettingsClient';

export const revalidate = 0;

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || (session.role !== 'SUPER_ADMIN' && !session.permissions?.access_technical)) {
    redirect('/');
  }

  let admins: AdminUserRecord[] = [];

  try {
    const { data, error } = await supabaseAdmin.from('admin_users_allowlist').select('*').order('added_at');
    if (data && data.length > 0) {
      admins = data.map((a) => ({
        email: a.email,
        role: (a.role as any) || 'TEAM_MEMBER',
        added_at: a.added_at || new Date().toISOString(),
      }));
    }
  } catch (e) {
    console.warn('Admin users allowlist fetch error (using defaults):', e);
  }

  if (admins.length === 0) {
    const envEmails = (process.env.ALLOWED_EMAILS || 'admin@certifyd.in,superadmin@certifyd.in,team@certifyd.in')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    admins = envEmails.map((email, idx) => ({
      email,
      role: idx === 0 || email.includes('admin') ? 'SUPER_ADMIN' : 'TEAM_MEMBER',
      added_at: new Date(Date.now() - (idx + 1) * 864000000).toISOString(),
    }));
  }

  return <SettingsClient initialAdmins={admins} currentAdminEmail={session.email} />;
}
