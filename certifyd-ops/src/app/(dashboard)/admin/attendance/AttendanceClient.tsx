'use client';

import React, { useEffect, useState } from 'react';
import { Clock, MonitorPlay, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

export function AttendanceClient({ initialLogs, teamMembers }: { initialLogs: any[], teamMembers: any[] }) {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    let isMounted = true;
    const channel = supabaseClient.channel('ops_presence');

    channel
      .on('presence', { event: 'sync' }, () => {
        if (!isMounted) return;
        const state = channel.presenceState();
        const users: Record<string, any> = {};
        for (const id in state) {
          // Keep the first presence object for each user
          users[id] = state[id][0];
        }
        setOnlineUsers(users);
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabaseClient.removeChannel(channel);
    };
  }, []);

  function getStatus(email: string) {
    if (selectedDate !== new Date().toISOString().split('T')[0]) return 'offline';
    return onlineUsers[email] ? 'active' : 'offline';
  }

  return (
    <div className="bg-[#0D1117] rounded-2xl border border-white/[0.06] shadow-sm overflow-hidden transition-colors">
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          {selectedDate === new Date().toISOString().split('T')[0] ? "Today's Activity" : `Activity for ${new Date(selectedDate).toLocaleDateString()}`}
        </h2>
        <div className="flex items-center gap-4">
          <input 
            type="date"
            value={selectedDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm bg-transparent border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#161B22] border-b border-white/[0.06]">
            <tr>
              <th className="px-5 py-3 font-medium text-[#8B949E]">Employee</th>
              <th className="px-5 py-3 font-medium text-[#8B949E]">First Seen</th>
              <th className="px-5 py-3 font-medium text-[#8B949E]">Status</th>
              <th className="px-5 py-3 font-medium text-[#8B949E] text-right">Active Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {teamMembers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-[#8B949E]">
                  No team members found.
                </td>
              </tr>
            ) : (
              teamMembers.map((member) => {
                const status = getStatus(member.email.toLowerCase());
                const presenceData = onlineUsers[member.email.toLowerCase()];
                
                return (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={member.id} 
                    className="hover:bg-[#161B22] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img 
                          src={member?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.email}`} 
                          alt="" 
                          className="w-8 h-8 rounded-full border border-white/10"
                        />
                        <div>
                          <div className="font-medium text-white">{member.name}</div>
                          <div className="text-[11px] text-[#8B949E] font-mono">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-300">
                      {presenceData ? new Date(presenceData.online_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {status === 'active' && (
                          <><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span></span> <span className="text-green-600 dark:text-green-400 font-medium text-xs">Online</span></>
                        )}
                        {status === 'offline' && (
                          <><Moon className="w-3.5 h-3.5 text-gray-400" /> <span className="text-gray-500 dark:text-gray-400 font-medium text-xs">Offline</span></>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-medium text-white">
                      {status === 'active' ? 'Live' : '-'}
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
