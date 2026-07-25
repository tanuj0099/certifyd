import React from 'react';
import { getSession } from '@/lib/auth/session';
import { getOpsTasksAction, getTeamMembersAction } from '@/actions/opsActions';
import { TasksClient } from '@/components/ops/TasksClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TasksPage() {
  const session = await getSession();
  const currentUserRole = session?.role || 'SUPER_ADMIN';
  const currentUserEmail = session?.email || 'admin@certifyd.in';

  const [initialTasks, teamMembers] = await Promise.all([
    getOpsTasksAction(),
    getTeamMembersAction(),
  ]);

  return (
    <TasksClient
      initialTasks={initialTasks}
      teamMembers={teamMembers}
      currentUserRole={currentUserRole}
      currentUserEmail={currentUserEmail}
    />
  );
}
