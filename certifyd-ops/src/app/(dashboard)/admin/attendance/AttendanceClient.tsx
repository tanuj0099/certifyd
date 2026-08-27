'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Clock, MonitorPlay, Moon } from 'lucide-react';
import { getAttendanceLogsAction } from '@/actions/attendanceActions';
import { motion } from 'framer-motion';

export function AttendanceClient({ initialLogs, teamMembers }: { initialLogs: any[], teamMembers: any[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [loading, setLoading] = useState(false);

  async function loadLogs() {
    try {
      const freshLogs = await getAttendanceLogsAction();
      setLogs(freshLogs);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    const interval = setInterval(loadLogs, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  function getStatus(lastPing: string) {
    const diffSeconds = (Date.now() - new Date(lastPing).getTime()) / 1000;
    if (diffSeconds < 90) return 'active';
    if (diffSeconds < 7 * 60 + 60) return 'idle'; // Within 7 minutes threshold
    return 'offline';
  }

  return (
    <div className="bg-white dark:bg-[#0F1218] rounded-2xl border border-gray-200 dark:border-white/[0.06] shadow-sm overflow-hidden transition-colors">
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06]">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          Today's Activity
        </h2>
        <button
          onClick={async () => {
            setLoading(true);
            await loadLogs();
            setLoading(false);
          }}
          disabled={loading}
          className="text-gray-500 dark:text-[#8B949E] hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.06]">
            <tr>
              <th className="px-5 py-3 font-medium text-gray-500 dark:text-[#8B949E]">Employee</th>
              <th className="px-5 py-3 font-medium text-gray-500 dark:text-[#8B949E]">First Seen</th>
              <th className="px-5 py-3 font-medium text-gray-500 dark:text-[#8B949E]">Status</th>
              <th className="px-5 py-3 font-medium text-gray-500 dark:text-[#8B949E] text-right">Active Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-400 dark:text-[#8B949E]">
                  No activity logged yet today.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const member = teamMembers.find(m => m.email.toLowerCase() === log.user_email.toLowerCase());
                const status = getStatus(log.last_ping);
                
                return (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={log.id} 
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img 
                          src={member?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${log.user_email}`} 
                          alt="" 
                          className="w-8 h-8 rounded-full border border-gray-200 dark:border-white/10"
                        />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{member?.name || log.user_email}</div>
                          <div className="text-[11px] text-gray-500 dark:text-[#8B949E] font-mono">{log.user_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                      {new Date(log.session_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {status === 'active' && (
                          <><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span></span> <span className="text-green-600 dark:text-green-400 font-medium text-xs">Active</span></>
                        )}
                        {status === 'idle' && (
                          <><MonitorPlay className="w-3.5 h-3.5 text-yellow-500" /> <span className="text-yellow-600 dark:text-yellow-500 font-medium text-xs">Idle</span></>
                        )}
                        {status === 'offline' && (
                          <><Moon className="w-3.5 h-3.5 text-gray-400" /> <span className="text-gray-500 dark:text-gray-400 font-medium text-xs">Offline</span></>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-medium text-gray-900 dark:text-white">
                      {formatTime(log.active_seconds)}
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
