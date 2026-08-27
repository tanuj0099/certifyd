'use client';

import React, { useState } from 'react';
import { useUrlFilter } from '@/hooks/useUrlFilter';
import { OpsNoteThread, OpsTeamMember, saveOpsNoteAction, deleteOpsNoteAction, addNoteCommentAction, getOpsNotesAction } from '../../actions/opsActions';
import { AssigneeSelector } from './AssigneeSelector';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import {
  FileText,
  Plus,
  Lock,
  Globe,
  Pin,
  MessageSquare,
  Trash2,
  Send,
  User,
  Search,
  X,
  Check,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotesClientProps {
  initialNotes: OpsNoteThread[];
  currentUserRole: string;
  currentUserEmail: string;
  teamMembers?: OpsTeamMember[];
}

type SectionType = 'all' | 'marketing' | 'technical' | 'database' | 'verifications' | 'content' | 'admin';

export function NotesClient({ initialNotes, currentUserRole, currentUserEmail, teamMembers = [] }: NotesClientProps) {
  const [notes, setNotes] = useState<OpsNoteThread[]>(initialNotes || []);
  const [activeSection, setActiveSection] = useState<SectionType>('all');
  const [privacyFilter, setPrivacyFilter] = useUrlFilter<'all' | 'mine' | 'private' | 'assigned'>('privacy', 'all');
  const [searchQuery, setSearchQuery] = useUrlFilter<string>('search', '', 300);
  const [assignee, setAssignee] = useState('Unassigned');

  React.useEffect(() => {
    if (initialNotes) setNotes(initialNotes);
  }, [initialNotes]);

  React.useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const liveNotes = await getOpsNotesAction();
        if (isMounted && liveNotes) {
          setNotes(liveNotes);
        }
      } catch (e) {}
    }, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Modal for new/edit note
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<OpsNoteThread | null>(null);

  // Inspector modal for thread discussion
  const [activeNote, setActiveNote] = useState<OpsNoteThread | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [section, setSection] = useState<OpsNoteThread['section']>('marketing');
  const [isPrivate, setIsPrivate] = useState(false);
  const [pinned, setPinned] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { showToast } = useToast();

  const authorName = (currentUserEmail || '').split('@')[0] || 'Super Admin';
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';

  // Filter notes based on privacy and department section
  const visibleNotes = (notes || []).filter((n) => {
    if (!n) return false;
    const creator = n.created_by || '';
    const email = currentUserEmail || '';
    // Privacy check
    const isMine = creator.toLowerCase() === email.toLowerCase() ||
                   creator.toLowerCase().includes(authorName.toLowerCase()) ||
                   (isSuperAdmin && (creator.includes('Admin') || creator.includes('admin')));
    const isAssignedToMe = Boolean(n.assignee && (
      n.assignee.toLowerCase() === currentUserEmail.toLowerCase() ||
      n.assignee.toLowerCase() === authorName.toLowerCase() ||
      teamMembers.some(m => m.email.toLowerCase() === currentUserEmail.toLowerCase() && (n.assignee || '').toLowerCase() === m.name.toLowerCase())
    ));
    
    if (n.is_private && !isMine) {
      return false;
    }

    // Strict assignment privacy: if assigned to a specific employee, ONLY that employee, the creator, or Super Admin can view it
    if (!isSuperAdmin && n.assignee && n.assignee !== 'Unassigned' && n.assignee !== 'Super Admin') {
      if (!isAssignedToMe && !isMine) {
        return false;
      }
    }

    if (privacyFilter === 'mine' && !isMine) {
      return false;
    }
    if (privacyFilter === 'private' && (!n.is_private || !isMine)) {
      return false;
    }
    if (privacyFilter === 'assigned') {
      if (!n.assignee || n.assignee === 'Unassigned') return false;
      if (!isAssignedToMe) return false;
    }

    // Section check
    if (activeSection !== 'all' && n.section !== activeSection) {
      return false;
    }

    // Search check
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q) || creator.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Sort pinned notes first, then newest
  const sortedNotes = [...visibleNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const sections: { id: SectionType; label: string; icon: string }[] = [
    { id: 'all', label: 'All Notes', icon: '🌐' },
    { id: 'marketing', label: 'Marketing', icon: '📈' },
    { id: 'technical', label: 'Technical', icon: '⚙️' },
    { id: 'database', label: 'Database', icon: '🗄️' },
    { id: 'verifications', label: 'Verifications', icon: '🛡️' },
    { id: 'content', label: 'Content', icon: '💬' },
    { id: 'admin', label: 'Admin', icon: '👑' },
  ];

  function openCreateModal() {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setSection(activeSection === 'all' ? 'marketing' : activeSection);
    setIsPrivate(false);
    setPinned(false);
    setAssignee('Unassigned');
    setIsModalOpen(true);
  }

  function openEditModal(n: OpsNoteThread) {
    setEditingNote(n);
    setTitle(n.title);
    setContent(n.content);
    setSection(n.section);
    setIsPrivate(n.is_private);
    setPinned(n.pinned);
    setAssignee(n.assignee || 'Unassigned');
    setIsModalOpen(true);
  }

  async function handleSaveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const noteData: OpsNoteThread = {
      id: editingNote ? editingNote.id : `note-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      section,
      is_private: isPrivate,
      pinned,
      assignee: assignee || 'Unassigned',
      comments: editingNote ? editingNote.comments : [],
      created_by: editingNote ? editingNote.created_by : currentUserEmail,
      created_at: editingNote ? editingNote.created_at : new Date().toISOString(),
    };

    setNotes((prev) => {
      const exists = prev.some((n) => n.id === noteData.id);
      if (exists) return prev.map((n) => (n.id === noteData.id ? noteData : n));
      return [noteData, ...prev];
    });

    if (activeNote && activeNote.id === noteData.id) {
      setActiveNote(noteData);
    }

    setIsModalOpen(false);
    await saveOpsNoteAction(noteData);
    const latest = await getOpsNotesAction();
    if (latest) setNotes(latest);
    showToast(editingNote ? 'Updated department note!' : 'Created new department note!', 'success');
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!activeNote || !newCommentText.trim()) return;

    const comment = {
      id: `com-${Date.now()}`,
      author: currentUserEmail.split('@')[0],
      text: newCommentText.trim(),
      date: 'Just now',
    };

    const updatedComments = [...(activeNote.comments || []), comment];
    const updatedNote = { ...activeNote, comments: updatedComments };

    setNotes((prev) => prev.map((n) => (n.id === activeNote.id ? updatedNote : n)));
    setActiveNote(updatedNote);
    setNewCommentText('');

    await addNoteCommentAction(activeNote.id, comment.author, comment.text);
    const latest = await getOpsNotesAction();
    if (latest) setNotes(latest);
    showToast('Added comment to note thread', 'success');
  }

  async function handleTogglePin(note: OpsNoteThread, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = { ...note, pinned: !note.pinned };
    setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
    if (activeNote && activeNote.id === note.id) setActiveNote(updated);
    await saveOpsNoteAction(updated);
    const latest = await getOpsNotesAction();
    if (latest) setNotes(latest);
    showToast(updated.pinned ? 'Pinned note to top!' : 'Unpinned note', 'success');
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setNotes((prev) => prev.filter((n) => n.id !== deleteId));
    if (activeNote && activeNote.id === deleteId) setActiveNote(null);
    setDeleteId(null);
    await deleteOpsNoteAction(deleteId);
    const latest = await getOpsNotesAction();
    if (latest) setNotes(latest);
    showToast('Deleted note thread', 'success');
  }

  const sectionBadgeColors: Record<OpsNoteThread['section'], string> = {
    marketing: 'bg-[#F97316]/15 text-[#F97316] border-[#F97316]/30',
    technical: 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30',
    database: 'bg-[#A855F7]/15 text-[#A855F7] border-[#A855F7]/30',
    verifications: 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30',
    content: 'bg-[#EC4899]/15 text-[#EC4899] border-[#EC4899]/30',
    admin: 'bg-[#E8C547]/15 text-[#E8C547] border-[#E8C547]/30',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#F97316]" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Department Notes & Collaborative Comments</h1>
          </div>
          <p className="text-sm text-[#8B949E] mt-1 font-mono">
            Create SOPs, strategy documents, and confidential founder notes with team discussion threads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="bg-[#161B22] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-[#8B949E] focus:outline-none focus:border-[#F97316] w-64"
            />
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] text-[#080A0E] font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-[#F97316]/15"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Note Thread</span>
          </button>
        </div>
      </div>

      {/* Section Department Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.04] no-scrollbar">
        {sections.map((s) => {
          const count = notes.filter((n) => {
            const isMine = n.created_by.toLowerCase() === currentUserEmail.toLowerCase() ||
                           n.created_by.toLowerCase().includes(authorName.toLowerCase()) ||
                           (isSuperAdmin && n.created_by.includes('Admin'));
            if (n.is_private && !isMine) return false;
            return s.id === 'all' || n.section === s.id;
          }).length;
          const isActive = activeSection === s.id;

          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30 font-bold'
                  : 'bg-[#161B22]/60 text-[#8B949E] hover:bg-[#161B22] hover:text-white border border-transparent'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                isActive ? 'bg-[#F97316] text-[#080A0E] font-bold' : 'bg-white/10 text-[#8B949E]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Team Visibility & Ownership Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161B22]/60 p-3.5 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setPrivacyFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              privacyFilter === 'all'
                ? 'bg-[#F97316] text-[#080A0E] shadow'
                : 'bg-[#0D1117] text-[#8B949E] hover:text-white border border-white/10'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>All Notes</span>
          </button>
          <button
            onClick={() => setPrivacyFilter('mine')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              privacyFilter === 'mine'
                ? 'bg-[#F97316] text-[#080A0E] shadow'
                : 'bg-[#0D1117] text-[#8B949E] hover:text-white border border-white/10'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Notes</span>
          </button>
          <button
            onClick={() => setPrivacyFilter('private')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              privacyFilter === 'private'
                ? 'bg-[#E8C547] text-[#080A0E] shadow'
                : 'bg-[#0D1117] text-[#8B949E] hover:text-white border border-white/10'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Personal Note Only</span>
          </button>
          <button
            onClick={() => setPrivacyFilter('assigned')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              privacyFilter === 'assigned'
                ? 'bg-[#00D4A8] text-[#080A0E] shadow'
                : 'bg-[#0D1117] text-[#8B949E] hover:text-white border border-white/10'
            }`}
          >
            <User className="w-3.5 h-3.5 text-[#00D4A8]" />
            <span>✨ Assigned to Me</span>
          </button>
        </div>
      </div>

      {/* Notes Grid Display */}
      {sortedNotes.length === 0 ? (
        <div className="bg-[#0D1117] border border-dashed border-white/10 rounded-2xl p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-[#8B949E] mx-auto opacity-50" />
          <h3 className="text-base font-bold text-white">No Notes Found</h3>
          <p className="text-xs text-[#8B949E] font-mono max-w-md mx-auto">
            No notes match your current department filter or search term. Create a new note thread above!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {sortedNotes.map((note) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setActiveNote(note)}
                className={`bg-[#0D1117] border rounded-2xl p-5 transition-all cursor-pointer relative flex flex-col justify-between group ${
                  note.pinned
                    ? 'border-[#F97316]/40 shadow-lg shadow-[#F97316]/5 bg-gradient-to-b from-[#F97316]/[0.03] to-transparent'
                    : 'border-white/[0.08] hover:border-white/[0.18]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${sectionBadgeColors[note.section]}`}>
                        {note.section}
                      </span>
                      {note.assignee && note.assignee !== 'Unassigned' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-[#00D4A8]/15 text-[#00D4A8] px-2 py-0.5 rounded border border-[#00D4A8]/30">
                          <User className="w-2.5 h-2.5" /> Assigned: {note.assignee}
                        </span>
                      )}
                      {note.is_private ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-[#E8C547]/15 text-[#E8C547] px-2 py-0.5 rounded border border-[#E8C547]/30">
                          <Lock className="w-2.5 h-2.5" /> Private
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-white/10 text-[#8B949E] px-2 py-0.5 rounded">
                          <Globe className="w-2.5 h-2.5" /> Shared
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => handleTogglePin(note, e)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        note.pinned ? 'text-[#F97316] bg-[#F97316]/10' : 'text-[#8B949E] hover:text-white opacity-50 group-hover:opacity-100'
                      }`}
                      title={note.pinned ? 'Unpin Note' : 'Pin Note to Top'}
                    >
                      <Pin className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  <h3 className="font-bold text-base text-white group-hover:text-[#F97316] transition-colors leading-snug">
                    {note.title}
                  </h3>

                  <p className="text-xs text-[#8B949E] mt-2.5 line-clamp-4 font-sans leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#8B949E]">
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <User className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
                    <span className="truncate text-[11px] font-mono text-white/80">{note.created_by}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#E8C547] bg-[#E8C547]/10 px-2 py-0.5 rounded-md border border-[#E8C547]/20">
                      <MessageSquare className="w-3 h-3" />
                      {note.comments?.length || 0}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#8B949E] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* CREATE / EDIT NOTE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0D1117] border border-white/10 rounded-2xl p-6 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#F97316]" />
                  <span>{editingNote ? 'Edit Department Note' : 'Create New Note Thread'}</span>
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-[#8B949E] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#8B949E] uppercase mb-1">Note Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Standard Operating Procedure: Offer Letter Verification"
                    className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#8B949E] uppercase mb-1">Department Section</label>
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value as any)}
                      className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316]"
                    >
                      {sections.filter((s) => s.id !== 'all').map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-white select-none">
                      <input
                        type="checkbox"
                        checked={pinned}
                        onChange={(e) => setPinned(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-[#161B22] text-[#F97316] focus:ring-0"
                      />
                      <span className="flex items-center gap-1 font-semibold text-xs font-mono text-[#F97316]">
                        <Pin className="w-3.5 h-3.5 fill-current" /> Pin to Top
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <AssigneeSelector
                    teamMembers={teamMembers}
                    value={assignee}
                    onChange={(val) => setAssignee(val)}
                    label="Action Item Assignee (Triggers Employee Notification)"
                    currentUserEmail={currentUserEmail}
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8B949E] uppercase mb-1">Content / Document Body</label>
                  <textarea
                    rows={8}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write detailed guidelines, notes, or strategy bullet points here..."
                    className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316] font-sans leading-relaxed"
                  />
                </div>

                {/* Privacy Toggle Switch */}
                <div className="bg-[#161B22] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isPrivate ? 'bg-[#E8C547]/20 text-[#E8C547]' : 'bg-white/10 text-white'}`}>
                      {isPrivate ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        {isPrivate ? '🔒 Private Note (Only You)' : '🌐 Shared Note (Entire Team)'}
                      </div>
                      <div className="text-xs text-[#8B949E] font-mono">
                        {isPrivate
                          ? 'Confidential item visible strictly to your account.'
                          : 'Collaborative note visible to team members with department access.'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                      isPrivate ? 'bg-[#E8C547]' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-[#080A0E] transition-transform ${
                        isPrivate ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-white/10">
                  {editingNote ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteId(editingNote.id);
                        setIsModalOpen(false);
                      }}
                      className="text-xs text-[#F85149] hover:underline font-mono flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Note</span>
                    </button>
                  ) : <div />}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-sm font-semibold text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#F97316]/90 text-[#080A0E] font-bold text-sm transition-all shadow-lg shadow-[#F97316]/20"
                    >
                      {editingNote ? 'Save Changes' : 'Post Note Thread'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INSPECTOR / THREAD DISCUSSION MODAL */}
      <AnimatePresence>
        {activeNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0D1117] border border-white/15 rounded-2xl p-6 max-w-3xl w-full shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-white/10 gap-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${sectionBadgeColors[activeNote.section]}`}>
                      {activeNote.section}
                    </span>
                    {activeNote.is_private ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-[#E8C547]/15 text-[#E8C547] px-2 py-0.5 rounded border border-[#E8C547]/30">
                        <Lock className="w-2.5 h-2.5" /> Private Note
                <div className="w-full">
                  <div className="flex justify-between items-start w-full mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${sectionBadgeColors[activeNote.section]}`}>
                        {activeNote.section}
                      </span>
                      {activeNote.is_private ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-[#E8C547]/15 text-[#E8C547] px-2 py-0.5 rounded border border-[#E8C547]/30">
                          <Lock className="w-2.5 h-2.5" /> Private Note
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-white/10 text-[#8B949E] px-2 py-0.5 rounded">
                          <Globe className="w-2.5 h-2.5" /> Shared Note
                        </span>
                      )}
                      {activeNote.pinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-[#F97316]/15 text-[#F97316] px-2 py-0.5 rounded border border-[#F97316]/30 font-bold">
                          <Pin className="w-2.5 h-2.5 fill-current" /> Pinned
                        </span>
                      )}
                      {activeNote.assignee && activeNote.assignee !== 'Unassigned' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-[#00D4A8]/15 text-[#00D4A8] px-2 py-0.5 rounded border border-[#00D4A8]/30 font-bold">
                          <User className="w-2.5 h-2.5" /> Assigned: {activeNote.assignee}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                       <button onClick={() => {
                         openEditModal(activeNote);
                         setActiveNote(null);
                       }} className="px-3 py-1.5 bg-[#F97316] text-[#080A0E] text-xs font-bold rounded-lg hover:bg-[#F97316]/90 transition-colors flex items-center gap-1.5">
                          Edit
                       </button>
                       <button onClick={() => setActiveNote(null)} className="text-[#8B949E] hover:text-white p-1">
                          <X className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-bold text-white leading-snug">
                    {activeNote.title}
                  </h2>
                  <p className="text-xs text-[#8B949E] font-mono mt-1">
                    Created by <span className="text-white font-semibold">{activeNote.created_by}</span> • {new Date(activeNote.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Modal Body */}
              <div className="py-4 space-y-6 overflow-y-auto flex-1 pr-1">
                {/* Note Document Body */}
                <div className="w-full bg-[#161B22] p-5 rounded-2xl border border-white/5 text-sm text-white/95 leading-relaxed font-sans whitespace-pre-wrap">
                  {activeNote.content || <span className="italic text-white/40">No content provided.</span>}
                </div>

                {/* Collaborative Comment Thread */}
                <div className="pt-2 border-t border-white/10">
                  <h4 className="text-xs font-mono text-[#8B949E] uppercase mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#E8C547]" />
                      <span>Discussion Thread ({activeNote.comments?.length || 0})</span>
                    </span>
                    <span className="text-[10px] text-[#8B949E]">Real-time collaborative comments</span>
                  </h4>

                  <div className="space-y-3 max-h-52 overflow-y-auto mb-4 pr-1">
                    {(!activeNote.comments || activeNote.comments.length === 0) ? (
                      <p className="text-xs text-[#8B949E] italic font-mono text-center py-6 bg-[#161B22]/40 rounded-xl border border-white/5">
                        No replies or comments on this note thread yet. Start the conversation below!
                      </p>
                    ) : (
                      activeNote.comments.map((comm, idx) => (
                        <div key={idx} className="bg-[#161B22] p-3.5 rounded-xl border border-white/5 space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="font-bold text-[#F97316]">👤 {comm.author}</span>
                            <span className="text-[#8B949E] text-[11px]">{comm.date}</span>
                          </div>
                          <p className="text-sm text-white/90 font-sans">{comm.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Reply to this department note thread..."
                      className="flex-1 bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#8B949E] focus:outline-none focus:border-[#F97316]"
                    />
                    <button
                      type="submit"
                      disabled={!newCommentText.trim()}
                      className="px-5 py-2.5 rounded-xl bg-[#E8C547] hover:bg-[#E8C547]/90 disabled:opacity-50 text-[#080A0E] font-bold text-sm transition-all flex items-center gap-1.5 shrink-0 shadow-lg shadow-[#E8C547]/15"
                    >
                      <Send className="w-4 h-4" />
                      <span>Reply</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between shrink-0">
                <button
                  onClick={() => setDeleteId(activeNote.id)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#F85149] hover:underline font-mono"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Thread</span>
                </button>
                <button
                  onClick={() => setActiveNote(null)}
                  className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#F97316]/90 text-[#080A0E] font-bold text-sm transition-all"
                >
                  Close Thread
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Department Note?"
        impact="Are you sure you want to remove this note thread? All attached discussion comments will be deleted permanently."
        confirmWord="DELETE"
      />
    </div>
  );
}
