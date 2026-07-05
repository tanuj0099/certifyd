import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ToastProvider } from '@/components/ui/Toast';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const { email, role } = session;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#080A0E] text-[#F0F6FC] font-sans selection:bg-[#F97316]/30 flex">
        {/* Fixed Navigation Sidebar */}
        <Sidebar userEmail={email} userRole={role} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col pl-[60px] lg:pl-[220px] min-w-0 transition-all duration-300">
          <TopBar userEmail={email} userRole={role} />

          <main className="flex-1 p-6 max-w-none w-full overflow-x-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
