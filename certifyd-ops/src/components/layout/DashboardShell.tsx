'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface DashboardShellProps {
  userEmail: string;
  userRole: 'SUPER_ADMIN' | 'TEAM_MEMBER';
  userPermissions?: any;
  userAvatar?: string;
  children: React.ReactNode;
}

export function DashboardShell({
  userEmail,
  userRole,
  userPermissions,
  userAvatar,
  children,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('certifyd_sidebar_collapsed');
    if (saved === 'true') {
      setCollapsed(true);
    }
  }, []);

  function handleToggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('certifyd_sidebar_collapsed', String(next));
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-[#080A0E] text-[#F0F6FC] font-sans selection:bg-[#F97316]/30 flex">
      {/* Fixed Navigation Sidebar with coordinated collapsed state */}
      <Sidebar
        userEmail={userEmail}
        userRole={userRole}
        userPermissions={userPermissions}
        userAvatar={userAvatar}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area whose padding dynamically adjusts with the sidebar dimensions */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'pl-[60px]' : 'pl-[220px]'
        }`}
      >
        <TopBar
          userEmail={userEmail}
          userRole={userRole}
          userPermissions={userPermissions}
          userAvatar={userAvatar}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-none w-full overflow-x-auto transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
