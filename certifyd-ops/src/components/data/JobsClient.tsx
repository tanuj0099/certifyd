'use client';

import React, { useState } from 'react';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import { saveStagingRecordAction, pushStagingToLiveAction, addDataNoteAction, updateLiveRecordAction } from '../../actions/dataActions';
import {
  Briefcase,
  Database,
  Edit3,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  X,
  MapPin,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface JobRecord {
  id: string;
  title: string;
  city: string;
  exp_band: string;
  median_ctc: string;
  p75_ctc: string;
  sample_size: number;
  source: string;
  last_scraped: string;
  serving_status: 'serving' | 'stale' | 'needs_review';
  top_cert: string;
  skills: string[];
  assigned_to?: string;
  internal_notes?: string[];
  diff_summary?: {
    field: string;
    old_val: string;
    new_val: string;
  }[];
  staged_by?: string;
  staged_at?: string;
}

interface JobsClientProps {
  initialLive: JobRecord[];
  initialStaging: JobRecord[];
  userRole?: string;
}

import { useUrlFilter } from '@/hooks/useUrlFilter';

export function JobsClient({ initialLive, initialStaging, userRole = 'SUPER_ADMIN' }: JobsClientProps) {
  const [activeTab, setActiveTab] = useUrlFilter<'live' | 'staging'>('tab', 'live');
  const [liveList, setLiveList] = useState<JobRecord[]>(initialLive);
  const [stagingList, setStagingList] = useState<JobRecord[]>(initialStaging);

  // Search, Sort, and Filter state
  const [domainFilter, setDomainFilter] = useUrlFilter<string>('domain', 'All');
  const [searchQuery, setSearchQuery] = useUrlFilter<string>('search', '', 300);
  const [sortCol, setSortCol] = useUrlFilter<'title' | 'city' | 'exp' | 'ctc' | 'sample'>('sort', 'sample');
  const [sortDir, setSortDir] = useUrlFilter<'asc' | 'desc'>('dir', 'desc');

  const [editingJob, setEditingJob] = useState<JobRecord | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [skillsInput, setSkillsInput] = useState<string>('');

  const [showPushModal, setShowPushModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [notesModalJob, setNotesModalJob] = useState<JobRecord | null>(null);
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

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!notesModalJob || !newNoteText.trim()) return;
    const noteEntry = `[${new Date().toLocaleDateString()}] ${newNoteText.trim()}`;
    const updateList = (list: JobRecord[]) =>
      list.map((j) =>
        j.id === notesModalJob.id
          ? { ...j, internal_notes: [...(j.internal_notes || []), noteEntry] }
          : j
      );

    if (activeTab === 'live') setLiveList(updateList);
    else setStagingList(updateList);

    setNotesModalJob((prev) =>
      prev ? { ...prev, internal_notes: [...(prev.internal_notes || []), noteEntry] } : null
    );
    setNewNoteText('');
    
    // Attempt to save to Supabase
    try {
      const table = activeTab === 'live' ? 'market_jobs_live' : 'market_jobs_staging';
      addDataNoteAction(table, notesModalJob.id, newNoteText.trim(), 'employee@certifyd.in', notesModalJob).catch(e => console.warn(e));
    } catch (e) {
      console.warn("Failed to add note to DB", e);
    }
    
    showToast('Added internal note to job benchmark ✓', 'success');
  }

  function openEdit(job: JobRecord) {
    setEditingJob(job);
    setEditForm({ ...job });
    setSkillsInput(job.skills?.join(', ') || '');
  }

  async function handleSaveStaging(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanTitle = (editForm.title || '').trim();
      if (!cleanTitle) {
        showToast('Job Title is required!', 'error');
        setLoading(false);
        return;
      }
      const cleanCity = (editForm.city || 'Bangalore').trim();
      const parsedSkills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
      const updatedRecord = {
        ...editForm,
        title: cleanTitle,
        city: cleanCity,
        skills: parsedSkills,
      };

      if (activeTab === 'live' && userRole === 'SUPER_ADMIN') {
         await updateLiveRecordAction('market_jobs_live', updatedRecord);
         setLiveList((prev) => prev.map((i) => i.id === updatedRecord.id ? (updatedRecord as JobRecord) : i));
         showToast(`Saved "${updatedRecord.title}" to live database ✓`, 'success');
      } else {
         updatedRecord.staged_by = 'current_admin';
         updatedRecord.staged_at = new Date().toISOString();
         updatedRecord.diff_summary = [
           {
             field: 'median_ctc',
             old_val: editingJob?.median_ctc || '₹18.4L',
             new_val: editForm.median_ctc || '₹20.0L',
           },
           {
             field: 'sample_size',
             old_val: String(editingJob?.sample_size || 50),
             new_val: String(editForm.sample_size || 55),
           },
         ];
         
         await saveStagingRecordAction('market_jobs_staging', updatedRecord);
         setStagingList((prev) => {
           const idx = prev.findIndex((i) => i.id === updatedRecord.id);
           if (idx >= 0) {
             const next = [...prev];
             next[idx] = updatedRecord as JobRecord;
             return next;
           }
           return [updatedRecord as JobRecord, ...prev];
         });
         showToast(`Saved "${updatedRecord.title}" to staging queue ✓`, 'success');
         setActiveTab('staging');
      }

      setEditingJob(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to save record', 'error');
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
      const res = await pushStagingToLiveAction('jobs');
      setLiveList((prev) => {
        const next = [...prev];
        stagingList.forEach((s) => {
          const idx = next.findIndex((l) => l.id === s.id);
          if (idx >= 0) next[idx] = { ...s, serving_status: 'serving', last_scraped: new Date().toISOString() };
          else next.unshift({ ...s, serving_status: 'serving', last_scraped: new Date().toISOString() });
        });
        return next;
      });
      setStagingList([]);
      setShowPushModal(false);
      showToast(`Pushed ${res.count} market job updates to live production on certifyd.in! 🚀`, 'success');
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
        const titleStr = (item.title || '').toLowerCase();
        const topCertStr = (item.top_cert || '').toLowerCase();
        const skillsStr = (item.skills || []).join(' ').toLowerCase();
        const combined = `${titleStr} ${topCertStr} ${skillsStr}`;

        if (!combined.includes(domainFilter.toLowerCase())) {
          return false;
        }
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const combined = `${item.title} ${item.city} ${item.top_cert} ${item.skills?.join(' ')}`.toLowerCase();
        if (!combined.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortCol === 'title') return sortDir === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      if (sortCol === 'city') return sortDir === 'asc' ? a.city.localeCompare(b.city) : b.city.localeCompare(a.city);
      if (sortCol === 'exp') return sortDir === 'asc' ? a.exp_band.localeCompare(b.exp_band) : b.exp_band.localeCompare(a.exp_band);
      if (sortCol === 'ctc') {
        const ctcA = parseFloat((a.median_ctc || '0').replace(/[^0-9.]/g, ''));
        const ctcB = parseFloat((b.median_ctc || '0').replace(/[^0-9.]/g, ''));
        return sortDir === 'asc' ? ctcA - ctcB : ctcB - ctcA;
      }
      if (sortCol === 'sample') return sortDir === 'asc' ? a.sample_size - b.sample_size : b.sample_size - a.sample_size;
      return 0;
    });

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Market Jobs Benchmarks Table</h1>
          <p className="text-xs text-[#8B949E] font-mono mt-0.5">
            Verified salary bands and sample size distributions across India tech hubs ({currentSource.length} records in database)
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#0F1218] p-1 rounded-xl border border-white/[0.06] font-mono text-xs">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'live'
                ? 'bg-[#F97316] text-[#080A0E] font-semibold shadow-sm'
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
                Review diff summaries below. Pushing to live instantly updates production market salary bands.
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
                  ? 'bg-[#F97316] text-[#080A0E] font-bold shadow-sm shadow-[#F97316]/20'
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
            placeholder="Search roles, city, skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-1.5 text-xs text-white placeholder:text-[#8B949E] focus:outline-none focus:border-[#F97316] w-64 font-mono"
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
                <th onClick={() => handleSort('title')} className="py-3.5 px-4 font-medium cursor-pointer hover:text-white transition-colors">
                  JOB ROLE TITLE {sortCol === 'title' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('city')} className="py-3.5 px-3 font-medium cursor-pointer hover:text-white transition-colors">
                  CITY {sortCol === 'city' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('exp')} className="py-3.5 px-3 font-medium cursor-pointer hover:text-white transition-colors">
                  EXP BAND {sortCol === 'exp' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('ctc')} className="py-3.5 px-3 font-medium text-right cursor-pointer hover:text-white transition-colors">
                  MEDIAN CTC {sortCol === 'ctc' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('sample')} className="py-3.5 px-3 font-medium text-right cursor-pointer hover:text-white transition-colors">
                  SAMPLE SIZE {sortCol === 'sample' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="py-3.5 px-3 font-medium">TOP REQUIRED CERT</th>
                <th className="py-3.5 px-3 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8B949E] font-mono">
                    No market job benchmarks match your current search or domain filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((job) => {
                  const isStaging = activeTab === 'staging';

                  return (
                    <tr key={job.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-3 font-mono">
                        {isStaging ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 font-semibold text-[10px] uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
                            STAGED
                          </span>
                        ) : job.serving_status === 'serving' ? (
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
                          <span className="block truncate" title={job.title}>{job.title}</span>
                          {isStaging && job.diff_summary && (
                            <div className="mt-1 flex flex-wrap gap-2 font-mono text-[11px]">
                              {job.diff_summary.map((d, idx) => (
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
                      <td className="py-3.5 px-3 text-[#8B949E] font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#3B82F6]" />
                          <span>{job.city}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-white font-mono whitespace-nowrap">{job.exp_band}</td>
                      <td className="py-3.5 px-3 font-mono text-right font-bold text-[#F97316] whitespace-nowrap">{job.median_ctc}</td>
                      <td className="py-3.5 px-3 font-mono text-right font-bold text-[#E8C547] whitespace-nowrap">{job.sample_size} roles</td>
                      <td className="py-3.5 px-3 font-mono text-white/80 max-w-xs truncate" title={job.top_cert}>
                        {job.top_cert}
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setNotesModalJob(job)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8B949E] hover:text-white font-mono text-[11px] inline-flex items-center gap-1 transition-all"
                            title="View / Add Notes"
                          >
                            <MessageSquare className="w-3 h-3 text-[#E8C547]" />
                            <span>({job.internal_notes?.length || 0})</span>
                          </button>
                          <button
                            onClick={() => openEdit(job)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-[#F97316]/15 hover:text-[#F97316] text-white font-mono text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{isStaging ? 'Edit' : 'Edit'}</span>
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
        title={`Push ${stagingList.length} Staged Jobs to Live Production`}
        impact="This will instantly overwrite live market job salary benchmarks on certifyd.in."
        confirmWord="PUSH"
        loading={loading}
      />

      {/* Notes Modal */}
      <AnimatePresence>
        {notesModalJob && (
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
                <button onClick={() => setNotesModalJob(null)} className="text-[#8B949E] hover:text-white">
                  ✕
                </button>
              </div>

              <div>
                <p className="text-[#8B949E]">Target Role:</p>
                <p className="text-white font-bold text-sm mt-0.5">{notesModalJob.title} ({notesModalJob.city})</p>
              </div>

              <div className="bg-[#161B22] border border-white/[0.04] rounded-xl p-3.5 max-h-48 overflow-y-auto space-y-2">
                {(!notesModalJob.internal_notes || notesModalJob.internal_notes.length === 0) ? (
                  <p className="text-[#8B949E] text-center py-4">No internal notes attached yet.</p>
                ) : (
                  notesModalJob.internal_notes.map((n, i) => (
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
                  className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#F97316]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNotesModalJob(null)}
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
        {editingJob && (
          <>
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs" onClick={() => setEditingJob(null)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-lg z-50 bg-[#0F1218] border-l border-white/[0.08] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-5 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-[#161B22]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center text-[#F97316]">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white font-mono">Edit Job</h3>
                    <p className="text-xs text-[#8B949E] mt-0.5 truncate max-w-[260px]">{editingJob.title}</p>
                  </div>
                </div>
                <button onClick={() => setEditingJob(null)} className="p-1 text-[#8B949E] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStaging} className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">Job Title</label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      disabled
                      className="w-full bg-[#161B22] border border-white/[0.04] rounded-xl px-3.5 py-2 text-sm text-[#8B949E] font-mono cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">City Hub</label>
                    <input
                      type="text"
                      required
                      value={editForm.city || ''}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">Experience Band</label>
                  <input
                    type="text"
                    required
                    value={editForm.exp_band || ''}
                    onChange={(e) => setEditForm({ ...editForm, exp_band: e.target.value })}
                    className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">Median CTC</label>
                    <input
                      type="text"
                      required
                      value={editForm.median_ctc || ''}
                      onChange={(e) => setEditForm({ ...editForm, median_ctc: e.target.value })}
                      placeholder="e.g. ₹18.4L"
                      className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#F97316]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">Sample Size Roles</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={editForm.sample_size || 50}
                      onChange={(e) => setEditForm({ ...editForm, sample_size: Number(e.target.value) })}
                      className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">
                    Top Required Certification Benchmark
                  </label>
                  <input
                    type="text"
                    value={editForm.top_cert || ''}
                    onChange={(e) => setEditForm({ ...editForm, top_cert: e.target.value })}
                    className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#8B949E] font-mono uppercase mb-1.5">
                    Required Skills Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="Kubernetes, AWS, Terraform, Python"
                    className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                {activeTab === 'staging' || userRole !== 'SUPER_ADMIN' ? (
                  <div className="p-3.5 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 text-xs text-[#F97316] leading-relaxed">
                    <strong>Staging Safety Notice:</strong> Saving changes places them in the staging queue. They will NOT affect calculations on certifyd.in until a Super Admin executes "Push to Live".
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-xs text-[#22C55E] leading-relaxed">
                    <strong>Live Edit Mode:</strong> Saving changes will immediately update the production database.
                  </div>
                )}

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingJob(null)}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.04] text-[#8B949E] hover:text-white text-xs font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-[#F97316] text-[#080A0E] hover:bg-[#F97316]/90 font-bold text-xs font-mono shadow-lg shadow-[#F97316]/20 transition-all flex items-center gap-2"
                  >
                    {loading && <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                    <span>{activeTab === 'live' && userRole === 'SUPER_ADMIN' ? 'Save Directly to Live' : 'Save to Staging Queue'}</span>
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
