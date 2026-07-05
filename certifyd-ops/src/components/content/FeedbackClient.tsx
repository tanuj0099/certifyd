'use client';

import React, { useState, useMemo } from 'react';
import { useToast } from '../ui/Toast';
import { StatusPill } from '../ui/StatusPill';
import { updateContentStatusAction } from '../../actions/contentActions';
import { addSubmissionNoteAction } from '../../actions/submissionActions';
import {
  MessageSquare,
  Search,
  Filter,
  Eye,
  Star,
  Send,
  X,
  ExternalLink,
  Smile,
  Meh,
  Frown,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FeedbackRecord {
  id: string;
  created_at: string;
  tool: string;
  rating: number;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  message: string;
  user_id: string;
  submission_id?: string;
  submission_type?: 'resume' | 'offer';
  status: 'New' | 'In Progress' | 'Resolved';
  device_info: string;
  internal_notes: Array<{ author: string; text: string; timestamp: string }>;
}

interface FeedbackClientProps {
  initialRecords: FeedbackRecord[];
  userRole: 'SUPER_ADMIN' | 'TEAM_MEMBER';
}

export function FeedbackClient({ initialRecords, userRole }: FeedbackClientProps) {
  const [records, setRecords] = useState<FeedbackRecord[]>(initialRecords);
  const [search, setSearch] = useState('');
  const [toolFilter, setToolFilter] = useState('ALL');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [sentimentFilter, setSentimentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (toolFilter !== 'ALL' && r.tool !== toolFilter) return false;
      if (ratingFilter !== 'ALL' && r.rating !== Number(ratingFilter)) return false;
      if (sentimentFilter !== 'ALL' && r.sentiment !== sentimentFilter) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (search.trim() !== '') {
        const q = search.toLowerCase();
        if (!r.message.toLowerCase().includes(q) && !r.user_id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [records, toolFilter, ratingFilter, sentimentFilter, statusFilter, search]);

  const currentRecord = selectedIdx !== null ? filtered[selectedIdx] : null;

  async function handleStatusChange(id: string, newStatus: string) {
    setLoading(true);
    try {
      await updateContentStatusAction('feedback_messages', id, newStatus);
      setRecords((prev) => prev.map((item) => (item.id === id ? { ...item, status: newStatus as any } : item)));
      showToast(`Feedback status changed to ${newStatus} ✓`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNote(id: string) {
    if (!newNoteText.trim()) return;
    setLoading(true);
    try {
      const res = await addSubmissionNoteAction('feedback_messages', id, newNoteText.trim());
      setRecords((prev) => prev.map((item) => (item.id === id ? { ...item, internal_notes: res.notes } : item)));
      setNewNoteText('');
      showToast('Admin note added ✓', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add note', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">User Feedback & NPS Stream</h1>
          <p className="text-xs text-[#8B949E] font-mono mt-0.5">
            Real-time candidate ratings across ROI calculations and AI analysis engines
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#8B949E]">
          <span>Total Feedback: <strong className="text-white">{filtered.length}</strong></span>
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
              placeholder="Search feedback text or 8-char user ID..."
              className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#8B949E]/50 focus:outline-none focus:border-[#F97316] font-mono transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 bg-[#161B22] px-2.5 py-1.5 rounded-xl border border-white/[0.06]">
              <Filter className="w-3.5 h-3.5 text-[#F97316]" />
              <span className="text-[#8B949E]">Tool:</span>
              <select
                value={toolFilter}
                onChange={(e) => setToolFilter(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#161B22]">All Tools</option>
                <option value="ROI Calculator" className="bg-[#161B22]">ROI Calculator</option>
                <option value="Resume Analyzer" className="bg-[#161B22]">Resume Analyzer</option>
                <option value="Offer Analyzer" className="bg-[#161B22]">Offer Analyzer</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#161B22] px-2.5 py-1.5 rounded-xl border border-white/[0.06]">
              <span className="text-[#8B949E]">Sentiment:</span>
              <select
                value={sentimentFilter}
                onChange={(e) => setSentimentFilter(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#161B22]">All</option>
                <option value="Positive" className="bg-[#161B22]">🟢 Positive</option>
                <option value="Neutral" className="bg-[#161B22]">🟡 Neutral</option>
                <option value="Negative" className="bg-[#161B22]">🔴 Negative</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#161B22] px-2.5 py-1.5 rounded-xl border border-white/[0.06]">
              <span className="text-[#8B949E]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer uppercase font-semibold"
              >
                <option value="ALL" className="bg-[#161B22]">All</option>
                <option value="New" className="bg-[#161B22]">New</option>
                <option value="In Progress" className="bg-[#161B22]">In Progress</option>
                <option value="Resolved" className="bg-[#161B22]">Resolved</option>
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
                <th className="py-3.5 px-4 font-medium">DATE</th>
                <th className="py-3.5 px-4 font-medium">TOOL</th>
                <th className="py-3.5 px-4 font-medium">RATING</th>
                <th className="py-3.5 px-4 font-medium">SENTIMENT</th>
                <th className="py-3.5 px-4 font-medium">FEEDBACK PREVIEW</th>
                <th className="py-3.5 px-4 font-medium">USER ID</th>
                <th className="py-3.5 px-4 font-medium">STATUS</th>
                <th className="py-3.5 px-4 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8B949E] font-mono">
                    No matching user feedback found ✓
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedIdx(idx)}
                      className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-4 text-[#8B949E] font-mono">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="py-4 px-4 font-medium text-white">{item.tool}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-0.5 text-[#E8C547]">
                          {Array.from({ length: item.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            item.sentiment === 'Positive'
                              ? 'bg-[#22C55E]/15 text-[#22C55E]'
                              : item.sentiment === 'Neutral'
                              ? 'bg-[#E8C547]/15 text-[#E8C547]'
                              : 'bg-[#F85149]/15 text-[#F85149]'
                          }`}
                        >
                          {item.sentiment === 'Positive' && <Smile className="w-3 h-3" />}
                          {item.sentiment === 'Neutral' && <Meh className="w-3 h-3" />}
                          {item.sentiment === 'Negative' && <Frown className="w-3 h-3" />}
                          <span>{item.sentiment}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-white max-w-xs truncate">{item.message}</td>
                      <td className="py-4 px-4 font-mono text-[#F97316]">#{item.user_id.substring(0, 8)}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold uppercase ${
                            item.status === 'Resolved'
                              ? 'bg-[#22C55E]/15 text-[#22C55E]'
                              : item.status === 'In Progress'
                              ? 'bg-[#3B82F6]/15 text-[#3B82F6]'
                              : 'bg-[#E8C547]/15 text-[#E8C547]'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIdx(idx);
                          }}
                          className="p-1.5 rounded-lg bg-white/[0.04] text-[#8B949E] hover:text-white transition-colors inline-flex items-center gap-1 font-mono text-[10px]"
                        >
                          <Eye className="w-3.5 h-3.5" />
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

      {/* Slideover */}
      <AnimatePresence>
        {currentRecord && (
          <>
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedIdx(null)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-xl z-50 bg-[#0F1218] border-l border-white/[0.08] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-5 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-[#161B22]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center text-[#F97316]">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white font-mono">Feedback Record #{currentRecord.id.substring(0, 8)}</h3>
                    <p className="text-xs text-[#8B949E] mt-0.5">Submitted via {currentRecord.tool}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedIdx(null)} className="p-1 text-[#8B949E] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="p-4 rounded-2xl bg-[#161B22] border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[#E8C547]">
                      {Array.from({ length: currentRecord.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs font-mono text-[#8B949E]">{new Date(currentRecord.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-white leading-relaxed font-sans">{currentRecord.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-[#161B22] border border-white/[0.04]">
                    <p className="text-[#8B949E] uppercase text-[10px]">Candidate ID</p>
                    <p className="text-white font-bold mt-1">#{currentRecord.user_id}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#161B22] border border-white/[0.04]">
                    <p className="text-[#8B949E] uppercase text-[10px]">Device & Browser</p>
                    <p className="text-white truncate mt-1">{currentRecord.device_info}</p>
                  </div>
                </div>

                {currentRecord.submission_id && (
                  <div className="p-3.5 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-between text-xs">
                    <div>
                      <p className="text-[#F97316] font-bold font-mono">Associated {currentRecord.submission_type?.toUpperCase()} Submission</p>
                      <p className="text-[#8B949E] text-[11px] mt-0.5">User submitted data prior to feedback</p>
                    </div>
                    <a
                      href={`/submissions/${currentRecord.submission_type === 'offer' ? 'offers' : 'resumes'}`}
                      className="px-3 py-1.5 rounded-lg bg-[#F97316] text-[#080A0E] font-mono text-xs font-semibold hover:bg-[#F97316]/90 flex items-center gap-1"
                    >
                      <span>View Submission</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="block text-xs font-mono text-[#8B949E] uppercase font-semibold">Change Workflow Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['New', 'In Progress', 'Resolved'].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(currentRecord.id, st)}
                        disabled={loading || currentRecord.status === st}
                        className={`py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
                          currentRecord.status === st
                            ? 'bg-[#F97316] text-[#080A0E] shadow-md'
                            : 'bg-[#161B22] border border-white/10 text-[#8B949E] hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                  <p className="text-xs font-mono text-[#8B949E] uppercase font-semibold">
                    Admin Notes ({currentRecord.internal_notes?.length || 0})
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {(!currentRecord.internal_notes || currentRecord.internal_notes.length === 0) ? (
                      <p className="text-xs text-[#8B949E]/60 italic">No notes attached</p>
                    ) : (
                      currentRecord.internal_notes.map((n, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-[#161B22] text-xs">
                          <span className="text-[#F97316] font-mono font-bold mr-2">{n.author}:</span>
                          <span className="text-white">{n.text}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add admin note..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddNote(currentRecord.id);
                      }}
                      className="flex-1 bg-[#161B22] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F97316] font-mono"
                    />
                    <button
                      onClick={() => handleAddNote(currentRecord.id)}
                      disabled={!newNoteText.trim() || loading}
                      className="px-3 py-2 rounded-xl bg-[#F97316] text-[#080A0E] hover:bg-[#F97316]/90 disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
