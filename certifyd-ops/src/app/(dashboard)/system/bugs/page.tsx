import React from 'react';
import { BugsKanbanClient } from './BugsKanbanClient';
import { getBugsAction } from '../../../../actions/opsActions';
import { cookies } from 'next/headers';
import { decryptSession } from '../../../../lib/auth/session';

export const metadata = {
  title: 'Bug Tracker | Certifyd Ops',
};

export default async function BugsPage() {
  const initialBugs = await getBugsAction();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session')?.value;
  let userEmail = 'unknown@certifyd.com';
  if (sessionCookie) {
    const payload = await decryptSession(sessionCookie);
    if (payload && payload.email) {
      userEmail = payload.email;
    }
  }

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-6rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400">
          QA & Bug Tracker
        </h1>
        <p className="text-[#8B949E] mt-2">
          Track and manage system issues. Drag and drop cards to update status.
        </p>
      </div>

      <div className="flex-1 min-h-0 bg-[#0D1117] rounded-xl border border-white/[0.06] shadow-xl overflow-hidden flex flex-col">
        <BugsKanbanClient initialBugs={initialBugs} userEmail={userEmail} />
      </div>
    </div>
  );
}
