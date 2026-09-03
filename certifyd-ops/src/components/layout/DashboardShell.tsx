'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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
  const pathname = usePathname();

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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-none w-full overflow-x-hidden transition-all duration-300">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
