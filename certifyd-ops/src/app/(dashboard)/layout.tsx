import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getTeamMembersAction } from '@/actions/opsActions';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { ToastProvider } from '@/components/ui/Toast';
import { PresenceProvider } from '@/components/layout/PresenceProvider';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const { email, role } = session;

  let currentPermissions = session.permissions;
  let currentAvatar = session.avatar_url;

  try {
    const members = await getTeamMembersAction();
    const currentMember = members.find((m) => m.email.toLowerCase() === email.toLowerCase());
    if (currentMember) {
      currentPermissions = currentMember.permissions || currentPermissions;
      currentAvatar = currentMember.avatar_url || currentAvatar;
    }
  } catch (e) {}

  return (
    <ToastProvider>
      <PresenceProvider userEmail={email} userName={email.split('@')[0]}>
        <DashboardShell
          userEmail={email}
          userRole={role}
          userPermissions={currentPermissions}
          userAvatar={currentAvatar}
        >
          {children}
        </DashboardShell>
      </PresenceProvider>
    </ToastProvider>
  );
}
