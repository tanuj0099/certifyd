import React from 'react';
import { getSession } from '@/lib/auth/session';
import { getTeamMembersAction } from '@/actions/opsActions';
import { TeamClient } from '@/components/ops/TeamClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamPage() {
  const session = await getSession();
  const currentUserRole = session?.role || 'SUPER_ADMIN';
  const currentUserEmail = session?.email || 'admin@certifyd.in';

  const initialTeam = await getTeamMembersAction();

  return (
    <TeamClient
      initialTeam={initialTeam}
      currentUserRole={currentUserRole}
      currentUserEmail={currentUserEmail}
    />
  );
}
