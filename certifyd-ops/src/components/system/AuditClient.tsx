'use client';

import React, { useState, useMemo } from 'react';
import { useUrlFilter } from '@/hooks/useUrlFilter';
import { Search, Filter, Eye, X, Shield, Lock, Clock, FileJson } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AuditRecord {
  id: string;
  timestamp: string;
  admin_email: string;
  admin_role: string;
  action_type: string;
  target_table: string;
  target_id?: string;
  ip_address: string;
  old_value?: any;
  new_value?: any;
}

export function AuditClient({ initialLogs }: { initialLogs: AuditRecord[] }) {
  const [logs, setLogs] = useState<AuditRecord[]>(initialLogs);
  const [search, setSearch] = useUrlFilter<string>('search', '', 300);
  const [adminFilter, setAdminFilter] = useUrlFilter<string>('admin', 'ALL');
  const [actionFilter, setActionFilter] = useUrlFilter<string>('action', 'ALL');
  const [tableFilter, setTableFilter] = useUrlFilter<string>('table', 'ALL');

  const [selectedLog, setSelectedLog] = useState<AuditRecord | null>(null);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (adminFilter !== 'ALL' && l.admin_email !== adminFilter) return false;
      if (actionFilter !== 'ALL' && !l.action_type.includes(actionFilter)) return false;
      if (tableFilter !== 'ALL' && l.target_table !== tableFilter) return false;
      if (search.trim() !== '') {
        const q = search.toLowerCase();
        if (
          !l.admin_email.toLowerCase().includes(q) &&
          !l.action_type.toLowerCase().includes(q) &&
          !(l.target_id || '').toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [logs, adminFilter, actionFilter, tableFilter, search]);

  const uniqueAdmins = Array.from(new Set(logs.map((l) => l.admin_email))).filter(Boolean);
  const uniqueTables = Array.from(new Set(logs.map((l) => l.target_table))).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#F97316]/15 text-[#F97316] text-[10px] font-mono font-bold uppercase">
              IMMUTABLE RECORD
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">System Audit & Governance Log</h1>
          </div>
          <p className="text-xs text-[#8B949E] font-mono mt-0.5">
            Read-only chronological ledger of all administrative mutations, state transitions, and live production pushes
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#8B949E] bg-[#0F1218] px-3 py-1.5 rounded-xl border border-white/[0.06]">
          <Lock className="w-3.5 h-3.5 text-[#F97316]" />
          <span>No deletions or edits permitted</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-4 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B949E]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search admin email, action type, target ID..."
              className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#8B949E]/50 focus:outline-none focus:border-[#F97316] font-mono transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 bg-[#161B22] px-2.5 py-1.5 rounded-xl border border-white/[0.06]">
              <Filter className="w-3.5 h-3.5 text-[#F97316]" />
              <span className="text-[#8B949E]">Admin:</span>
              <select
                value={adminFilter}
                onChange={(e) => setAdminFilter(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#161B22]">All Admins</option>
                {uniqueAdmins.map((a) => (
                  <option key={a} value={a} className="bg-[#161B22]">{a}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#161B22] px-2.5 py-1.5 rounded-xl border border-white/[0.06]">
              <span className="text-[#8B949E]">Table:</span>
              <select
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#161B22]">All Tables</option>
                {uniqueTables.map((t) => (
                  <option key={t} value={t} className="bg-[#161B22]">{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#161B22]/60 text-[#8B949E] font-mono uppercase tracking-wider">
                <th className="py-3.5 px-4 font-medium">TIMESTAMP</th>
                <th className="py-3.5 px-4 font-medium">ADMIN EMAIL</th>
                <th className="py-3.5 px-4 font-medium">ROLE</th>
                <th className="py-3.5 px-4 font-medium">ACTION TYPE</th>
                <th className="py-3.5 px-4 font-medium">TARGET TABLE</th>
                <th className="py-3.5 px-4 font-medium">TARGET ID</th>
                <th className="py-3.5 px-4 font-medium">IP ADDRESS</th>
                <th className="py-3.5 px-4 font-medium text-right">PAYLOAD DIFF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8B949E] font-mono">
                    No matching audit logs found ✓
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const isPush = log.action_type.includes('PUSH_') && log.action_type.includes('_TO_LIVE');

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${
                        isPush ? 'bg-[#22C55E]/5' : ''
                      }`}
                    >
                      <td className="py-4 px-4 text-[#8B949E] font-mono whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-white font-mono font-medium">{log.admin_email}</td>
                      <td className="py-4 px-4 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            log.admin_role === 'SUPER_ADMIN'
                              ? 'bg-[#F97316]/15 text-[#F97316]'
                              : 'bg-[#3B82F6]/15 text-[#3B82F6]'
                          }`}
                        >
                          {log.admin_role}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono">
                        <span
                          className={`font-bold ${
                            isPush
                              ? 'text-[#22C55E]'
                              : log.action_type.includes('REJECT') || log.action_type.includes('DELETE') || log.action_type.includes('REMOVE')
                              ? 'text-[#F85149]'
                              : 'text-white'
                          }`}
                        >
                          {log.action_type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[#8B949E] font-mono">{log.target_table}</td>
                      <td className="py-4 px-4 font-mono text-[#F97316]">{log.target_id || '—'}</td>
                      <td className="py-4 px-4 text-[#8B949E] font-mono">{log.ip_address}</td>
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.04] text-[#8B949E] hover:text-white transition-colors inline-flex items-center gap-1 font-mono text-[10px]"
                        >
                          <FileJson className="w-3.5 h-3.5 text-[#3B82F6]" />
                          <span>Inspect Diff</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Diff Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#0F1218] border border-white/10 rounded-2xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4 shrink-0">
                <div>
                  <h3 className="text-sm font-semibold text-white font-mono flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-[#3B82F6]" />
                    <span>Audit Payload Inspection</span>
                  </h3>
                  <p className="text-xs text-[#8B949E] font-mono mt-0.5">
                    {selectedLog.action_type} on {selectedLog.target_table} ({selectedLog.target_id || 'Bulk'})
                  </p>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-[#8B949E] hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 font-mono text-xs pr-1">
                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-[#161B22] border border-white/[0.04] text-[11px]">
                  <div>
                    <span className="text-[#8B949E] block">Admin Executor:</span>
                    <span className="text-white font-bold">{selectedLog.admin_email} ({selectedLog.admin_role})</span>
                  </div>
                  <div>
                    <span className="text-[#8B949E] block">Timestamp:</span>
                    <span className="text-white">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#8B949E] block">IP Address:</span>
                    <span className="text-[#F97316]">{selectedLog.ip_address}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-[#F85149] uppercase font-bold">Old Value / Previous State</span>
                    <pre className="p-3 rounded-xl bg-[#161B22] border border-[#F85149]/20 text-[#F85149] overflow-x-auto text-[11px] max-h-60 scrollbar-thin">
                      {selectedLog.old_value ? JSON.stringify(selectedLog.old_value, null, 2) : '// No prior state (Create/Insert action)'}
                    </pre>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-[#22C55E] uppercase font-bold">New Value / Mutated State</span>
                    <pre className="p-3 rounded-xl bg-[#161B22] border border-[#22C55E]/20 text-[#22C55E] overflow-x-auto text-[11px] max-h-60 scrollbar-thin">
                      {selectedLog.new_value ? JSON.stringify(selectedLog.new_value, null, 2) : '// Record deleted or state cleared'}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] mt-4 flex justify-end shrink-0">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-mono text-xs font-semibold transition-colors"
                >
                  Close Inspection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
