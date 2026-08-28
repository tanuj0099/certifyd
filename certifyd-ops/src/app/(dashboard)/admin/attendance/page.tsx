import React from 'react';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getAttendanceLogsAction } from '@/actions/attendanceActions';
import { AttendanceClient } from './AttendanceClient';
import { getTeamMembersAction } from '@/actions/opsActions';

export default async function AttendancePage() {
  const session = await getSession();
  if (!session || (session.role !== 'SUPER_ADMIN' && session.email !== 'admin@certifyd.in')) {
    redirect('/ops/tasks');
  }

  const { logs } = await getAttendanceLogsAction();
  const members = await getTeamMembersAction();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Real-Time Attendance</h1>
        <p className="text-sm text-[#8B949E] mt-1">
          Monitor employee active time and presence for today. Heartbeats pause after 7 minutes of inactivity.
        </p>
      </div>

      <AttendanceClient initialLogs={logs} teamMembers={members} />
    </div>
  );
}
