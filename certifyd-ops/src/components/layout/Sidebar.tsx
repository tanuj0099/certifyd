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
  userPermissions?: any;
  userAvatar?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
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

export function Sidebar({
  userEmail,
  userRole,
  userPermissions,
  userAvatar,
  collapsed: externalCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const pathname = usePathname();
  const { showToast } = useToast();

  const handleToggle = () => {
    if (onToggleCollapse) onToggleCollapse();
    else setInternalCollapsed(!internalCollapsed);
  };

  const isEmployee = userRole === 'TEAM_MEMBER';
  const hasTechAccess = userRole === 'SUPER_ADMIN' || userPermissions?.access_technical === true;

  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userEmail)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  const avatarToShow = userAvatar || defaultAvatar;

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
        { name: 'Demand Observations', href: '/data/demand', icon: 'Database', restricted: false },
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
        { name: 'Feature Flags', href: '/system/flags', icon: 'ToggleRight', restricted: !hasTechAccess },
        { name: 'Audit Log', href: '/system/audit', icon: 'ShieldCheck', restricted: true },
        { name: 'Settings', href: '/system/settings', icon: 'Settings', restricted: !hasTechAccess },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#080A0E] border-r border-white/[0.06] transition-all duration-300 flex flex-col ${
        collapsed ? 'w-[60px]' : 'w-[220px]'
      }`}
    >
      {/* Brand Header optimized for Super Admin vs Employee */}
      <div className="h-14 border-b border-white/[0.06] flex items-center justify-between px-3.5 shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
              isEmployee
                ? 'bg-[#00D4A8]/10 border-[#00D4A8]/20 text-[#00D4A8]'
                : 'bg-[#F97316]/10 border-[#F97316]/20 text-[#F97316]'
            }`}
          >
            <Shield className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-white tracking-tight truncate">Certifyd Ops</span>
              <span
                className={`text-[10px] font-mono tracking-wider font-semibold ${
                  isEmployee ? 'text-[#00D4A8]' : 'text-[#8B949E]'
                }`}
              >
                {isEmployee ? 'OPS WORKSPACE' : 'ADMIN SUITE'}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={handleToggle}
          className="p-1 rounded-lg hover:bg-white/[0.04] text-[#8B949E] hover:text-white transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Groups */}
      <div className="flex-1 overflow-y-auto p-2 space-y-5 scrollbar-none">
        {groups.map((group) => {
          // Hide System section ONLY if user is not Super Admin AND has no Tech access
          if (group.superAdminOnly && !hasTechAccess) return null;

          return (
            <div key={group.title}>
              {!collapsed && (
                <p className="text-[10px] font-mono text-[#8B949E]/60 uppercase tracking-wider px-2.5 mb-1.5 font-semibold">
                  {group.title}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items
                  .filter((item) => !((item as any).superAdminOnly && userRole !== 'SUPER_ADMIN'))
                  .map((item) => {
                    const Icon = ICON_MAP[item.icon] || LayoutDashboard;
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    const isLocked = item.restricted && userRole !== 'SUPER_ADMIN' && !hasTechAccess;
                    const showPublishLock = Boolean(('publishLock' in item && item.publishLock) && userRole === 'TEAM_MEMBER');

                    if (isLocked) {
                      return (
                        <button
                          key={item.name}
                          onClick={() =>
                            showToast('Insufficient permissions. Privileges required for this action.', 'warning')
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

      {/* User Footer with Avatar / DP */}
      <div className="border-t border-white/[0.06] p-2.5 shrink-0 bg-[#0F1218]">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2.5 bg-[#161B22] p-2 rounded-xl border border-white/[0.04]">
            <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
              <img
                src={avatarToShow}
                alt="DP"
                className="w-8 h-8 rounded-full border border-white/10 shrink-0 bg-[#080A0E] object-cover"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-mono font-medium text-white truncate" title={userEmail}>
                  {userEmail.split('@')[0]}
                </span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded inline-block w-fit uppercase font-semibold mt-0.5 ${
                    userRole === 'SUPER_ADMIN'
                      ? 'bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30'
                      : 'bg-[#00D4A8]/15 text-[#00D4A8] border border-[#00D4A8]/30'
                  }`}
                >
                  {userRole === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 'EMPLOYEE'}
                </span>
              </div>
            </div>
            <button
              onClick={() => logoutAction()}
              className="p-1.5 rounded-lg text-[#8B949E] hover:text-[#F85149] hover:bg-[#F85149]/10 transition-colors shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <img
              src={avatarToShow}
              alt="DP"
              className="w-8 h-8 rounded-full border border-white/10 bg-[#080A0E] object-cover"
              title={userEmail}
            />
            <button
              onClick={() => logoutAction()}
              className="w-full flex items-center justify-center p-2 rounded-xl bg-[#161B22] text-[#8B949E] hover:text-[#F85149] hover:bg-[#F85149]/10 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
