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
  Lightbulb,
  Bug,
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
  Lightbulb,
  Bug,
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

  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userEmail)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  const avatarToShow = userAvatar || defaultAvatar;

  const groups = [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', href: '/', icon: 'LayoutDashboard', requiredPermission: null },
        { name: 'Analytics', href: '/analytics', icon: 'BarChart2', requiredPermission: null },
      ],
    },
    {
      title: 'Team Workspace',
      items: [
        { name: 'My Assigned Work', href: '/ops/my-work', icon: 'Award', requiredPermission: null },
        { name: 'Task Delegation', href: '/ops/tasks', icon: 'CheckSquare', requiredPermission: null },
        { name: 'Team Calendar', href: '/ops/calendar', icon: 'Calendar', requiredPermission: null },
        { name: 'Notes & Comments', href: '/ops/notes', icon: 'FileText', requiredPermission: null },
        { name: 'Team Access', href: '/ops/team', icon: 'Users', superAdminOnly: true, requiredPermission: 'access_admin' },
      ],
    },
    {
      title: 'Marketing Hub',
      items: [
        { name: 'Ideas & Scripts', href: '/marketing/ideas', icon: 'Lightbulb', requiredPermission: 'access_marketing' },
      ],
    },
    {
      title: 'Submissions',
      items: [
        { name: 'Resume Uploads', href: '/submissions/resumes', icon: 'FileText', requiredPermission: 'access_verifications' },
        { name: 'Offer Letters', href: '/submissions/offers', icon: 'Briefcase', requiredPermission: 'access_verifications' },
      ],
    },
    {
      title: 'Data Management',
      items: [
        { name: 'Certifications', href: '/data/certifications', icon: 'Award', requiredPermission: 'access_database', publishLock: true },
        { name: 'Market Jobs', href: '/data/jobs', icon: 'Database', requiredPermission: 'access_database', publishLock: true },
        { name: 'Demand Observations', href: '/data/demand', icon: 'Database', requiredPermission: 'access_database' },
      ],
    },
    {
      title: 'Content',
      items: [
        { name: 'User Feedback', href: '/content/feedback', icon: 'MessageSquare', requiredPermission: 'access_content' },
        { name: 'Contact Messages', href: '/content/contacts', icon: 'Mail', requiredPermission: 'access_content' },
      ],
    },
    {
      title: 'System',
      items: [
        { name: 'Bug Reports', href: '/system/bugs', icon: 'Bug', requiredPermission: 'access_technical' },
        { name: 'Feature Flags', href: '/system/flags', icon: 'ToggleRight', requiredPermission: 'access_technical' },
        { name: 'Audit Log', href: '/system/audit', icon: 'ShieldCheck', superAdminOnly: true, requiredPermission: 'access_technical' },
        { name: 'Settings', href: '/system/settings', icon: 'Settings', requiredPermission: null },
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
          const visibleItems = group.items.filter((item) => {
            if ((item as any).superAdminOnly && userRole !== 'SUPER_ADMIN') return false;
            if (userRole !== 'SUPER_ADMIN' && item.requiredPermission) {
              if (!userPermissions || !userPermissions[item.requiredPermission]) {
                return false;
              }
            }
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title}>
              {!collapsed && (
                <p className="text-[10px] font-mono text-[#8B949E]/60 uppercase tracking-wider px-2.5 mb-1.5 font-semibold">
                  {group.title}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = ICON_MAP[item.icon] || LayoutDashboard;
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  const showPublishLock = Boolean(('publishLock' in item && item.publishLock) && userRole === 'TEAM_MEMBER');

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
