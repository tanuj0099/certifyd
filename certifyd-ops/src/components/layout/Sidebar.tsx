'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useToast } from '../ui/Toast';
import {
  LayoutDashboard,
  BarChart2,
  FileText,
  Briefcase,
  Award,
  Database,
  MessageSquare,
  Mail,
  ToggleRight,
  ShieldCheck,
  Settings,
  Lock,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
  CheckSquare,
  Calendar,
  Users,
} from 'lucide-react';
import { logoutAction } from '../../actions/authActions';

interface SidebarProps {
  userEmail: string;
  userRole: 'SUPER_ADMIN' | 'TEAM_MEMBER';
}

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  BarChart2,
  FileText,
  Briefcase,
  Award,
  Database,
  MessageSquare,
  Mail,
  ToggleRight,
  ShieldCheck,
  Settings,
  CheckSquare,
  Calendar,
  Users,
};

export function Sidebar({ userEmail, userRole }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { showToast } = useToast();

  const groups = [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', href: '/', icon: 'LayoutDashboard', restricted: false },
        { name: 'Analytics', href: '/analytics', icon: 'BarChart2', restricted: false },
      ],
    },
    {
      title: 'Team Workspace',
      items: [
        { name: 'Task Delegation', href: '/ops/tasks', icon: 'CheckSquare', restricted: false },
        { name: 'Team Calendar', href: '/ops/calendar', icon: 'Calendar', restricted: false },
        { name: 'Notes & Comments', href: '/ops/notes', icon: 'FileText', restricted: false },
        { name: 'Team Access', href: '/ops/team', icon: 'Users', restricted: true, superAdminOnly: true },
      ],
    },
    {
      title: 'Submissions',
      items: [
        { name: 'Resume Uploads', href: '/submissions/resumes', icon: 'FileText', restricted: false },
        { name: 'Offer Letters', href: '/submissions/offers', icon: 'Briefcase', restricted: false },
      ],
    },
    {
      title: 'Data Management',
      items: [
        { name: 'Certifications', href: '/data/certifications', icon: 'Award', restricted: false, publishLock: true },
        { name: 'Market Jobs', href: '/data/jobs', icon: 'Database', restricted: false, publishLock: true },
      ],
    },
    {
      title: 'Content',
      items: [
        { name: 'User Feedback', href: '/content/feedback', icon: 'MessageSquare', restricted: false },
        { name: 'Contact Messages', href: '/content/contacts', icon: 'Mail', restricted: false },
      ],
    },
    {
      title: 'System',
      superAdminOnly: true,
      items: [
        { name: 'Feature Flags', href: '/system/flags', icon: 'ToggleRight', restricted: true },
        { name: 'Audit Log', href: '/system/audit', icon: 'ShieldCheck', restricted: true },
        { name: 'Settings', href: '/system/settings', icon: 'Settings', restricted: true },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#080A0E] border-r border-white/[0.06] transition-all duration-300 flex flex-col ${
        collapsed ? 'w-[60px]' : 'w-[220px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 border-b border-white/[0.06] flex items-center justify-between px-3.5 shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center text-[#F97316] shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-white tracking-tight truncate">Certifyd Ops</span>
              <span className="text-[10px] font-mono text-[#8B949E]">ADMIN SUITE</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg hover:bg-white/[0.04] text-[#8B949E] hover:text-white transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Groups */}
      <div className="flex-1 overflow-y-auto p-2 space-y-5 scrollbar-none">
        {groups.map((group) => {
          // Hide System section entirely for TEAM_MEMBER
          if (group.superAdminOnly && userRole !== 'SUPER_ADMIN') return null;

          return (
            <div key={group.title}>
              {!collapsed && (
                <p className="text-[10px] font-mono text-[#8B949E]/60 uppercase tracking-wider px-2.5 mb-1.5 font-semibold">
                  {group.title}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.filter((item) => !((item as any).superAdminOnly && userRole !== 'SUPER_ADMIN')).map((item) => {
                  const Icon = ICON_MAP[item.icon] || LayoutDashboard;
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  const isLocked = item.restricted && userRole !== 'SUPER_ADMIN';
                  const showPublishLock = Boolean(('publishLock' in item && item.publishLock) && userRole === 'TEAM_MEMBER');

                  if (isLocked) {
                    return (
                      <button
                        key={item.name}
                        onClick={() =>
                          showToast('Insufficient permissions. Super Admin privileges required.', 'warning')
                        }
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-[#8B949E]/50 hover:bg-white/[0.02] cursor-not-allowed transition-colors ${
                          collapsed ? 'justify-center' : ''
                        }`}
                        title={collapsed ? `${item.name} (Locked)` : undefined}
                      >
                        <Icon className="w-4 h-4 shrink-0 opacity-40" />
                        {!collapsed && (
                          <div className="flex items-center justify-between flex-1 overflow-hidden">
                            <span className="truncate">{item.name}</span>
                            <Lock className="w-3 h-3 text-[#E8C547] shrink-0" />
                          </div>
                        )}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20 shadow-sm'
                          : 'text-[#8B949E] hover:text-white hover:bg-white/[0.04]'
                      } ${collapsed ? 'justify-center' : ''}`}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#F97316]' : ''}`} />
                      {!collapsed && (
                        <div className="flex items-center justify-between flex-1 overflow-hidden">
                          <span className="truncate">{item.name}</span>
                          {showPublishLock && (
                            <span title="Team Member: Staging edit only" className="text-[10px] text-[#E8C547] flex items-center gap-0.5 font-mono">
                              <Lock className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="border-t border-white/[0.06] p-2.5 shrink-0 bg-[#0F1218]">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2 bg-[#161B22] p-2 rounded-xl border border-white/[0.04]">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-mono font-medium text-white truncate" title={userEmail}>
                {userEmail.split('@')[0]}
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded inline-block w-fit uppercase font-semibold mt-0.5 ${
                  userRole === 'SUPER_ADMIN'
                    ? 'bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30'
                    : 'bg-white/10 text-[#8B949E] border border-white/10'
                }`}
              >
                {userRole === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 'TEAM'}
              </span>
            </div>
            <button
              onClick={() => logoutAction()}
              className="p-1.5 rounded-lg text-[#8B949E] hover:text-[#F85149] hover:bg-[#F85149]/10 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => logoutAction()}
            className="w-full flex items-center justify-center p-2 rounded-xl bg-[#161B22] text-[#8B949E] hover:text-[#F85149] hover:bg-[#F85149]/10 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
