'use client';

import React, { useState, useMemo } from 'react';
import { useToast } from '../ui/Toast';
import { StatusPill } from '../ui/StatusPill';
import { updateContentStatusAction, replyToContactAction } from '../../actions/contentActions';
import {
  Mail,
  Search,
  Filter,
  Eye,
  Send,
  X,
  AlertTriangle,
  Building2,
  User,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ContactRecord {
  id: string;
  created_at: string;
  name: string;
  email: string;
  organization: string;
  type: 'Placement Cell' | 'Investor / Angel' | 'Partner / Employer' | 'General Support';
  subject: string;
  message: string;
  status: 'New' | 'Read' | 'Replied' | 'Archived';
  replied_by?: string;
  replied_at?: string;
  reply_body?: string;
}

interface ContactsClientProps {
  initialRecords: ContactRecord[];
  userRole: 'SUPER_ADMIN' | 'TEAM_MEMBER';
}

const TEMPLATES: Record<string, string> = {
  placement: `Dear Prof. [Name],\n\nThank you for reaching out from [Organization] Training & Placement Cell.\n\nWe would be delighted to partner with your institution to provide your engineering students with free, verified ROI benchmarks and compensation intelligence. Our team can organize an interactive virtual workshop on "Avoiding CTC Inflation & Selecting High-ROI Tech Certifications" for your final-year batch.\n\nPlease let us know your preferred date and time this week for a brief 15-minute introductory call.\n\nWarm regards,\nCertifyd Operations Team`,
  investor: `Dear [Name],\n\nThank you for your interest in Certifyd.\n\nWe are building the definitive compensation and certification intelligence platform for India's 5M+ tech workforce. Our AI-driven ingestion flywheel is currently processing high-volume candidate extractions with a 98.4% PII compliance pass rate.\n\nI have attached our latest Executive Summary and Q3 growth metrics. Let us schedule a 30-minute overview call at your convenience.\n\nBest regards,\nCertifyd Operations Team`,
  general: `Dear [Name],\n\nThank you for contacting Certifyd Support.\n\nWe have received your message regarding "[Subject]" and our technical team has investigated the inquiry. Everything is functioning normally on the platform.\n\nPlease let us know if you have any additional questions or need further assistance.\n\nBest regards,\nCertifyd Support Team`,
};

import { useUrlFilter } from '@/hooks/useUrlFilter';

export function ContactsClient({ initialRecords, userRole }: ContactsClientProps) {
  const [records, setRecords] = useState<ContactRecord[]>(initialRecords);
  const [search, setSearch] = useUrlFilter<string>('search', '', 300);
  const [typeFilter, setTypeFilter] = useUrlFilter<string>('type', 'ALL');
  const [statusFilter, setStatusFilter] = useUrlFilter<string>('status', 'ALL');

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [templateKey, setTemplateKey] = useState('');
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (search.trim() !== '') {
        const q = search.toLowerCase();
        if (
          !r.name.toLowerCase().includes(q) &&
          !r.email.toLowerCase().includes(q) &&
          !r.organization.toLowerCase().includes(q) &&
          !r.subject.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [records, typeFilter, statusFilter, search]);

  const currentRecord = selectedIdx !== null ? filtered[selectedIdx] : null;

  function handleSelectTemplate(key: string, rec: ContactRecord) {
    setTemplateKey(key);
    if (!key) return;
    let text = TEMPLATES[key] || '';
    text = text.replace(/\[Name\]/g, rec.name.split(' ')[0] || rec.name);
    text = text.replace(/\[Organization\]/g, rec.organization || 'your institution');
    text = text.replace(/\[Subject\]/g, rec.subject);
    setReplyText(text);
  }

  async function handleStatusChange(id: string, newStatus: string) {
    setLoading(true);
    try {
      await updateContentStatusAction('contact_submissions', id, newStatus);
      setRecords((prev) => prev.map((item) => (item.id === id ? { ...item, status: newStatus as any } : item)));
      showToast(`Contact marked as ${newStatus} ✓`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReply(rec: ContactRecord) {
    if (!replyText.trim()) return;
    setLoading(true);
    try {
      await replyToContactAction(rec.id, rec.email, rec.subject, replyText.trim());
      const now = new Date().toISOString();
      setRecords((prev) =>
        prev.map((item) =>
          item.id === rec.id
            ? {
                ...item,
                status: 'Replied',
                replied_by: 'current_admin',
                replied_at: now,
                reply_body: replyText.trim(),
              }
            : item
        )
      );
      setReplyText('');
      setTemplateKey('');
      showToast(`Email reply sent to ${rec.email} ✓`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to send reply', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Contact Inquiries & Institutional Relations</h1>
          <p className="text-xs text-[#8B949E] font-mono mt-0.5">
            Placement cell partnerships, investor communications, and user support ticketing
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#8B949E]">
          <span>Total Inquiries: <strong className="text-white">{filtered.length}</strong></span>
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
              placeholder="Search sender name, email, org, or subject..."
              className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#8B949E]/50 focus:outline-none focus:border-[#F97316] font-mono transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 bg-[#161B22] px-2.5 py-1.5 rounded-xl border border-white/[0.06]">
              <Filter className="w-3.5 h-3.5 text-[#F97316]" />
              <span className="text-[#8B949E]">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#161B22]">All Types</option>
                <option value="Placement Cell" className="bg-[#161B22]">🔴 Placement Cell (High Pri)</option>
                <option value="Investor / Angel" className="bg-[#161B22]">🟡 Investor / Angel</option>
                <option value="Partner / Employer" className="bg-[#161B22]">🟢 Partner / Employer</option>
                <option value="General Support" className="bg-[#161B22]">⚪ General Support</option>
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
                <option value="Read" className="bg-[#161B22]">Read</option>
                <option value="Replied" className="bg-[#161B22]">Replied</option>
                <option value="Archived" className="bg-[#161B22]">Archived</option>
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
                <th className="py-3.5 px-4 font-medium">NAME</th>
                <th className="py-3.5 px-4 font-medium">EMAIL</th>
                <th className="py-3.5 px-4 font-medium">ORGANIZATION</th>
                <th className="py-3.5 px-4 font-medium">INQUIRY TYPE</th>
                <th className="py-3.5 px-4 font-medium">SUBJECT</th>
                <th className="py-3.5 px-4 font-medium">STATUS</th>
                <th className="py-3.5 px-4 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8B949E] font-mono">
                    No matching contact messages found ✓
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const isHighPri = item.type === 'Placement Cell';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setSelectedIdx(idx);
                        if (item.status === 'New') handleStatusChange(item.id, 'Read');
                      }}
                      className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${
                        isHighPri && item.status === 'New' ? 'bg-[#F85149]/5 font-medium' : ''
                      }`}
                    >
                      <td className="py-4 px-4 text-[#8B949E] font-mono">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="py-4 px-4 text-white font-semibold">{item.name}</td>
                      <td className="py-4 px-4 text-[#F97316] font-mono">{item.email}</td>
                      <td className="py-4 px-4 text-white">{item.organization || '—'}</td>
                      <td className="py-4 px-4 font-mono">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            item.type === 'Placement Cell'
                              ? 'bg-[#F85149]/15 text-[#F85149] border border-[#F85149]/30 animate-pulse'
                              : item.type === 'Investor / Angel'
                              ? 'bg-[#E8C547]/15 text-[#E8C547] border border-[#E8C547]/30'
                              : item.type === 'Partner / Employer'
                              ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                              : 'bg-white/10 text-[#8B949E]'
                          }`}
                        >
                          {item.type === 'Placement Cell' && <span className="w-1.5 h-1.5 rounded-full bg-[#F85149]" />}
                          <span>{item.type}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-white max-w-xs truncate">{item.subject}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold uppercase ${
                            item.status === 'Replied'
                              ? 'bg-[#22C55E]/15 text-[#22C55E]'
                              : item.status === 'Read'
                              ? 'bg-[#3B82F6]/15 text-[#3B82F6]'
                              : item.status === 'New'
                              ? 'bg-[#E8C547]/15 text-[#E8C547]'
                              : 'bg-white/10 text-[#8B949E]'
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
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl z-50 bg-[#0F1218] border-l border-white/[0.08] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-5 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-[#161B22]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center text-[#F97316]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white font-mono">Contact Message #{currentRecord.id.substring(0, 8)}</h3>
                    <p className="text-xs text-[#8B949E] mt-0.5">{currentRecord.type} Inquiry</p>
                  </div>
                </div>
                <button onClick={() => setSelectedIdx(null)} className="p-1 text-[#8B949E] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Sender Details */}
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-[#161B22] border border-white/[0.04]">
                    <p className="text-[#8B949E] uppercase text-[10px]">From Sender</p>
                    <p className="text-white font-bold mt-1 text-sm">{currentRecord.name}</p>
                    <p className="text-[#F97316] mt-0.5">{currentRecord.email}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#161B22] border border-white/[0.04]">
                    <p className="text-[#8B949E] uppercase text-[10px]">Organization & Date</p>
                    <p className="text-white font-bold mt-1 text-sm">{currentRecord.organization || 'Individual'}</p>
                    <p className="text-[#8B949E] mt-0.5">{new Date(currentRecord.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {/* Message Body */}
                <div className="p-4 rounded-2xl bg-[#161B22] border border-white/[0.06] space-y-2">
                  <h4 className="text-xs font-mono text-[#8B949E] uppercase font-semibold">Subject: {currentRecord.subject}</h4>
                  <p className="text-sm text-white leading-relaxed font-sans pt-2 border-t border-white/[0.04] whitespace-pre-wrap">
                    {currentRecord.message}
                  </p>
                </div>

                {/* Status Switcher */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[#161B22] border border-white/[0.04] text-xs font-mono">
                  <span className="text-[#8B949E]">Current Workflow Status:</span>
                  <div className="flex gap-1.5">
                    {['Read', 'Replied', 'Archived'].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(currentRecord.id, st)}
                        disabled={loading || currentRecord.status === st}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          currentRecord.status === st
                            ? 'bg-[#F97316] text-[#080A0E] shadow-sm'
                            : 'bg-[#0F1218] border border-white/10 text-[#8B949E] hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reply Composer */}
                <div className="p-5 rounded-2xl bg-[#161B22] border border-white/[0.06] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono text-[#F97316] uppercase font-bold flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" />
                      <span>Email Reply Composer</span>
                    </h4>

                    {/* Template Dropdown */}
                    <select
                      value={templateKey}
                      onChange={(e) => handleSelectTemplate(e.target.value, currentRecord)}
                      className="bg-[#0F1218] text-xs text-white border border-white/10 rounded-lg px-2.5 py-1 focus:outline-none font-mono"
                    >
                      <option value="">Load Response Template...</option>
                      <option value="placement">🔴 Placement Cell Workshop Offer</option>
                      <option value="investor">🟡 Investor Information Kit Deck</option>
                      <option value="general">⚪ General Support Acknowledgement</option>
                    </select>
                  </div>

                  {currentRecord.reply_body ? (
                    <div className="p-3.5 rounded-xl bg-[#0F1218] border border-[#22C55E]/30 text-xs space-y-1 font-mono">
                      <div className="flex items-center justify-between text-[#22C55E]">
                        <span className="font-bold">✓ Replied by {currentRecord.replied_by}</span>
                        <span>{new Date(currentRecord.replied_at || '').toLocaleDateString()}</span>
                      </div>
                      <p className="text-white pt-2 whitespace-pre-wrap font-sans">{currentRecord.reply_body}</p>
                    </div>
                  ) : null}

                  <textarea
                    rows={6}
                    placeholder={`Write email response to ${currentRecord.name} (${currentRecord.email})...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full bg-[#0F1218] border border-white/[0.08] rounded-xl p-3.5 text-xs text-white placeholder-[#8B949E]/50 focus:outline-none focus:border-[#F97316] font-sans transition-colors"
                  />

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] font-mono text-[#8B949E]">
                      Will send via Resend SMTP / record in audit log
                    </span>
                    <button
                      onClick={() => handleSendReply(currentRecord)}
                      disabled={!replyText.trim() || loading}
                      className="px-5 py-2 rounded-xl bg-[#F97316] text-[#080A0E] font-mono text-xs font-bold hover:bg-[#F97316]/90 disabled:opacity-40 transition-all shadow-lg shadow-[#F97316]/20 flex items-center gap-1.5"
                    >
                      {loading ? (
                        <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Send Reply & Mark Replied</span>
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
