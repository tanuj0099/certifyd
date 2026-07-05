'use client';

import React, { useState } from 'react';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import { saveStagingRecordAction, pushStagingToLiveAction } from '../../actions/dataActions';
import {
  Award,
  Database,
  Edit3,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Plus,
  Trash2,
  ShieldAlert,
  MessageSquare,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CertRecord {
  id: string;
  name: string;
  vendor: string;
  domain: string;
  avg_salary_lift: string;
  demand_score: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  last_verified: string;
  serving_status: 'serving' | 'stale' | 'needs_review';
  career_stage: string;
  skills: string[];
  assigned_to?: string;
  internal_notes?: string[];
  diff_summary?: {
    field: string;
    old_val: string;
    new_val: string;
  }[];
}

interface CertificationsClientProps {
  initialLive: CertRecord[];
  initialStaging: CertRecord[];
  userRole?: string;
}

export function CertificationsClient({
  initialLive,
  initialStaging,
  userRole = 'SUPER_ADMIN',
}: CertificationsClientProps) {
  const [activeTab, setActiveTab] = useState<'live' | 'staging'>('live');
  const [liveList, setLiveList] = useState<CertRecord[]>(initialLive);
  const [stagingList, setStagingList] = useState<CertRecord[]>(initialStaging);

  // Search, Sort, and Filter state
  const [domainFilter, setDomainFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortCol, setSortCol] = useState<'name' | 'vendor' | 'domain' | 'lift' | 'demand' | 'difficulty'>('demand');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Edit & Notes Modal State
  const [editingCert, setEditingCert] = useState<CertRecord | null>(null);
  const [editForm, setEditForm] = useState<Partial<CertRecord>>({});
  const [skillsInput, setSkillsInput] = useState('');
  const [showPushModal, setShowPushModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [notesModalCert, setNotesModalCert] = useState<CertRecord | null>(null);
  const [newNoteText, setNewNoteText] = useState('');

  const { showToast } = useToast();

  function handleSort(col: typeof sortCol) {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  }

  function handleAssign(id: string, assignee: string) {
    const updateList = (list: CertRecord[]) =>
      list.map((c) => (c.id === id ? { ...c, assigned_to: assignee } : c));
    if (activeTab === 'live') setLiveList(updateList);
    else setStagingList(updateList);
    showToast(`Assigned task to ${assignee} ✓`, 'success');
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!notesModalCert || !newNoteText.trim()) return;
    const noteEntry = `[${new Date().toLocaleDateString()}] ${newNoteText.trim()}`;
    const updateList = (list: CertRecord[]) =>
      list.map((c) =>
        c.id === notesModalCert.id
          ? { ...c, internal_notes: [...(c.internal_notes || []), noteEntry] }
          : c
      );

    if (activeTab === 'live') setLiveList(updateList);
    else setStagingList(updateList);

    setNotesModalCert((prev) =>
      prev ? { ...prev, internal_notes: [...(prev.internal_notes || []), noteEntry] } : null
    );
    setNewNoteText('');
    showToast('Added internal note to record ✓', 'success');
  }

  function openEdit(cert: CertRecord) {
    setEditingCert(cert);
    setEditForm({ ...cert });
    setSkillsInput(cert.skills?.join(', ') || '');
  }

  async function handleSaveStaging(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const parsedSkills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
      const updatedRecord = {
        ...editForm,
        skills: parsedSkills,
        staged_by: 'current_admin',
        staged_at: new Date().toISOString(),
        diff_summary: [
          {
            field: 'avg_salary_lift',
            old_val: editingCert?.avg_salary_lift || '28%',
            new_val: editForm.avg_salary_lift || '32%',
          },
          {
            field: 'demand_score',
            old_val: String(editingCert?.demand_score || 8),
            new_val: String(editForm.demand_score || 9),
          },
        ],
      };

      await saveStagingRecordAction('certifications_staging', updatedRecord);

      setStagingList((prev) => {
        const idx = prev.findIndex((i) => i.id === updatedRecord.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedRecord as CertRecord;
          return next;
        }
        return [updatedRecord as CertRecord, ...prev];
      });

      showToast(`Saved "${updatedRecord.name}" to staging queue ✓`, 'success');
      setEditingCert(null);
      setActiveTab('staging');
    } catch (err: any) {
      showToast(err.message || 'Failed to save staging record', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPush() {
    if (userRole !== 'SUPER_ADMIN') {
      showToast('Super Admin required to push changes to live.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await pushStagingToLiveAction('certifications');
      setLiveList((prev) => {
        const next = [...prev];
        stagingList.forEach((s) => {
          const idx = next.findIndex((l) => l.id === s.id);
          if (idx >= 0) next[idx] = { ...s, serving_status: 'serving', last_verified: new Date().toISOString() };
          else next.unshift({ ...s, serving_status: 'serving', last_verified: new Date().toISOString() });
        });
        return next;
      });
      setStagingList([]);
      setShowPushModal(false);
      showToast(`Pushed ${res.count} certification updates to live production on certifyd.in! 🚀`, 'success');
      setActiveTab('live');
    } catch (err: any) {
      showToast(err.message || 'Push to live failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Apply Domain Filter, Search Query, and Sorting
  const currentSource = activeTab === 'live' ? liveList : stagingList;
  const filteredList = currentSource
    .filter((item) => {
      if (domainFilter !== 'All') {
        const domainStr = (item.domain || '').toLowerCase();
        const nameStr = (item.name || '').toLowerCase();
        const vendorStr = (item.vendor || '').toLowerCase();
        const skillsStr = (item.skills || []).join(' ').toLowerCase();
        const combined = `${domainStr} ${nameStr} ${vendorStr} ${skillsStr}`;

        if (domainFilter === 'Data Management') {
          if (!combined.includes('data') && !combined.includes('sql') && !combined.includes('db') && !combined.includes('analytic') && !combined.includes('bi')) {
            return false;
          }
        } else if (domainFilter === 'Cloud Architecture') {
          if (!combined.includes('cloud') && !combined.includes('aws') && !combined.includes('azure') && !combined.includes('gcp') && !combined.includes('architect')) {
            return false;
          }
        } else if (!combined.includes(domainFilter.toLowerCase())) {
          return false;
        }
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const combined = `${item.name} ${item.vendor} ${item.domain} ${item.skills?.join(' ')}`.toLowerCase();
        if (!combined.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortCol === 'name') return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      if (sortCol === 'vendor') return sortDir === 'asc' ? a.vendor.localeCompare(b.vendor) : b.vendor.localeCompare(a.vendor);
      if (sortCol === 'domain') return sortDir === 'asc' ? (a.domain || '').localeCompare(b.domain || '') : (b.domain || '').localeCompare(a.domain || '');
      if (sortCol === 'lift') {
        const liftA = parseInt(a.avg_salary_lift || '0', 10);
        const liftB = parseInt(b.avg_salary_lift || '0', 10);
        return sortDir === 'asc' ? liftA - liftB : liftB - liftA;
      }
      if (sortCol === 'demand') return sortDir === 'asc' ? a.demand_score - b.demand_score : b.demand_score - a.demand_score;
      if (sortCol === 'difficulty') return sortDir === 'asc' ? a.difficulty.localeCompare(b.difficulty) : b.difficulty.localeCompare(a.difficulty);
      return 0;
    });

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Certifications Reference Table</h1>
          <p className="text-xs text-[#8B949E] font-mono mt-0.5">
            Core knowledge graph serving ROI calculations on certifyd.in ({currentSource.length} records in database)
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#0F1218] p-1 rounded-xl border border-white/[0.06] font-mono text-xs">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'live'
                ? 'bg-[#00D4A8] text-[#080A0E] font-semibold shadow-sm'
                : 'text-[#8B949E] hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Live Table ({liveList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('staging')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 relative ${
              activeTab === 'staging'
                ? 'bg-[#3B82F6] text-white font-semibold shadow-sm'
                : 'text-[#8B949E] hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Staging Table ({stagingList.length})</span>
            {stagingList.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#E8C547] animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* STAGING TAB TOP BAR */}
      {activeTab === 'staging' && (
        <div className="bg-gradient-to-r from-[#161B22] via-[#0F1218] to-[#161B22] border border-[#3B82F6]/30 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Staging Workflow ({stagingList.length} updates pending)
              </h3>
              <p className="text-xs text-[#8B949E] mt-0.5">
                Review diff summaries below. Pushing to live instantly updates the production database serving certifyd.in.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {userRole === 'TEAM_MEMBER' ? (
              <div
                className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#8B949E] text-xs font-mono font-medium flex items-center gap-2 cursor-not-allowed"
                title="Super Admin required to push changes to live"
              >
                <Lock className="w-4 h-4 text-[#E8C547]" />
                <span>PUSH TO LIVE (LOCKED FOR TEAM)</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (stagingList.length === 0) showToast('Staging queue is empty.', 'info');
                  else setShowPushModal(true);
                }}
                disabled={stagingList.length === 0 || loading}
                className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#22C55E]/90 text-[#080A0E] text-xs font-bold font-mono transition-all shadow-lg shadow-[#22C55E]/20 disabled:opacity-40 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>PUSH {stagingList.length} UPDATES TO LIVE 🚀</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SEARCH & DOMAIN FILTERS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F1218] p-4 rounded-2xl border border-white/[0.06] shadow-lg">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 font-mono text-xs">
          {['All', 'Cloud Architecture', 'Data Management', 'Cybersecurity', 'DevOps & SRE', 'AI & ML'].map((d) => (
            <button
              key={d}
              onClick={() => setDomainFilter(d)}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                domainFilter === d
                  ? 'bg-[#00D4A8] text-[#080A0E] font-bold shadow-sm shadow-[#00D4A8]/20'
                  : 'bg-[#161B22] text-[#8B949E] hover:text-white border border-white/5'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search certs, vendor, skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-1.5 text-xs text-white placeholder:text-[#8B949E] focus:outline-none focus:border-[#00D4A8] w-64 font-mono"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[#8B949E] hover:text-white text-xs font-mono px-2">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#161B22]/60 text-[#8B949E] font-mono uppercase tracking-wider select-none">
                <th className="py-3.5 px-3 font-medium">STATUS</th>
                <th onClick={() => handleSort('name')} className="py-3.5 px-4 font-medium cursor-pointer hover:text-white transition-colors">
                  CERTIFICATION NAME {sortCol === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('vendor')} className="py-3.5 px-3 font-medium cursor-pointer hover:text-white transition-colors">
                  VENDOR {sortCol === 'vendor' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('domain')} className="py-3.5 px-3 font-medium cursor-pointer hover:text-white transition-colors">
                  DOMAIN {sortCol === 'domain' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('lift')} className="py-3.5 px-3 font-medium text-right cursor-pointer hover:text-white transition-colors">
                  AVG LIFT {sortCol === 'lift' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('demand')} className="py-3.5 px-3 font-medium text-right cursor-pointer hover:text-white transition-colors">
                  DEMAND {sortCol === 'demand' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('difficulty')} className="py-3.5 px-3 font-medium cursor-pointer hover:text-white transition-colors">
                  DIFFICULTY {sortCol === 'difficulty' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="py-3.5 px-3 font-medium">ASSIGNED TASK</th>
                <th className="py-3.5 px-3 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#8B949E] font-mono">
                    No certification records match your current search or domain filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((cert) => {
                  const isStaging = activeTab === 'staging';

                  return (
                    <tr key={cert.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-3 font-mono">
                        {isStaging ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 font-semibold text-[10px] uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
                            STAGED
                          </span>
                        ) : cert.serving_status === 'serving' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 font-semibold text-[10px] uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                            SERVING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8C547]/15 text-[#E8C547] border border-[#E8C547]/30 font-semibold text-[10px] uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E8C547]" />
                            STALE
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white max-w-xs">
                        <div>
                          <span className="block truncate" title={cert.name}>{cert.name}</span>
                          {isStaging && cert.diff_summary && (
                            <div className="mt-1 flex flex-wrap gap-2 font-mono text-[11px]">
                              {cert.diff_summary.map((d, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded bg-[#161B22] border border-white/10 text-[#8B949E]">
                                  {d.field}: <span className="line-through text-[#F85149]">{d.old_val}</span>{' '}
                                  <ArrowRight className="w-3 h-3 inline text-[#8B949E]" />{' '}
                                  <span className="text-[#22C55E] font-bold">{d.new_val}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-[#8B949E] font-mono whitespace-nowrap">{cert.vendor}</td>
                      <td className="py-3.5 px-3 text-white whitespace-nowrap">{cert.domain}</td>
                      <td className="py-3.5 px-3 font-mono text-right font-bold text-[#00D4A8] whitespace-nowrap">{cert.avg_salary_lift}</td>
                      <td className="py-3.5 px-3 font-mono text-right font-bold text-[#E8C547] whitespace-nowrap">{cert.demand_score} / 10</td>
                      <td className="py-3.5 px-3 font-mono whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[#8B949E] text-[10px]">
                          {cert.difficulty}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-[#3B82F6]" />
                          <select
                            value={cert.assigned_to || 'Unassigned'}
                            onChange={(e) => handleAssign(cert.id, e.target.value)}
                            className="bg-[#161B22] border border-white/[0.08] rounded px-2 py-1 text-white text-[11px] focus:outline-none focus:border-[#00D4A8]"
                          >
                            <option value="Unassigned">Unassigned</option>
                            <option value="Admin Tanuj">Admin Tanuj</option>
                            <option value="Worker 1 (Priya)">Worker 1 (Priya)</option>
                            <option value="Worker 2 (Rahul)">Worker 2 (Rahul)</option>
                            <option value="Worker 3 (Ankit)">Worker 3 (Ankit)</option>
                          </select>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setNotesModalCert(cert)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8B949E] hover:text-white font-mono text-[11px] inline-flex items-center gap-1 transition-all"
                            title="View / Add Notes"
                          >
                            <MessageSquare className="w-3 h-3 text-[#E8C547]" />
                            <span>({cert.internal_notes?.length || 0})</span>
                          </button>
                          <button
                            onClick={() => openEdit(cert)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-[#00D4A8]/15 hover:text-[#00D4A8] text-white font-mono text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{isStaging ? 'Edit' : 'Stage'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Push to Live Modal */}
      <ConfirmModal
        isOpen={showPushModal}
        onClose={() => setShowPushModal(false)}
        onConfirm={handleConfirmPush}
        title={`Push ${stagingList.length} Staged Certifications to Live Production`}
        impact="This will instantly overwrite live production tables on certifyd.in. All ROI calculations performed by active users will immediately use these new salary lift and demand score benchmarks."
        confirmWord="PUSH"
        loading={loading}
      />

      {/* Notes Modal */}
      <AnimatePresence>
        {notesModalCert && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0F1218] border border-white/[0.1] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 font-mono text-xs"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2 text-white font-bold">
                  <MessageSquare className="w-4 h-4 text-[#E8C547]" />
                  <span>Internal Notes & Audit Log</span>
                </div>
                <button onClick={() => setNotesModalCert(null)} className="text-[#8B949E] hover:text-white">
                  ✕
                </button>
              </div>

              <div>
                <p className="text-[#8B949E]">Target Record:</p>
                <p className="text-white font-bold text-sm mt-0.5">{notesModalCert.name}</p>
                <p className="text-[10px] text-[#00D4A8] mt-0.5">Assigned to: {notesModalCert.assigned_to || 'Unassigned'}</p>
              </div>

              <div className="bg-[#161B22] border border-white/[0.04] rounded-xl p-3.5 max-h-48 overflow-y-auto space-y-2">
                {(!notesModalCert.internal_notes || notesModalCert.internal_notes.length === 0) ? (
                  <p className="text-[#8B949E] text-center py-4">No internal notes attached yet.</p>
                ) : (
                  notesModalCert.internal_notes.map((n, i) => (
                    <div key={i} className="p-2 rounded bg-white/[0.02] border border-white/[0.04] text-white/90">
                      {n}
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddNote} className="space-y-3 pt-2">
                <input
                  type="text"
                  placeholder="Add a new audit note or verification message..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#00D4A8]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNotesModalCert(null)}
                    className="px-4 py-2 rounded-xl bg-white/[0.04] text-[#8B949E] hover:text-white"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#E8C547] text-[#080A0E] font-bold hover:bg-[#E8C547]/90"
                  >
                    Add Note
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Slide-over Panel */}
      <AnimatePresence>
        {editingCert && (
          <>
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs" onClick={() => setEditingCert(null)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-lg z-50 bg-[#0F1218] border-l border-white/[0.08] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-5 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-[#161B22]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#00D4A8]/10 border border-[#00D4A8]/20 flex items-center justify-center text-[#00D4A8]">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white font-mono">Stage Certification Benchmark</h3>
                    <p className="text-xs text-[#8B949E] mt-0.5 truncate max-w-[260px]">{editingCert.name}</p>
                  </div>
                </div>
                <button onClick={() => setEditingCert(null)} className="p-1 text-[#8B949E] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStaging} className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">Certification Name</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    disabled
                    className="w-full bg-[#161B22] border border-white/[0.04] rounded-xl px-3.5 py-2 text-sm text-[#8B949E] font-mono cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">Avg Salary Lift %</label>
                    <input
                      type="text"
                      required
                      value={editForm.avg_salary_lift || ''}
                      onChange={(e) => setEditForm({ ...editForm, avg_salary_lift: e.target.value })}
                      placeholder="e.g. 32%"
                      className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00D4A8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">Demand Score (1-10)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      required
                      value={editForm.demand_score || 8}
                      onChange={(e) => setEditForm({ ...editForm, demand_score: Number(e.target.value) })}
                      className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00D4A8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">Difficulty Level</label>
                    <select
                      value={editForm.difficulty || 'Intermediate'}
                      onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value as any })}
                      className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00D4A8]"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">Career Stage</label>
                    <input
                      type="text"
                      value={editForm.career_stage || 'Mid-Level'}
                      onChange={(e) => setEditForm({ ...editForm, career_stage: e.target.value })}
                      placeholder="e.g. Mid-Level (3-6 yrs)"
                      className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00D4A8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">
                    Primary Skills Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="AWS, VPC, EC2, Terraform, IAM"
                    className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00D4A8]"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[#00D4A8]/10 border border-[#00D4A8]/20 text-xs text-[#00D4A8] leading-relaxed">
                  <strong>Staging Safety Notice:</strong> Saving changes places them in the staging queue. They will NOT affect calculations on certifyd.in until a Super Admin executes "Push to Live".
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingCert(null)}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.04] text-[#8B949E] hover:text-white text-xs font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-[#00D4A8] text-[#080A0E] hover:bg-[#00D4A8]/90 font-bold text-xs font-mono shadow-lg shadow-[#00D4A8]/20 transition-all flex items-center gap-2"
                  >
                    {loading && <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                    <span>Save to Staging Queue</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
