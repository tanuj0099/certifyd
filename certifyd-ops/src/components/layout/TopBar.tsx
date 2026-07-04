'use client';

import React, { useState, useEffect } from 'react';
import { Bell, RefreshCw, LogOut, Check, Trash2, AlertTriangle, MessageSquare } from 'lucide-react';
import { logoutAction } from '../../actions/authActions';
import { motion, AnimatePresence } from 'framer-motion';

interface TopBarProps {
  userEmail: string;
  userRole: 'SUPER_ADMIN' | 'TEAM_MEMBER';
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  priority: 'high' | 'normal';
  type: 'submission' | 'contact' | 'system';
}

export function TopBar({ userEmail, userRole }: TopBarProps) {
  const [lastSync, setLastSync] = useState<string>('Just now');
  const [syncing, setSyncing] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Placement Cell Inquiry',
      message: 'New HIGH priority inquiry from Tier 1 Engineering College Placement Officer.',
      time: '10 min ago',
      priority: 'high',
      type: 'contact',
    },
    {
      id: '2',
      title: 'Submission Flagged',
      message: 'Resume submission #a3f2b1c9 flagged by team member for implausible CTC.',
      time: '25 min ago',
      priority: 'normal',
      type: 'submission',
    },
    {
      id: '3',
      title: 'Data Quality Alert',
      message: 'Market Pulse scraper returned 15% variance for Azure 104 in Bengaluru.',
      time: '1 hour ago',
      priority: 'normal',
      type: 'system',
    },
  ]);

  // Filter notifications for TEAM_MEMBER
  const visibleNotifs = notifications.filter((n) => {
    if (userRole === 'SUPER_ADMIN') return true;
    return n.type === 'submission';
  });

  const unreadCount = visibleNotifs.length;

  useEffect(() => {
    const timer = setInterval(() => {
      const times = ['Just now', '1m ago', '2m ago', '5m ago'];
      const randomTime = times[Math.floor(Math.random() * times.length)];
      setLastSync(randomTime);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  function handleManualSync() {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setLastSync('Just now');
    }, 800);
  }

  return (
    <header className="h-14 bg-[#080A0E]/90 backdrop-blur-md border-b border-white/[0.06] sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Left section - Last Sync & Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#161B22] border border-white/[0.04] text-xs font-mono text-[#8B949E]">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span>Supabase Connected</span>
          <span className="opacity-40">•</span>
          <span>Sync: {lastSync}</span>
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="ml-1 text-[#8B949E] hover:text-white transition-colors p-0.5"
            title="Force Manual Sync"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin text-[#00D4A8]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Right section - User & Notifications */}
      <div className="flex items-center gap-4">
        {/* Role & Email Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-[#0F1218] border border-white/[0.06] text-xs font-mono">
          <span
            className={`px-1.5 py-0.5 rounded uppercase font-semibold text-[10px] ${
              userRole === 'SUPER_ADMIN'
                ? 'bg-[#00D4A8]/15 text-[#00D4A8] border border-[#00D4A8]/30'
                : 'bg-white/10 text-[#8B949E] border border-white/10'
            }`}
          >
            {userRole === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 'TEAM'}
          </span>
          <span className="text-white font-medium">{userEmail}</span>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 rounded-xl bg-[#0F1218] hover:bg-[#161B22] border border-white/[0.06] text-[#8B949E] hover:text-white transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F85149] text-white text-[10px] font-mono flex items-center justify-center font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifs && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0F1218] border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#00D4A8]" />
                      <span className="text-sm font-semibold text-white">Notifications</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px] font-mono text-[#8B949E]">
                        {unreadCount}
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => setNotifications([])}
                        className="text-xs text-[#8B949E] hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear all</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
                    {visibleNotifs.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#8B949E] font-mono">
                        No new notifications ✓
                      </div>
                    ) : (
                      visibleNotifs.map((n) => (
                        <div key={n.id} className="p-3.5 hover:bg-white/[0.02] transition-colors flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${
                              n.priority === 'high'
                                ? 'bg-[#F85149]/15 text-[#F85149] border border-[#F85149]/30 animate-pulse'
                                : n.type === 'submission'
                                ? 'bg-[#E8C547]/15 text-[#E8C547] border border-[#E8C547]/30'
                                : 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30'
                            }`}
                          >
                            {n.priority === 'high' ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : (
                              <MessageSquare className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                              <span className="text-[10px] font-mono text-[#8B949E] shrink-0">{n.time}</span>
                            </div>
                            <p className="text-xs text-[#8B949E] mt-0.5 leading-relaxed">{n.message}</p>
                          </div>
                          <button
                            onClick={() => setNotifications((prev) => prev.filter((item) => item.id !== n.id))}
                            className="text-[#8B949E] hover:text-white p-1 transition-colors self-center"
                            title="Dismiss"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => logoutAction()}
          className="p-2 rounded-xl bg-[#0F1218] hover:bg-[#F85149]/10 border border-white/[0.06] text-[#8B949E] hover:text-[#F85149] transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
