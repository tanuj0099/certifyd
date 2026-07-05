import React from 'react';
import { getSession } from '@/lib/auth/session';
import { getOpsNotesAction } from '@/actions/opsActions';
import { NotesClient } from '@/components/ops/NotesClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NotesPage() {
  const session = await getSession();
  const currentUserRole = session?.role || 'SUPER_ADMIN';
  const currentUserEmail = session?.email || 'admin@certifyd.in';

  const initialNotes = await getOpsNotesAction();

  return (
    <NotesClient
      initialNotes={initialNotes}
      currentUserRole={currentUserRole}
      currentUserEmail={currentUserEmail}
    />
  );
}
