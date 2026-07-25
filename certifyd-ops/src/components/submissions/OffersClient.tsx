'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../ui/Toast';
import { StatusPill } from '../ui/StatusPill';
import { ConfirmModal } from '../ui/ConfirmModal';
import { updateSubmissionStatusAction, addSubmissionNoteAction } from '../../actions/submissionActions';
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Briefcase,
  Send,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Mail,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface OfferRecord {
  id: string;
  submitted_at: string;
  city: string;
  domain: string;
  ctc_band: string;
  role_category: string;
  employer_sector: string;
  trap_flags: string[];
  counter_offer_shown: string;
  negotiation_email: string;
  anomaly_score: number;
  status: 'pending' | 'approved' | 'rejected' | 'flagged' | 'processed';
  extracted_data: {
    headline_ctc?: string;
    gross_takehome?: string;
    pf_inclusion?: boolean;
    notice_period_days?: number;
    clawback_clause?: boolean;
  };
  rejection_reason?: string;
  internal_notes: Array<{ author: string; text: string; timestamp: string }>;
}

function formatDateTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr || 'Just now';
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return dateStr || 'Just now';
  }
}

interface OffersClientProps {
  initialRecords: OfferRecord[];
  userRole: 'SUPER_ADMIN' | 'TEAM_MEMBER';
}

import { useUrlFilter } from '@/hooks/useUrlFilter';

export function OffersClient({ initialRecords, userRole }: OffersClientProps) {
  const [records, setRecords] = useState<OfferRecord[]>(initialRecords);
  const [search, setSearch] = useUrlFilter<string>('search', '', 300);
  const [statusFilter, setStatusFilter] = useUrlFilter<string>('status', 'ALL');
  const [cityFilter, setCityFilter] = useUrlFilter<string>('city', 'ALL');
  const [sectorFilter, setSectorFilter] = useUrlFilter<string>('sector', 'ALL');
  const [sortOrder, setSortOrder] = useUrlFilter<'newest' | 'oldest'>('sort', 'newest');

  // Pagination
  const [pageSize, setPageSize] = useUrlFilter<number>('pageSize', 50);
  const [currentPage, setCurrentPage] = useUrlFilter<number>('page', 1);

  // Slide-over & Modal state
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Implausible data (outlier CTC/salary)');
  const [customReason, setCustomReason] = useState<string>('');
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const { showToast } = useToast();

  const filtered = useMemo(() => {
    const list = records.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter.toLowerCase()) return false;
      if (cityFilter !== 'ALL' && r.city !== cityFilter) return false;
      if (sectorFilter !== 'ALL' && !r.employer_sector.includes(sectorFilter)) return false;
      if (search.trim() !== '') {
        const q = search.toLowerCase();
        const matchId = r.id.toLowerCase().includes(q);
        const matchCity = r.city.toLowerCase().includes(q);
        const matchRole = r.role_category.toLowerCase().includes(q);
        if (!matchId && !matchCity && !matchRole) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      const timeA = new Date(a.submitted_at).getTime();
      const timeB = new Date(b.submitted_at).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [records, statusFilter, cityFilter, sectorFilter, search, sortOrder]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const currentRecord = selectedIdx !== null ? paginated[selectedIdx] : null;

  const handleStatusChange = useCallback(
    async (id: string, newStatus: 'approved' | 'rejected' | 'flagged' | 'processed', reason?: string) => {
      setActionLoading(true);
      try {
        await updateSubmissionStatusAction('offer_letter_submissions', id, newStatus as any, reason);
        setRecords((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus, rejection_reason: reason } : item))
        );
        showToast(`Offer #${id.substring(0, 8)} marked as ${newStatus.toUpperCase()} ✓`, 'success');
        if (rejectingId) setRejectingId(null);
      } catch (err: any) {
        showToast(err.message || 'Failed to update status', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [userRole, showToast, rejectingId]
  );

  async function handleAddNote(id: string) {
    if (!newNoteText.trim()) return;
    setActionLoading(true);
    try {
      const res = await addSubmissionNoteAction('offer_letter_submissions', id, newNoteText.trim());
      setRecords((prev) =>
        prev.map((item) => (item.id === id ? { ...item, internal_notes: res.notes } : item))
      );
      setNewNoteText('');
      showToast('Internal note saved ✓', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save note', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  // Keyboard Shortcuts for Slide-over
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (selectedIdx === null) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      const rec = paginated[selectedIdx];
      if (!rec) return;

      if (e.key === 'Escape') {
        if (rejectingId) setRejectingId(null);
        else setSelectedIdx(null);
      } else if (e.key.toLowerCase() === 'a' && userRole === 'SUPER_ADMIN') {
        e.preventDefault();
        handleStatusChange(rec.id, 'approved');
      } else if (e.key.toLowerCase() === 'r' && userRole === 'SUPER_ADMIN') {
        e.preventDefault();
        setRejectingId(rec.id);
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleStatusChange(rec.id, 'flagged');
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (selectedIdx < paginated.length - 1) setSelectedIdx(selectedIdx + 1);
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (selectedIdx > 0) setSelectedIdx(selectedIdx - 1);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdx, paginated, userRole, handleStatusChange, rejectingId]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Offer Letter Intelligence Queue</h1>
          <p className="text-xs text-[#8B949E] font-mono mt-0.5">
            Anonymized compensation offers, CTC inflation trap detection, and negotiation QA
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#8B949E]">
          <span>Total Records: <strong className="text-white font-semibold">{filtered.length}</strong></span>
          {userRole === 'SUPER_ADMIN' && (
            <button
              onClick={async () => {
                 if (confirm('Push all Approved/Rejected items to Live? This will hide them from the queue.')) {
                    setActionLoading(true);
                    for (const rec of records) {
                       if (rec.status === 'approved' || rec.status === 'rejected') {
                          await updateSubmissionStatusAction('offer_letter_submissions', rec.id, 'processed' as any);
                       }
                    }
                    setRecords(prev => prev.filter(r => r.status !== 'approved' && r.status !== 'rejected'));
                    showToast('Successfully pushed all processed items.', 'success');
                    setActionLoading(false);
                 }
              }}
              disabled={actionLoading}
              className="ml-4 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#F97316] to-[#EA580C] text-[#080A0E] font-bold shadow-lg transition-all"
            >
              Push Whole Thing (1-Click)
            </button>
          )}
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
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by ID, city, role category..."
              className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#8B949E]/50 focus:outline-none focus:border-[#F97316] font-mono transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 bg-[#161B22] px-2.5 py-1.5 rounded-xl border border-white/[0.06]">
              <Filter className="w-3.5 h-3.5 text-[#F97316]" />
              <span className="text-[#8B949E]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white focus:outline-none cursor-pointer font-semibold uppercase"
              >
                <option value="ALL" className="bg-[#161B22]">ALL</option>
                <option value="pending" className="bg-[#161B22]">PENDING</option>
                <option value="approved" className="bg-[#161B22]">APPROVED</option>
                <option value="flagged" className="bg-[#161B22]">FLAGGED</option>
                <option value="rejected" className="bg-[#161B22]">REJECTED</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#161B22] px-2.5 py-1.5 rounded-xl border border-white/[0.06]">
              <span className="text-[#8B949E]">Sector:</span>
              <select
                value={sectorFilter}
                onChange={(e) => {
                  setSectorFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#161B22]">All Sectors</option>
                <option value="Product" className="bg-[#161B22]">Product / SaaS</option>
                <option value="Service" className="bg-[#161B22]">IT Services</option>
                <option value="Fintech" className="bg-[#161B22]">Fintech</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#161B22] px-2.5 py-1.5 rounded-xl border border-white/[0.06]">
              <Clock className="w-3.5 h-3.5 text-[#F97316]" />
              <span className="text-[#8B949E]">Sort:</span>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as 'newest' | 'oldest');
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white focus:outline-none cursor-pointer font-semibold"
              >
                <option value="newest" className="bg-[#161B22]">Newest First</option>
                <option value="oldest" className="bg-[#161B22]">Oldest First</option>
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
                <th className="py-3 px-4 font-medium">#</th>
                <th className="py-3 px-4 font-medium">TIME UPLOADED</th>
                <th className="py-3 px-4 font-medium">CITY</th>
                <th className="py-3 px-4 font-medium">ROLE CATEGORY</th>
                <th className="py-3 px-4 font-medium">SECTOR</th>
                <th className="py-3 px-4 font-medium">CTC BAND</th>
                <th className="py-3 px-4 font-medium">TRAP FLAGS</th>
                <th className="py-3 px-4 font-medium">COUNTER SHOWN</th>
                <th className="py-3 px-4 font-medium">STATUS</th>
                <th className="py-3 px-4 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#8B949E] font-mono">
                    No matching offer letter submissions found ✓
                  </td>
                </tr>
              ) : (
                paginated.map((row, idx) => {
                  const seqNo = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedIdx(idx)}
                      className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${
                        selectedIdx === idx ? 'bg-[#F97316]/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-white">#{seqNo}</td>
                      <td className="py-3.5 px-4 text-[#E8C547] font-mono whitespace-nowrap">{formatDateTime(row.submitted_at)}</td>
                      <td className="py-3.5 px-4 text-white font-medium">{row.city}</td>
                      <td className="py-3.5 px-4 text-white">{row.role_category}</td>
                      <td className="py-3.5 px-4 text-[#8B949E] font-mono">{row.employer_sector}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#F97316]">{row.ctc_band}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {row.trap_flags.map((flag) => {
                            const isRed = flag.includes('CTC Inflation') || flag.includes('Clawback');
                            return (
                              <span
                                key={flag}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 ${
                                  isRed
                                    ? 'bg-[#F85149]/15 text-[#F85149] border border-[#F85149]/30'
                                    : 'bg-[#E8C547]/15 text-[#E8C547] border border-[#E8C547]/30'
                                }`}
                              >
                                {isRed ? '🔴' : '🟡'} {flag}
                              </span>
                            );
                          })}
                          {row.trap_flags.length === 0 && (
                            <span className="text-[11px] font-mono text-[#22C55E]">None ✓</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#22C55E]">{row.counter_offer_shown}</td>
                      <td className="py-3.5 px-4">
                        <StatusPill status={row.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        {row.status !== 'approved' && (
                          <button
                            onClick={() => handleStatusChange(row.id, 'approved')}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg bg-[#22C55E]/15 text-[#22C55E] hover:bg-[#22C55E] hover:text-[#080A0E] transition-all font-mono text-[10px] font-semibold"
                          >
                            Approve
                          </button>
                        )}
                        {row.status !== 'rejected' && (
                          <button
                            onClick={() => setRejectingId(row.id)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg bg-[#F85149]/15 text-[#F85149] hover:bg-[#F85149] hover:text-white transition-all font-mono text-[10px] font-semibold"
                          >
                            Reject
                          </button>
                        )}
                        {row.status !== 'flagged' && (
                          <button
                            onClick={() => handleStatusChange(row.id, 'flagged')}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg bg-[#E8C547]/15 text-[#E8C547] hover:bg-[#E8C547] hover:text-[#080A0E] transition-all font-mono text-[10px] font-semibold"
                          >
                            Flag
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedIdx(idx)}
                          className="p-1.5 rounded-lg bg-white/[0.04] text-[#8B949E] hover:text-white hover:bg-white/[0.08] transition-all inline-flex items-center gap-1 font-mono text-[10px]"
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

        {/* Pagination Bar */}
        <div className="p-4 border-t border-white/[0.06] bg-[#161B22]/40 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#8B949E]">
          <div>
            Showing <span className="text-white font-semibold">{(currentPage - 1) * pageSize + 1}</span> -{' '}
            <span className="text-white font-semibold">{Math.min(currentPage * pageSize, filtered.length)}</span> of{' '}
            <span className="text-white font-semibold">{filtered.length}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#0F1218] text-white border border-white/[0.08] rounded px-2 py-1 focus:outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded bg-[#0F1218] border border-white/[0.08] text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2">
                Page <strong className="text-white">{currentPage}</strong> / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded bg-[#0F1218] border border-white/[0.08] text-white disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      <AnimatePresence>
        {rejectingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0F1218] border border-[#F85149]/30 rounded-2xl p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-[#F85149]" />
                  <span>Select Rejection Reason</span>
                </h3>
                <button onClick={() => setRejectingId(null)} className="text-[#8B949E] hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mb-6">
                {[
                  'Implausible data (outlier CTC/salary)',
                  'PII detected in extracted fields',
                  'Incomplete extraction',
                  'Suspected duplicate',
                  'Structural anomaly',
                  'Other',
                ].map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      rejectReason === reason
                        ? 'bg-[#F85149]/15 border-[#F85149]/40 text-white'
                        : 'bg-[#161B22] border-white/[0.06] text-[#8B949E]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejectionReason"
                      value={reason}
                      checked={rejectReason === reason}
                      onChange={() => setRejectReason(reason)}
                      className="accent-[#F85149]"
                    />
                    <span className="text-xs font-medium">{reason}</span>
                  </label>
                ))}

                {rejectReason === 'Other' && (
                  <input
                    type="text"
                    placeholder="Type custom rejection reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full mt-2 bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setRejectingId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#8B949E] hover:text-white bg-white/[0.04]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const finalReason = rejectReason === 'Other' ? customReason || 'Other rejection reason' : rejectReason;
                    handleStatusChange(rejectingId, 'rejected', finalReason);
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F85149] text-white hover:bg-[#F85149]/90 transition-all shadow-lg shadow-[#F85149]/20"
                >
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slide-over Panel */}
      <AnimatePresence>
        {currentRecord && (
          <>
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedIdx(null)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-5xl z-50 bg-[#080A0E] border-l border-white/[0.08] shadow-2xl flex flex-col sm:flex-row overflow-hidden"
            >
              {/* LEFT 60% */}
              <div className="w-full sm:w-[60%] border-r border-white/[0.06] flex flex-col h-full bg-[#0F1218]">
                <div className="p-5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center text-[#F97316] font-mono font-bold">
                      #{(currentPage - 1) * pageSize + (selectedIdx || 0) + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white font-mono">
                        Offer Letter Submission Details
                      </h3>
                      <p className="text-xs text-[#E8C547] font-mono mt-0.5">Uploaded {formatDateTime(currentRecord.submitted_at)} • {currentRecord.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={currentRecord.status} />
                    <button onClick={() => setSelectedIdx(null)} className="p-1 text-[#8B949E] hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
                  {/* Market Position Section */}
                  <div className="bg-[#161B22] border border-white/[0.06] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-[#8B949E] font-mono uppercase tracking-wider">
                        Market Compensation Percentile
                      </h4>
                      <span className="text-[10px] font-mono text-[#F97316] bg-[#F97316]/10 px-2 py-0.5 rounded border border-[#F97316]/20">
                        BENCHMARKED IN {currentRecord.city.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 font-mono text-xs">
                      <div className="flex justify-between text-white font-semibold">
                        <span>This Offer: {currentRecord.extracted_data?.headline_ctc || currentRecord.ctc_band}</span>
                        <span className="text-[#E8C547]">28th Percentile</span>
                      </div>

                      <div className="relative w-full h-4 bg-[#0F1218] rounded-full overflow-hidden border border-white/10">
                        <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#F85149] via-[#E8C547] to-[#22C55E] w-full opacity-40" />
                        <div
                          className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-lg border border-black z-10"
                          style={{ left: '28%' }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-[#8B949E]">
                        <span>Min</span>
                        <span>City Median</span>
                        <span>75th Pctl</span>
                        <span>Max</span>
                      </div>
                    </div>
                  </div>

                  {/* Trap Flags Detail Section */}
                  <div className="bg-[#161B22] border border-white/[0.06] rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-[#8B949E] font-mono uppercase tracking-wider">
                      Detected Trap Flags & Structural Explanations
                    </h4>
                    <div className="space-y-3">
                      {currentRecord.trap_flags.length === 0 ? (
                        <p className="text-xs text-[#22C55E] font-mono">No trap flags detected in this offer letter ✓</p>
                      ) : (
                        currentRecord.trap_flags.map((flag) => {
                          const isRed = flag.includes('CTC Inflation') || flag.includes('Clawback');
                          return (
                            <div key={flag} className="p-3.5 rounded-xl bg-[#0F1218] border border-white/[0.06] text-xs space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={isRed ? 'text-[#F85149]' : 'text-[#E8C547]'}>
                                  {isRed ? '🔴' : '🟡'}
                                </span>
                                <h5 className="font-bold text-white font-mono">{flag} Detected</h5>
                              </div>
                              <p className="text-[#8B949E] leading-relaxed pl-5">
                                {flag.includes('CTC Inflation') &&
                                  'Employer PF contribution (₹54,000/yr) appears to be included in headline figure.'}
                                {flag.includes('90-Day Notice') &&
                                  'Above industry standard of 30-60 days. Reduces career mobility significantly.'}
                                {flag.includes('Clawback') &&
                                  'Contains clause requiring repayment of bonus or cert reimbursement if leaving within specified period.'}
                                {!flag.includes('CTC Inflation') && !flag.includes('90-Day Notice') && !flag.includes('Clawback') &&
                                  'Structural or policy condition flagged during automated offer check.'}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Complete Collected Offer Details & Raw JSON Payload */}
                  <div className="bg-[#161B22] border border-white/[0.06] rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-[#8B949E] font-mono uppercase tracking-wider">
                      All Collected Offer Details & Contents
                    </h4>
                    <div className="space-y-2.5">
                      {Object.entries(currentRecord.extracted_data || {}).length === 0 ? (
                        <p className="text-xs text-[#8B949E] font-mono py-2">No additional JSON fields attached to this submission.</p>
                      ) : (
                        Object.entries(currentRecord.extracted_data || {}).map(([key, val]) => {
                          if (key === 'internal_notes' || key === 'status' || key === 'rejection_reason') return null;
                          const displayVal = typeof val === 'object' && val !== null ? JSON.stringify(val, null, 2) : String(val);
                          if (!displayVal || displayVal === 'undefined' || displayVal === '{}' || displayVal === '[]') return null;
                          return (
                            <div key={key} className="p-3 rounded-xl bg-[#0F1218] border border-white/[0.04] space-y-1">
                              <p className="text-[10px] text-[#F97316] font-mono uppercase font-bold tracking-wider">{key.replace(/_/g, ' ')}</p>
                              <pre className="text-xs text-white font-mono whitespace-pre-wrap break-words leading-relaxed">{displayVal}</pre>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* What The User Saw Section */}
                  <div className="bg-[#161B22] border border-white/[0.06] rounded-2xl p-4 space-y-3 font-mono">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider">
                        What The Candidate Saw (QA Output)
                      </h4>
                      <span className="text-[10px] text-[#F97316]">AI COUNTER OFFER GENERATED</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0F1218] border border-white/[0.04] space-y-2">
                      <div className="flex justify-between items-center text-xs text-white">
                        <span>Recommended Counter Offer:</span>
                        <strong className="text-lg text-[#22C55E]">{currentRecord.counter_offer_shown}</strong>
                      </div>
                      <div className="pt-2 border-t border-white/[0.06]">
                        <p className="text-[10px] text-[#8B949E] uppercase mb-1">Negotiation Email Draft Shown:</p>
                        <pre className="text-xs text-[#F0F6FC] whitespace-pre-wrap bg-[#161B22] p-3 rounded-lg border border-white/[0.04] font-sans">
                          {currentRecord.negotiation_email}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Keyboard shortcuts */}
                <div className="p-3.5 border-t border-white/[0.06] bg-[#161B22]/60 flex items-center justify-between text-[11px] font-mono text-[#8B949E]">
                  <div className="flex items-center gap-3">
                    <span><kbd className="px-1.5 py-0.5 rounded bg-[#0F1218] text-white">A</kbd> Approve</span>
                    <span><kbd className="px-1.5 py-0.5 rounded bg-[#0F1218] text-white">R</kbd> Reject</span>
                    <span><kbd className="px-1.5 py-0.5 rounded bg-[#0F1218] text-white">F</kbd> Flag</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span><kbd className="px-1.5 py-0.5 rounded bg-[#0F1218] text-white">ESC</kbd> Close</span>
                  </div>
                </div>
              </div>

              {/* RIGHT 40% */}
              <div className="w-full sm:w-[40%] flex flex-col h-full bg-[#161B22]">
                <div className="p-5 border-b border-white/[0.06] shrink-0">
                  <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                    Actions & Audit History
                  </h3>
                  <p className="text-xs text-[#8B949E] mt-0.5">
                    Status: <strong className="text-white uppercase font-mono">{currentRecord.status}</strong>
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
                  {/* Action Buttons */}
                  <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] font-mono text-[#8B949E] uppercase font-semibold">State Actions</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleStatusChange(currentRecord.id, 'approved')}
                        disabled={actionLoading || currentRecord.status === 'approved'}
                        className="w-full py-2.5 rounded-xl bg-[#22C55E] text-[#080A0E] text-xs font-semibold hover:bg-[#22C55E]/90 disabled:opacity-40 transition-all shadow-lg shadow-[#22C55E]/15 flex items-center justify-center gap-2 font-mono"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>APPROVE (A)</span>
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setRejectingId(currentRecord.id)}
                          disabled={actionLoading || currentRecord.status === 'rejected'}
                          className="w-full py-2 rounded-xl bg-[#F85149]/15 text-[#F85149] border border-[#F85149]/30 hover:bg-[#F85149] hover:text-white disabled:opacity-40 transition-all text-xs font-semibold font-mono flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>REJECT (R)</span>
                        </button>
                        <button
                          onClick={() => handleStatusChange(currentRecord.id, 'flagged')}
                          disabled={actionLoading || currentRecord.status === 'flagged'}
                          className="w-full py-2 rounded-xl bg-[#E8C547]/15 text-[#E8C547] border border-[#E8C547]/30 hover:bg-[#E8C547] hover:text-[#080A0E] disabled:opacity-40 transition-all text-xs font-semibold font-mono flex items-center justify-center gap-1.5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>FLAG (F)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-4 space-y-4">
                    <p className="text-[10px] font-mono text-[#8B949E] uppercase font-semibold">
                      Internal Notes ({currentRecord.internal_notes?.length || 0})
                    </p>
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {(!currentRecord.internal_notes || currentRecord.internal_notes.length === 0) ? (
                        <p className="text-xs text-[#8B949E]/60 font-mono text-center py-4 italic">No internal notes yet</p>
                      ) : (
                        currentRecord.internal_notes.map((n, i) => (
                          <div key={i} className="p-3 rounded-xl bg-[#161B22] border border-white/[0.04] text-xs space-y-1">
                            <div className="flex items-center justify-between font-mono text-[10px] text-[#F97316]">
                              <span>{n.author}</span>
                              <span className="text-[#8B949E]">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-white leading-relaxed">{n.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add note for admin team..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddNote(currentRecord.id);
                        }}
                        className="flex-1 bg-[#161B22] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F97316] font-mono"
                      />
                      <button
                        onClick={() => handleAddNote(currentRecord.id)}
                        disabled={!newNoteText.trim() || actionLoading}
                        className="px-3 py-2 rounded-xl bg-[#F97316] text-[#080A0E] hover:bg-[#F97316]/90 disabled:opacity-40 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Audit Trail */}
                  <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-4 space-y-3 font-mono text-xs">
                    <p className="text-[10px] text-[#8B949E] uppercase font-semibold">Offer Audit Trail</p>
                    <div className="space-y-2 text-[#8B949E] border-l-2 border-white/[0.06] pl-3 py-1">
                      <div>
                        <p className="text-white font-medium">Offer Letter Submitted</p>
                        <p className="text-[10px]">3 hours ago • Verified anonymous ID</p>
                      </div>
                      <div className="pt-2">
                        <p className="text-white font-medium">CTC Inflation Trap Detected</p>
                        <p className="text-[10px]">3 hours ago • Counter offer ₹9.2L generated</p>
                      </div>
                    </div>
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
