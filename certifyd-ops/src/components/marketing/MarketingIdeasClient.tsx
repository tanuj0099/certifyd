'use client';

import React, { useState } from 'react';
import { useUrlFilter } from '@/hooks/useUrlFilter';
import { Lightbulb, Plus, Copy, Check, Trash2, Edit3, MessageSquare, Filter, Share2, Sparkles, Send, Tag, User } from 'lucide-react';
import { OpsMarketingIdea, OpsTeamMember, saveMarketingIdeaAction, deleteMarketingIdeaAction } from '../../actions/opsActions';
import { AssigneeSelector } from '../ops/AssigneeSelector';
import { useToast } from '../ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';

interface MarketingIdeasClientProps {
  initialIdeas: OpsMarketingIdea[];
  userEmail: string;
  teamMembers?: OpsTeamMember[];
}

const CHANNELS: OpsMarketingIdea['channel'][] = ['LinkedIn', 'YouTube', 'Email Outreach', 'Instagram', 'Sales Pitch'];
const STATUSES: OpsMarketingIdea['status'][] = ['Draft', 'In Review', 'Approved', 'Live'];

export function MarketingIdeasClient({ initialIdeas, userEmail, teamMembers = [] }: MarketingIdeasClientProps) {
  const [ideas, setIdeas] = useState<OpsMarketingIdea[]>(initialIdeas);
  const [filterChannel, setFilterChannel] = useUrlFilter<string>('channel', 'All');
  const [filterStatus, setFilterStatus] = useUrlFilter<string>('status', 'All');
  const [filterAssignee, setFilterAssignee] = useUrlFilter<'all' | 'mine'>('assignee', 'all');
  const [search, setSearch] = useUrlFilter<string>('search', '', 300);
  const [assignee, setAssignee] = useState('Unassigned');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingIdea, setEditingIdea] = useState<OpsMarketingIdea | null>(null);
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState<OpsMarketingIdea['channel']>('LinkedIn');
  const [scriptContent, setScriptContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [status, setStatus] = useState<OpsMarketingIdea['status']>('Draft');
  const [loading, setLoading] = useState(false);

  // Copy indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Comment Box State
  const [activeCommentIdeaId, setActiveCommentIdeaId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  const { showToast } = useToast();

  function openNewModal() {
    setEditingIdea(null);
    setTitle('');
    setChannel('LinkedIn');
    setScriptContent('');
    setTargetAudience('College Placement Officers & Student Deans');
    setStatus('Draft');
    setAssignee('Unassigned');
    setShowModal(true);
  }

  function openEditModal(idea: OpsMarketingIdea) {
    setEditingIdea(idea);
    setTitle(idea.title);
    setChannel(idea.channel);
    setScriptContent(idea.script_content || '');
    setTargetAudience(idea.target_audience || '');
    setStatus(idea.status);
    setAssignee(idea.assignee || 'Unassigned');
    setShowModal(true);
  }

  async function handleSaveIdea(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !scriptContent.trim()) {
      showToast('Please enter a title and script content.', 'error');
      return;
    }
    setLoading(true);
    try {
      const ideaToSave: OpsMarketingIdea = editingIdea
        ? {
            ...editingIdea,
            title,
            channel,
            script_content: scriptContent,
            target_audience: targetAudience,
            status,
            assignee: assignee || 'Unassigned',
          }
        : {
            id: `mkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title,
            channel,
            script_content: scriptContent,
            target_audience: targetAudience,
            status,
            assignee: assignee || 'Unassigned',
            created_by: userEmail,
            created_at: new Date().toISOString(),
            comments: [],
          };

      const res = await saveMarketingIdeaAction(ideaToSave);
      if (res.success) {
        setIdeas((prev) => {
          const idx = prev.findIndex((i) => i.id === ideaToSave.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = ideaToSave;
            return copy;
          }
          return [ideaToSave, ...prev];
        });
        showToast(editingIdea ? 'Marketing idea updated! ✓' : 'New campaign script published! ✓', 'success');
        setShowModal(false);
      }
    } catch (err) {
      showToast('Error saving idea.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this script/idea?')) return;
    try {
      await deleteMarketingIdeaAction(id);
      setIdeas((prev) => prev.filter((i) => i.id !== id));
      showToast('Script deleted.', 'info');
    } catch (e) {
      showToast('Failed to delete script.', 'error');
    }
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Script copied to clipboard! Ready to paste.', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleAddComment(ideaId: string) {
    if (!newCommentText.trim()) return;
    const target = ideas.find((i) => i.id === ideaId);
    if (!target) return;

    const newComment = {
      id: `c-${Date.now()}`,
      author: userEmail,
      text: newCommentText.trim(),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated: OpsMarketingIdea = {
      ...target,
      comments: [...(target.comments || []), newComment],
    };

    await saveMarketingIdeaAction(updated);
    setIdeas((prev) => prev.map((i) => (i.id === ideaId ? updated : i)));
    setNewCommentText('');
    showToast('Feedback note added to script!', 'success');
  }

  const authorName = (userEmail || '').split('@')[0] || 'Super Admin';
  const memberObj = teamMembers.find(m => m.email.toLowerCase() === (userEmail || '').toLowerCase());
  const isSuperAdmin = memberObj?.role === 'SUPER_ADMIN' || (userEmail || '').toLowerCase().includes('admin') || (userEmail || '').toLowerCase() === 'tanuj@certifyd.in';

  const filteredIdeas = ideas.filter((idea) => {
    const matchesChannel = filterChannel === 'All' || idea.channel === filterChannel;
    const matchesStatus = filterStatus === 'All' || idea.status === filterStatus;
    const isAssignedToMe = Boolean(idea.assignee && (
      idea.assignee.toLowerCase() === userEmail.toLowerCase() ||
      idea.assignee.toLowerCase() === authorName.toLowerCase() ||
      teamMembers.some(m => m.email.toLowerCase() === userEmail.toLowerCase() && (idea.assignee || '').toLowerCase() === m.name.toLowerCase())
    ));
    const creator = idea.created_by || '';
    const isCreatedByMe = creator.toLowerCase() === userEmail.toLowerCase() || creator.toLowerCase().includes(authorName.toLowerCase());

    // Strict assignment privacy: if assigned to a specific employee, ONLY that employee, the creator, or Super Admin can view it
    if (!isSuperAdmin && idea.assignee && idea.assignee !== 'Unassigned' && idea.assignee !== 'Super Admin') {
      if (!isAssignedToMe && !isCreatedByMe) {
        return false;
      }
    }

    const matchesAssignee = filterAssignee === 'all' || isAssignedToMe;
    const matchesSearch =
      !search ||
      idea.title.toLowerCase().includes(search.toLowerCase()) ||
      (idea.script_content || '').toLowerCase().includes(search.toLowerCase()) ||
      idea.target_audience?.toLowerCase().includes(search.toLowerCase()) ||
      idea.assignee?.toLowerCase().includes(search.toLowerCase());
    return matchesChannel && matchesStatus && matchesAssignee && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#161B22] via-[#0F1218] to-[#161B22] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00D4A8]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00D4A8]/15 border border-[#00D4A8]/30 text-[#00D4A8] flex items-center justify-center shrink-0 shadow-lg">
              <Lightbulb className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
                Marketing Hub: Ideas & Scripts
              </h1>
              <p className="text-xs font-mono text-[#00D4A8] tracking-widest uppercase">
                CAMPAIGN CONCEPTS • OUTREACH TEMPLATES • AD SCRIPTS
              </p>
            </div>
          </div>
          <p className="text-sm text-[#8B949E] max-w-2xl leading-relaxed">
            Collaborate on high-conversion ad hooks, video scripts, outreach letters, and pitch deck talking points.
            Accessible securely to team members granted marketing access.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="px-5 py-3 rounded-2xl bg-[#00D4A8] hover:bg-[#00D4A8]/90 text-[#080A0E] font-semibold text-sm flex items-center gap-2.5 shadow-lg shadow-[#00D4A8]/20 transition-all shrink-0 relative z-10"
        >
          <Plus className="w-4 h-4" />
          <span>New Script / Idea</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-[#8B949E] flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5 text-[#00D4A8]" />
            <span>CHANNEL:</span>
          </span>
          {['All', ...CHANNELS].map((ch) => (
            <button
              key={ch}
              onClick={() => setFilterChannel(ch)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterChannel === ch
                  ? 'bg-[#00D4A8]/15 text-[#00D4A8] border border-[#00D4A8]/30 shadow-sm'
                  : 'bg-[#161B22] text-[#8B949E] hover:text-white border border-white/[0.04]'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterAssignee(filterAssignee === 'all' ? 'mine' : 'all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              filterAssignee === 'mine'
                ? 'bg-[#00D4A8] text-[#080A0E] shadow'
                : 'bg-[#161B22] text-[#8B949E] hover:text-white border border-white/10'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>✨ Assigned to Me</span>
          </button>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#161B22] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00D4A8]"
          >
            <option value="All">Status: All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search scripts or target audience..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder:text-[#8B949E] focus:outline-none focus:border-[#00D4A8] w-full md:w-64"
          />
        </div>
      </div>

      {/* Scripts Grid */}
      {filteredIdeas.length === 0 ? (
        <div className="bg-[#0F1218] border border-white/[0.06] rounded-3xl p-12 text-center space-y-4">
          <Sparkles className="w-10 h-10 text-[#8B949E]/40 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">No marketing scripts or ideas found matching your filters.</p>
            <p className="text-xs text-[#8B949E]">Click &ldquo;New Script / Idea&rdquo; above to publish your first campaign concept.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredIdeas.map((idea) => {
            const isCopied = copiedId === idea.id;
            const statusColors: Record<OpsMarketingIdea['status'], string> = {
              Draft: 'bg-[#8B949E]/15 text-[#8B949E] border border-[#8B949E]/30',
              'In Review': 'bg-[#E8C547]/15 text-[#E8C547] border border-[#E8C547]/30',
              Approved: 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30',
              Live: 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30',
            };

            const channelColors: Record<OpsMarketingIdea['channel'], string> = {
              LinkedIn: 'text-[#0A66C2] bg-[#0A66C2]/10 border-[#0A66C2]/20',
              YouTube: 'text-[#FF0000] bg-[#FF0000]/10 border-[#FF0000]/20',
              'Email Outreach': 'text-[#00D4A8] bg-[#00D4A8]/10 border-[#00D4A8]/20',
              Instagram: 'text-[#E4405F] bg-[#E4405F]/10 border-[#E4405F]/20',
              'Sales Pitch': 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20',
            };

            return (
              <div
                key={idea.id}
                className="bg-[#0F1218] border border-white/[0.08] rounded-3xl p-6 flex flex-col justify-between gap-5 hover:border-white/20 transition-all shadow-lg group relative"
              >
                <div className="space-y-4">
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${channelColors[idea.channel]}`}>
                        {idea.channel}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${statusColors[idea.status]}`}>
                        {idea.status}
                      </span>
                      {idea.assignee && idea.assignee !== 'Unassigned' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-[#00D4A8]/15 text-[#00D4A8] px-2 py-0.5 rounded border border-[#00D4A8]/30 font-bold">
                          <User className="w-2.5 h-2.5" /> Assigned: {idea.assignee}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(idea)}
                        className="p-1.5 rounded-lg text-[#8B949E] hover:text-white hover:bg-white/5 transition-colors"
                        title="Edit Idea"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(idea.id)}
                        className="p-1.5 rounded-lg text-[#8B949E] hover:text-[#F85149] hover:bg-[#F85149]/10 transition-colors"
                        title="Delete Idea"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Audience */}
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{idea.title}</h3>
                    {idea.target_audience && (
                      <p className="text-xs text-[#8B949E] mt-1 flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-[#00D4A8]" />
                        <span>Target: <strong className="text-white font-medium">{idea.target_audience}</strong></span>
                      </p>
                    )}
                  </div>

                  {/* Script content box with quick copy */}
                  <div className="relative bg-[#161B22] border border-white/[0.06] rounded-2xl p-4 text-xs font-mono text-[#F0F6FC] leading-relaxed whitespace-pre-wrap group/box">
                    {idea.script_content}
                    <button
                      onClick={() => handleCopy(idea.script_content || '', idea.id)}
                      className={`absolute top-2.5 right-2.5 p-2 rounded-xl border transition-all flex items-center gap-1 text-[10px] font-sans font-semibold ${
                        isCopied
                          ? 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/40 shadow-sm'
                          : 'bg-[#0F1218]/90 text-[#8B949E] hover:text-white border-white/10 hover:bg-[#0F1218] opacity-90 sm:opacity-0 group-hover/box:opacity-100'
                      }`}
                      title="Copy Script to Clipboard"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied!' : 'Copy Script'}</span>
                    </button>
                  </div>
                </div>

                {/* Footer and comments */}
                <div className="border-t border-white/[0.06] pt-4 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8B949E]">
                    <span>By: <span className="text-white">{idea.created_by.split('@')[0]}</span></span>
                    <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Comments loop */}
                  {idea.comments && idea.comments.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {idea.comments.map((c) => (
                        <div key={c.id} className="bg-[#161B22] p-2.5 rounded-xl border border-white/[0.04] text-xs">
                          <div className="flex items-center justify-between text-[10px] font-mono text-[#8B949E] mb-1">
                            <span className="text-[#00D4A8] font-semibold">{c.author.split('@')[0]}</span>
                            <span>{c.date}</span>
                          </div>
                          <p className="text-white leading-relaxed">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment toggle / input */}
                  {activeCommentIdeaId === idea.id ? (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Add note or feedback on this script..."
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(idea.id)}
                        className="flex-1 bg-[#161B22] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-[#8B949E] focus:outline-none focus:border-[#00D4A8]"
                        autoFocus
                      />
                      <button
                        onClick={() => handleAddComment(idea.id)}
                        className="p-1.5 rounded-xl bg-[#00D4A8] text-[#080A0E] hover:bg-[#00D4A8]/90 transition-colors shrink-0"
                        title="Send Note"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setActiveCommentIdeaId(null);
                          setNewCommentText('');
                        }}
                        className="text-[10px] text-[#8B949E] hover:text-white px-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveCommentIdeaId(idea.id)}
                      className="text-xs text-[#8B949E] hover:text-[#00D4A8] flex items-center gap-1.5 transition-colors font-medium"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{idea.comments?.length ? `${idea.comments.length} Notes / Feedback` : 'Add Note / Feedback'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#0F1218] border border-white/[0.08] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-2.5">
                  <Lightbulb className="w-5 h-5 text-[#00D4A8]" />
                  <h3 className="text-lg font-bold text-white">
                    {editingIdea ? 'Edit Marketing Script' : 'Create New Campaign Concept'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-xs text-[#8B949E] hover:text-white font-mono px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={handleSaveIdea} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#8B949E] uppercase tracking-wider mb-1.5">
                    Campaign / Hook Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Q3 ROI Hook for College Deans"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-[#8B949E]/50 focus:outline-none focus:border-[#00D4A8]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#8B949E] uppercase tracking-wider mb-1.5">
                      Marketing Channel *
                    </label>
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value as any)}
                      className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00D4A8]"
                    >
                      {CHANNELS.map((ch) => (
                        <option key={ch} value={ch}>{ch}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#8B949E] uppercase tracking-wider mb-1.5">
                      Status *
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00D4A8]"
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <AssigneeSelector
                    teamMembers={teamMembers}
                    value={assignee}
                    onChange={(val) => setAssignee(val)}
                    label="Campaign Assignee (Triggers Notification)"
                    currentUserEmail={userEmail}
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8B949E] uppercase tracking-wider mb-1.5">
                    Target Audience / Segment
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Tier 1 & 2 Engineering Placement Officers"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-[#8B949E]/50 focus:outline-none focus:border-[#00D4A8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8B949E] uppercase tracking-wider mb-1.5">
                    Script Content / Ad Copy *
                  </label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Write your ad copy, script talking points, or email template here..."
                    value={scriptContent}
                    onChange={(e) => setScriptContent(e.target.value)}
                    className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-[#8B949E]/50 focus:outline-none focus:border-[#00D4A8]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#8B949E] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-[#00D4A8] hover:bg-[#00D4A8]/90 text-[#080A0E] font-semibold text-xs transition-all shadow-lg shadow-[#00D4A8]/20 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingIdea ? 'Update Script' : 'Publish Script'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
