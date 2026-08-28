'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, RefreshCw, LogOut, Check, Trash2, AlertTriangle, MessageSquare, Sun, Moon, CheckSquare, Calendar, FileText, Lightbulb } from 'lucide-react';
import { logoutAction } from '../../actions/authActions';
import { OpsNotification, getNotificationsAction, markNotificationReadAction, deleteNotificationAction, clearAllNotificationsAction } from '../../actions/opsActions';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { motion, AnimatePresence } from 'framer-motion';

interface TopBarProps {
  userEmail: string;
  userRole: 'SUPER_ADMIN' | 'TEAM_MEMBER';
  userPermissions?: any;
  userAvatar?: string;
}

export function TopBar({ userEmail, userRole, userPermissions, userAvatar }: TopBarProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lastSync, setLastSync] = useState<string>('Just now');
  const [syncing, setSyncing] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<OpsNotification[]>([]);
  const { isSupported, permission, isSubscribed, subscribeToPush } = usePushNotifications();

  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userEmail)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  const avatarToShow = userAvatar || defaultAvatar;

  useEffect(() => {
    let isMounted = true;
    async function loadNotifs() {
      try {
        const live = await getNotificationsAction(userEmail, userRole);
        if (isMounted && live) {
          setNotifications(live);
        }
      } catch (e) {}
    }
    loadNotifs();
    const interval = setInterval(loadNotifs, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [userEmail, userRole]);

  const visibleNotifs = notifications;
  const unreadCount = visibleNotifs.filter(n => !n.read).length || visibleNotifs.length;

  const syncTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      const diffSec = Math.floor((Date.now() - syncTimeRef.current) / 1000);
      if (diffSec < 60) {
        setLastSync('Just now');
      } else {
        setLastSync(`${Math.floor(diffSec / 60)}m ago`);
      }
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  async function handleManualSync() {
    setSyncing(true);
    try {
      const live = await getNotificationsAction(userEmail, userRole);
      if (live) setNotifications(live);
    } catch (e) {}
    setTimeout(() => {
      setSyncing(false);
      syncTimeRef.current = Date.now();
      setLastSync('Just now');
    }, 600);
  }

  useEffect(() => {
    const saved = localStorage.getItem('certifyd-ops-theme') as 'dark' | 'light' | null;
    if (saved === 'light') {
      setTheme('light');
      document.documentElement.classList.add('light');
    }
  }, []);

  function toggleTheme() {
    if (theme === 'dark') {
      setTheme('light');
      document.documentElement.classList.add('light');
      localStorage.setItem('certifyd-ops-theme', 'light');
    } else {
      setTheme('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('certifyd-ops-theme', 'dark');
    }
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
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin text-[#F97316]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Right section - User & Notifications */}
      <div className="flex items-center gap-4">
        {/* Role & Email Badge with DP Avatar */}
        <div className="hidden sm:flex items-center gap-2.5 px-3 py-1 rounded-xl bg-[#0F1218] border border-white/[0.06] text-xs font-mono">
          <img
            src={avatarToShow}
            alt="User DP"
            className="w-6 h-6 rounded-full border border-white/10 shrink-0 bg-[#080A0E] object-cover"
          />
          <span
            className={`px-1.5 py-0.5 rounded uppercase font-semibold text-[10px] ${
              userRole === 'SUPER_ADMIN'
                ? 'bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30'
                : 'bg-[#00D4A8]/15 text-[#00D4A8] border border-[#00D4A8]/30'
            }`}
          >
            {userRole === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 'EMPLOYEE'}
          </span>
          <span className="text-white font-medium truncate max-w-[150px]">{userEmail}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-[#0F1218] hover:bg-[#161B22] border border-white/[0.06] text-[#8B949E] hover:text-white transition-colors flex items-center justify-center"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-[#E8C547]" /> : <Moon className="w-4 h-4 text-[#3B82F6]" />}
        </button>

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
                      <Bell className="w-4 h-4 text-[#F97316]" />
                      <span className="text-sm font-semibold text-white">Notifications</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px] font-mono text-[#8B949E]">
                        {unreadCount}
                      </span>
                    </div>
                    {visibleNotifs.length > 0 && (
                      <button
                        onClick={async () => {
                          setNotifications([]);
                          await clearAllNotificationsAction(userEmail);
                        }}
                        className="text-xs text-[#8B949E] hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear all</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
                    {isSupported && !isSubscribed && permission !== 'denied' && (
                      <div className="p-3 bg-[#3B82F6]/10 border-b border-[#3B82F6]/20">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-[#3B82F6] font-medium">Enable Desktop/Mobile Push</p>
                          <button
                            onClick={async () => {
                              await subscribeToPush();
                            }}
                            className="text-[10px] bg-[#3B82F6] text-white px-2 py-1 rounded font-semibold hover:bg-[#2563EB] transition-colors"
                          >
                            Enable
                          </button>
                        </div>
                      </div>
                    )}
                    {visibleNotifs.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#8B949E] font-mono">
                        No new notifications ✓
                      </div>
                    ) : (
                      visibleNotifs.map((n) => (
                        <div
                          key={n.id}
                          onClick={async () => {
                            setNotifications((prev) => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                            await markNotificationReadAction(n.id);
                            if (n.link_url) {
                              setShowNotifs(false);
                              router.push(n.link_url);
                            }
                          }}
                          className={`p-3.5 hover:bg-white/[0.04] cursor-pointer transition-colors flex items-start gap-3 ${!n.read ? 'bg-white/[0.02]' : 'opacity-70'}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${
                              n.priority === 'high'
                                ? 'bg-[#F85149]/15 text-[#F85149] border border-[#F85149]/30 animate-pulse'
                                : n.type === 'task'
                                ? 'bg-[#00D4A8]/15 text-[#00D4A8] border border-[#00D4A8]/30'
                                : n.type === 'calendar'
                                ? 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30'
                                : n.type === 'note'
                                ? 'bg-[#E8C547]/15 text-[#E8C547] border border-[#E8C547]/30'
                                : n.type === 'marketing'
                                ? 'bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30'
                                : 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30'
                            }`}
                          >
                            {n.priority === 'high' ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : n.type === 'task' ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : n.type === 'calendar' ? (
                              <Calendar className="w-4 h-4" />
                            ) : n.type === 'note' ? (
                              <FileText className="w-4 h-4" />
                            ) : n.type === 'marketing' ? (
                              <Lightbulb className="w-4 h-4" />
                            ) : (
                              <MessageSquare className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#00D4A8] shrink-0" />}
                                {n.title}
                              </p>
                              <span className="text-[10px] font-mono text-[#8B949E] shrink-0">{n.time}</span>
                            </div>
                            <p className="text-xs text-[#8B949E] mt-0.5 leading-relaxed">{n.message}</p>
                          </div>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setNotifications((prev) => prev.filter((item) => item.id !== n.id));
                              await deleteNotificationAction(n.id);
                            }}
                            className="text-[#8B949E] hover:text-white p-1 transition-colors self-center shrink-0"
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
