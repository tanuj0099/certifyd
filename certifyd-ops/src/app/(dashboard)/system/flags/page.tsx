import React from 'react';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { FlagsClient, FlagRecord } from '@/components/system/FlagsClient';

export const revalidate = 0;

export default async function FlagsPage() {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  let flags: FlagRecord[] = [];

  try {
    const { data, error } = await supabaseAdmin.from('feature_flags').select('*');
    if (data && data.length > 0) {
      flags = data.map((f) => ({
        flag_key: f.flag_name || f.flag_key,
        name: f.name || f.flag_name || f.flag_key,
        description: f.description || 'System runtime control flag',
        is_enabled: f.enabled !== undefined ? !!f.enabled : !!f.is_enabled,
        updated_by: f.updated_by || 'tanuj@x.com',
        updated_at: f.updated_at || new Date().toISOString(),
      }));
    }
  } catch (e) {
    console.warn('Feature flags fetch error:', e);
  }

  return <FlagsClient initialFlags={flags} />;
}
