import React from 'react';
import { getSession } from '@/lib/auth/session';
import { getCalendarEventsAction, getOpsTasksAction, getTeamMembersAction, OpsCalendarEvent } from '@/actions/opsActions';
import { CalendarClient } from '@/components/ops/CalendarClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CalendarPage() {
  const session = await getSession();
  const currentUserRole = session?.role || 'SUPER_ADMIN';
  const currentUserEmail = session?.email || 'admin@certifyd.in';

  const [events, tasks, teamMembers] = await Promise.all([
    getCalendarEventsAction(),
    getOpsTasksAction(),
    getTeamMembersAction(),
  ]);

  const taskEvents: OpsCalendarEvent[] = tasks
    .filter((t) => t.deadline)
    .map((t) => ({
      id: `task-deadline-${t.id}`,
      title: `[Task Deadline] ${t.title} (${t.assignee || 'Unassigned'})`,
      date: t.deadline,
      time: '5:00 PM',
      section: t.section || 'admin',
      is_private: false,
      assignee: t.assignee,
      created_by: t.assignee || t.created_by || 'Task Engine',
      created_at: t.created_at || new Date().toISOString(),
    }));

  const initialEvents = [...events, ...taskEvents];

  return (
    <CalendarClient
      initialEvents={initialEvents}
      currentUserRole={currentUserRole}
      currentUserEmail={currentUserEmail}
      teamMembers={teamMembers}
    />
  );
}
