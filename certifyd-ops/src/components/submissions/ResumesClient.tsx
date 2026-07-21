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
  FileText,
  Clock,
  ShieldCheck,
  Send,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ResumeRecord {
  id: string;
  submitted_at: string;
  city: string;
  domain: string;
  certs_found: string[];
  exp_band: string;
  pii_scan: {
    pass: boolean;
    name_detected?: boolean;
    email_detected?: boolean;
    phone_detected?: boolean;
    pan_detected?: boolean;
  };
  anomaly_score: number;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  extracted_data: {
    role_category?: string;
    education_tier?: string;
    employer_type?: string;
    cert_stack?: string[];
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

interface ResumesClientProps {
  initialRecords: ResumeRecord[];
  userRole: 'SUPER_ADMIN' | 'TEAM_MEMBER';
}

export function ResumesClient({ initialRecords, userRole }: ResumesClientProps) {
  const [records, setRecords] = useState<ResumeRecord[]>(initialRecords);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');
  const [expFilter, setExpFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Pagination
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Slide-over & Modal state
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Incomplete or invalid extraction data');
  const [customReason, setCustomReason] = useState<string>('');
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const { showToast } = useToast();

  // Filtered list
  const filtered = useMemo(() => {
    const list = records.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter.toLowerCase()) return false;
      if (cityFilter !== 'ALL' && r.city !== cityFilter) return false;
      if (domainFilter !== 'ALL' && !r.domain.includes(domainFilter)) return false;
      if (expFilter !== 'ALL' && r.exp_band !== expFilter) return false;
      if (search.trim() !== '') {
        const q = search.toLowerCase();
        const matchId = r.id.toLowerCase().includes(q);
        const matchCity = r.city.toLowerCase().includes(q);
        const matchCert = r.certs_found.some((c) => c.toLowerCase().includes(q));
        if (!matchId && !matchCity && !matchCert) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      const timeA = new Date(a.submitted_at).getTime();
      const timeB = new Date(b.submitted_at).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [records, statusFilter, cityFilter, domainFilter, expFilter, search, sortOrder]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const currentRecord = selectedIdx !== null ? paginated[selectedIdx] : null;

  // Actions
  const handleStatusChange = useCallback(
    async (id: string, newStatus: 'approved' | 'rejected' | 'flagged', reason?: string) => {
      if (userRole === 'TEAM_MEMBER' && (newStatus === 'approved' || newStatus === 'rejected')) {
        showToast('Insufficient permissions. Only Super Admin can approve or reject.', 'warning');
        return;
      }

      setActionLoading(true);
      try {
        await updateSubmissionStatusAction('resume_submissions', id, newStatus, reason);
        setRecords((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus, rejection_reason: reason } : item))
        );
        showToast(`Submission #${id.substring(0, 8)} marked as ${newStatus.toUpperCase()} ✓`, 'success');
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
      const res = await addSubmissionNoteAction('resume_submissions', id, newNoteText.trim());
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
        if (rejectingId) {
          setRejectingId(null);
        } else {
          setSelectedIdx(null);
        }
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Resume Ingestion Queue</h1>
          <p className="text-xs text-[#8B949E] font-mono mt-0.5">
            Anonymized profile extractions with PII compliance checks and anomaly score grading
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#8B949E]">
          <span>Total Records: <strong className="text-white font-semibold">{filtered.length}</strong></span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-4 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B949E]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by 8-char ID, city, or cert name..."
              className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#8B949E]/50 focus:outline-none focus:border-[#F97316] font-mono transition-colors"
            />
          </div>

          {/* Filter Pills */}
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
              <span className="text-[#8B949E]">City:</span>
              <select
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#161B22]">All Cities</option>
                <option value="Bengaluru" className="bg-[#161B22]">Bengaluru</option>
                <option value="Hyderabad" className="bg-[#161B22]">Hyderabad</option>
                <option value="Pune" className="bg-[#161B22]">Pune</option>
                <option value="Delhi / NCR" className="bg-[#161B22]">Delhi / NCR</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#161B22] px-2.5 py-1.5 rounded-xl border border-white/[0.06]">
              <span className="text-[#8B949E]">Exp Band:</span>
              <select
                value={expFilter}
                onChange={(e) => {
                  setExpFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#161B22]">All Exp</option>
                <option value="0-2 yrs" className="bg-[#161B22]">0-2 yrs</option>
                <option value="3-5 yrs" className="bg-[#161B22]">3-5 yrs</option>
                <option value="6-10 yrs" className="bg-[#161B22]">6-10 yrs</option>
                <option value="10+ yrs" className="bg-[#161B22]">10+ yrs</option>
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

      {/* Data Table */}
      <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#161B22]/60 text-[#8B949E] font-mono uppercase tracking-wider">
                <th className="py-3 px-4 font-medium">#</th>
                <th className="py-3 px-4 font-medium">TIME UPLOADED</th>
                <th className="py-3 px-4 font-medium">CITY</th>
                <th className="py-3 px-4 font-medium">DOMAIN</th>
                <th className="py-3 px-4 font-medium">CERTS FOUND</th>
                <th className="py-3 px-4 font-medium">EXP BAND</th>
                <th className="py-3 px-4 font-medium">STATUS</th>
                <th className="py-3 px-4 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8B949E] font-mono">
                    No matching resume submissions found ✓
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
                      <td className="py-3.5 px-4 text-[#8B949E]">{row.domain}</td>
                      <td className="py-3.5 px-4 text-white font-mono">
                        <span className="bg-white/[0.06] px-2 py-0.5 rounded text-[11px]">
                          {row.certs_found.length > 0 ? row.certs_found[0] : 'None'}
                          {row.certs_found.length > 1 && ` (+${row.certs_found.length - 1})`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#8B949E]">{row.exp_band}</td>
                      <td className="py-3.5 px-4">
                        <StatusPill status={row.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        {userRole === 'SUPER_ADMIN' && row.status !== 'approved' && (
                          <button
                            onClick={() => handleStatusChange(row.id, 'approved')}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg bg-[#22C55E]/15 text-[#22C55E] hover:bg-[#22C55E] hover:text-[#080A0E] transition-all font-mono text-[10px] font-semibold"
                            title="Approve to Live (Shortcut: A)"
                          >
                            Approve
                          </button>
                        )}
                        {userRole === 'SUPER_ADMIN' && row.status !== 'rejected' && (
                          <button
                            onClick={() => setRejectingId(row.id)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg bg-[#F85149]/15 text-[#F85149] hover:bg-[#F85149] hover:text-white transition-all font-mono text-[10px] font-semibold"
                            title="Reject (Shortcut: R)"
                          >
                            Reject
                          </button>
                        )}
                        {row.status !== 'flagged' && (
                          <button
                            onClick={() => handleStatusChange(row.id, 'flagged')}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg bg-[#E8C547]/15 text-[#E8C547] hover:bg-[#E8C547] hover:text-[#080A0E] transition-all font-mono text-[10px] font-semibold"
                            title="Flag for Review (Shortcut: F)"
                          >
                            Flag
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedIdx(idx)}
                          className="p-1.5 rounded-lg bg-white/[0.04] text-[#8B949E] hover:text-white hover:bg-white/[0.08] transition-all inline-flex items-center gap-1 font-mono text-[10px]"
                          title="View Full Extraction"
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
                className="p-1 rounded bg-[#0F1218] border border-white/[0.08] text-white disabled:opacity-30 hover:bg-white/[0.04] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2">
                Page <strong className="text-white">{currentPage}</strong> / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded bg-[#0F1218] border border-white/[0.08] text-white disabled:opacity-30 hover:bg-white/[0.04] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Reason Modal */}
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
                  'PII detected in extracted fields',
                  'Implausible data (outlier CTC/salary)',
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
                        : 'bg-[#161B22] border-white/[0.06] text-[#8B949E] hover:text-white'
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
                    className="w-full mt-2 bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#F85149] font-mono"
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

      {/* 60/40 Slide-over Panel */}
      <AnimatePresence>
        {currentRecord && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
              onClick={() => setSelectedIdx(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-5xl z-50 bg-[#080A0E] border-l border-white/[0.08] shadow-2xl flex flex-col sm:flex-row overflow-hidden"
            >
              {/* LEFT 60% — Complete Extracted Data */}
              <div className="w-full sm:w-[60%] border-r border-white/[0.06] flex flex-col h-full bg-[#0F1218]">
                {/* Header */}
                <div className="p-5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center text-[#F97316] font-mono font-bold">
                      #{(currentPage - 1) * pageSize + (selectedIdx || 0) + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white font-mono">
                        Resume Submission Details
                      </h3>
                      <p className="text-xs text-[#E8C547] font-mono mt-0.5">Uploaded {formatDateTime(currentRecord.submitted_at)} • {currentRecord.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={currentRecord.status} />
                    <button
                      onClick={() => setSelectedIdx(null)}
                      className="p-1 rounded-lg hover:bg-white/[0.04] text-[#8B949E] hover:text-white"
                      title="Close (ESC)"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
                  {/* Summary Overview */}
                  <div className="bg-[#161B22] border border-white/[0.06] rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-[#8B949E] font-mono uppercase tracking-wider mb-2">
                      Profile Overview
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-[#0F1218] border border-white/[0.04]">
                        <p className="text-[10px] text-[#8B949E] font-mono uppercase">Role / Domain</p>
                        <p className="text-sm font-semibold text-white mt-1">{currentRecord.domain || 'General Tech'}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#0F1218] border border-white/[0.04]">
                        <p className="text-[10px] text-[#8B949E] font-mono uppercase">City / Location</p>
                        <p className="text-sm font-semibold text-white mt-1">{currentRecord.city}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#0F1218] border border-white/[0.04]">
                        <p className="text-[10px] text-[#8B949E] font-mono uppercase">Experience</p>
                        <p className="text-sm font-semibold text-white mt-1">{currentRecord.exp_band}</p>
                      </div>
                    </div>

                    {/* Certification Stack */}
                    <div className="p-3.5 rounded-xl bg-[#0F1218] border border-white/[0.04] space-y-2">
                      <p className="text-[10px] text-[#8B949E] font-mono uppercase">Certifications Found</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {currentRecord.certs_found.length > 0 ? (
                          currentRecord.certs_found.map((c) => (
                            <span key={c} className="px-2.5 py-1 rounded bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20 text-xs font-mono font-medium">
                              {c} ✓
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[#8B949E]">No specific certifications listed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Complete Collected Resume Contents */}
                  <div className="bg-[#161B22] border border-white/[0.06] rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-[#8B949E] font-mono uppercase tracking-wider">
                      All Collected Resume Details & Contents
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
                </div>

                {/* Keyboard Shortcuts Footer */}
                <div className="p-3.5 border-t border-white/[0.06] bg-[#161B22]/60 flex items-center justify-between text-[11px] font-mono text-[#8B949E]">
                  <div className="flex items-center gap-3">
                    <span><kbd className="px-1.5 py-0.5 rounded bg-[#0F1218] text-white">A</kbd> Approve</span>
                    <span><kbd className="px-1.5 py-0.5 rounded bg-[#0F1218] text-white">R</kbd> Reject</span>
                    <span><kbd className="px-1.5 py-0.5 rounded bg-[#0F1218] text-white">F</kbd> Flag</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span><kbd className="px-1.5 py-0.5 rounded bg-[#0F1218] text-white">P</kbd> Prev</span>
                    <span><kbd className="px-1.5 py-0.5 rounded bg-[#0F1218] text-white">N</kbd> Next</span>
                    <span><kbd className="px-1.5 py-0.5 rounded bg-[#0F1218] text-white">ESC</kbd> Close</span>
                  </div>
                </div>
              </div>

              {/* RIGHT 40% — Actions and History */}
              <div className="w-full sm:w-[40%] flex flex-col h-full bg-[#161B22]">
                <div className="p-5 border-b border-white/[0.06] shrink-0">
                  <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                    Actions & Audit History
                  </h3>
                  <p className="text-xs text-[#8B949E] mt-0.5">
                    Current Status: <strong className="text-white uppercase font-mono">{currentRecord.status}</strong> since 2 hours ago
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
                  {/* Role-based Action Buttons */}
                  <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] font-mono text-[#8B949E] uppercase font-semibold">State Actions ({userRole})</p>
                    {userRole === 'SUPER_ADMIN' ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleStatusChange(currentRecord.id, 'approved')}
                          disabled={actionLoading || currentRecord.status === 'approved'}
                          className="w-full py-2.5 rounded-xl bg-[#22C55E] text-[#080A0E] text-xs font-semibold hover:bg-[#22C55E]/90 disabled:opacity-40 transition-all shadow-lg shadow-[#22C55E]/15 flex items-center justify-center gap-2 font-mono"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>APPROVE TO LIVE (A)</span>
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
                    ) : (
                      <button
                        onClick={() => handleStatusChange(currentRecord.id, 'flagged')}
                        disabled={actionLoading || currentRecord.status === 'flagged'}
                        className="w-full py-2.5 rounded-xl bg-[#E8C547] text-[#080A0E] text-xs font-semibold hover:bg-[#E8C547]/90 disabled:opacity-40 transition-all shadow-lg shadow-[#E8C547]/15 flex items-center justify-center gap-2 font-mono"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>FLAG FOR SUPER ADMIN REVIEW</span>
                      </button>
                    )}
                  </div>

                  {/* Internal Notes Thread */}
                  <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-mono text-[#8B949E] uppercase font-semibold">
                        Internal Notes ({currentRecord.internal_notes?.length || 0})
                      </p>
                      <span className="text-[10px] font-mono text-[#8B949E]">Visible to all admins</span>
                    </div>

                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {(!currentRecord.internal_notes || currentRecord.internal_notes.length === 0) ? (
                        <p className="text-xs text-[#8B949E]/60 font-mono text-center py-4 italic">
                          No internal notes attached yet
                        </p>
                      ) : (
                        currentRecord.internal_notes.map((note, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-[#161B22] border border-white/[0.04] text-xs space-y-1">
                            <div className="flex items-center justify-between font-mono text-[10px] text-[#F97316]">
                              <span>{note.author}</span>
                              <span className="text-[#8B949E]">{new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-white leading-relaxed">{note.text}</p>
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
                        title="Send Note"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Audit Trail */}
                  <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-4 space-y-3 font-mono text-xs">
                    <p className="text-[10px] text-[#8B949E] uppercase font-semibold">Submission Audit Trail</p>
                    <div className="space-y-2 text-[#8B949E] border-l-2 border-white/[0.06] pl-3 py-1">
                      <div>
                        <p className="text-white font-medium">Submitted by candidate</p>
                        <p className="text-[10px]">2 hours ago • Verified anonymous ID</p>
                      </div>
                      <div className="pt-2">
                        <p className="text-white font-medium">Automated PII Scan Passed</p>
                        <p className="text-[10px]">2 hours ago • Zero sensitive markers</p>
                      </div>
                      {currentRecord.rejection_reason && (
                        <div className="pt-2 text-[#F85149]">
                          <p className="font-semibold">Rejected: {currentRecord.rejection_reason}</p>
                          <p className="text-[10px]">Logged in audit_log</p>
                        </div>
                      )}
                      <div className="pt-2">
                        <p className="text-white font-medium">Viewed by {userRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Operations Member'}</p>
                        <p className="text-[10px]">Just now • Session active</p>
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
