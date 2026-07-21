import React from 'react';
import { getSession } from '@/lib/auth/session';
import {
  getOpsTasksAction,
  getCalendarEventsAction,
  getOpsNotesAction,
  getMarketingIdeasAction,
  getTeamMembersAction,
} from '@/actions/opsActions';
import { MyWorkClient } from '@/components/ops/MyWorkClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MyWorkPage() {
  const session = await getSession();
  const currentUserRole = session?.role || 'SUPER_ADMIN';
  const currentUserEmail = session?.email || 'admin@certifyd.in';

  const [tasks, events, notes, marketingIdeas, teamMembers] = await Promise.all([
    getOpsTasksAction(),
    getCalendarEventsAction(),
    getOpsNotesAction(),
    getMarketingIdeasAction(),
    getTeamMembersAction(),
  ]);

  return (
    <MyWorkClient
      initialTasks={tasks}
      initialEvents={events}
      initialNotes={notes}
      initialMarketingIdeas={marketingIdeas}
      teamMembers={teamMembers}
      currentUserRole={currentUserRole}
      currentUserEmail={currentUserEmail}
    />
  );
}
