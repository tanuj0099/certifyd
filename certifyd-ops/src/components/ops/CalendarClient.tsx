'use client';

import React, { useState } from 'react';
import { OpsCalendarEvent, saveCalendarEventAction, deleteCalendarEventAction } from '../../actions/opsActions';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import {
  Calendar as CalendarIcon,
  Plus,
  Lock,
  Globe,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
  Filter,
  User,
  X,
  AlertCircle,
  List,
  Grid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarClientProps {
  initialEvents: OpsCalendarEvent[];
  currentUserRole: string;
  currentUserEmail: string;
}

type SectionType = 'all' | 'marketing' | 'technical' | 'database' | 'verifications' | 'content' | 'admin';

export function CalendarClient({ initialEvents, currentUserRole, currentUserEmail }: CalendarClientProps) {
  const [events, setEvents] = useState<OpsCalendarEvent[]>(initialEvents || []);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeSection, setActiveSection] = useState<SectionType>('all');
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'mine' | 'private' | string>('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<OpsCalendarEvent | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00 AM');
  const [section, setSection] = useState<OpsCalendarEvent['section']>('marketing');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { showToast } = useToast();

  const authorName = (currentUserEmail || '').split('@')[0] || 'Super Admin';
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';

  // Filter events based on privacy, section, and ownership
  const visibleEvents = (events || []).filter((ev) => {
    if (!ev) return false;
    const creator = ev.created_by || '';
    const email = currentUserEmail || '';
    const isMine = creator.toLowerCase() === email.toLowerCase() ||
                   creator.toLowerCase().includes(authorName.toLowerCase()) ||
                   isSuperAdmin;
    
    if (ev.is_private && !isMine) {
      return false; // Hidden from standard employees who did not create it
    }

    if (ownershipFilter === 'mine' && !isMine) {
      return false;
    }
    if (ownershipFilter === 'private' && !ev.is_private) {
      return false;
    }
    if (ownershipFilter !== 'all' && ownershipFilter !== 'mine' && ownershipFilter !== 'private') {
      if (ev.created_by !== ownershipFilter) return false;
    }

    // Section check
    if (activeSection !== 'all' && ev.section !== activeSection) {
      return false;
    }

    return true;
  });

  const uniqueAuthors = Array.from(new Set(events.map((ev) => ev.created_by))).filter(Boolean);

  const sections: { id: SectionType; label: string; icon: string }[] = [
    { id: 'all', label: 'All Events', icon: '🌐' },
    { id: 'marketing', label: 'Marketing', icon: '📈' },
    { id: 'technical', label: 'Technical', icon: '⚙️' },
    { id: 'database', label: 'Database', icon: '🗄️' },
    { id: 'verifications', label: 'Verifications', icon: '🛡️' },
    { id: 'content', label: 'Content', icon: '💬' },
    { id: 'admin', label: 'Admin', icon: '👑' },
  ];

  function openCreateModal(selectedDate?: string) {
    setEditingEvent(null);
    setTitle('');
    setDate(selectedDate || new Date().toISOString().split('T')[0]);
    setTime('10:00 AM');
    setSection(activeSection === 'all' ? 'marketing' : activeSection);
    setDescription('');
    setIsPrivate(false);
    setIsModalOpen(true);
  }

  function openEditModal(ev: OpsCalendarEvent) {
    setEditingEvent(ev);
    setTitle(ev.title);
    setDate(ev.date);
    setTime(ev.time || '10:00 AM');
    setSection(ev.section);
    setDescription(ev.description || '');
    setIsPrivate(ev.is_private);
    setIsModalOpen(true);
  }

  async function handleSaveEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;

    const eventData: OpsCalendarEvent = {
      id: editingEvent ? editingEvent.id : `evt-${Date.now()}`,
      title: title.trim(),
      date,
      time,
      section,
      description: description.trim(),
      is_private: isPrivate,
      created_by: editingEvent ? editingEvent.created_by : currentUserEmail,
      created_at: editingEvent ? editingEvent.created_at : new Date().toISOString(),
    };

    setEvents((prev) => {
      const exists = prev.some((ev) => ev.id === eventData.id);
      if (exists) return prev.map((ev) => (ev.id === eventData.id ? eventData : ev));
      return [...prev, eventData];
    });

    setIsModalOpen(false);
    await saveCalendarEventAction(eventData);
    showToast(editingEvent ? 'Updated calendar event!' : 'Added new calendar event!', 'success');
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setEvents((prev) => prev.filter((ev) => ev.id !== deleteId));
    setDeleteId(null);
    await deleteCalendarEventAction(deleteId);
    showToast('Removed calendar event', 'success');
  }

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  // Calculate days in grid
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const gridDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    gridDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    gridDays.push({ dayNum: d, dateStr: dayStr });
  }

  const sectionBadgeColors: Record<OpsCalendarEvent['section'], string> = {
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
            <CalendarIcon className="w-6 h-6 text-[#F97316]" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Team Operations Calendar</h1>
          </div>
          <p className="text-sm text-[#8B949E] mt-1 font-mono">
            Schedule department milestones and deadlines with privacy toggles (Private to you vs. Shared with team).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#161B22] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('month')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'month' ? 'bg-[#F97316] text-[#080A0E] font-bold shadow' : 'text-[#8B949E] hover:text-white'
              }`}
              title="Month Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'agenda' ? 'bg-[#F97316] text-[#080A0E] font-bold shadow' : 'text-[#8B949E] hover:text-white'
              }`}
              title="Upcoming Agenda View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] text-[#080A0E] font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-[#F97316]/15"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Section Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.04] no-scrollbar">
        {sections.map((s) => {
          const count = visibleEvents.filter((ev) => s.id === 'all' || ev.section === s.id).length;
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
            onClick={() => setOwnershipFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              ownershipFilter === 'all'
                ? 'bg-[#F97316] text-[#080A0E] shadow'
                : 'bg-[#0D1117] text-[#8B949E] hover:text-white border border-white/10'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>All Team Events ({events.length})</span>
          </button>
          <button
            onClick={() => setOwnershipFilter('mine')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              ownershipFilter === 'mine'
                ? 'bg-[#F97316] text-[#080A0E] shadow'
                : 'bg-[#0D1117] text-[#8B949E] hover:text-white border border-white/10'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Events</span>
          </button>
          <button
            onClick={() => setOwnershipFilter('private')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              ownershipFilter === 'private'
                ? 'bg-[#E8C547] text-[#080A0E] shadow'
                : 'bg-[#0D1117] text-[#8B949E] hover:text-white border border-white/10'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Private Events</span>
          </button>
        </div>

        {/* Unique Team Members Dropdown */}
        {uniqueAuthors.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#8B949E]">Filter Member:</span>
            <select
              value={ownershipFilter}
              onChange={(e) => setOwnershipFilter(e.target.value)}
              className="bg-[#0D1117] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#F97316]"
            >
              <option value="all">Everyone ({uniqueAuthors.length})</option>
              {uniqueAuthors.map((author) => (
                <option key={author} value={author}>{author}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* MONTH GRID VIEW */}
      {viewMode === 'month' ? (
        <div className="bg-[#0D1117] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
          {/* Month Bar */}
          <div className="flex items-center justify-between p-5 border-b border-white/[0.08] bg-[#161B22]/60">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                {monthNames[month]} {year}
              </h2>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-mono text-white transition-colors"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-1 bg-[#0D1117] p-1 rounded-xl border border-white/10">
              <button onClick={prevMonth} className="p-1.5 text-[#8B949E] hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-1.5 text-[#8B949E] hover:text-white transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-white/[0.08] bg-[#161B22]/30 text-center font-mono text-xs uppercase text-[#8B949E] py-3">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-white/[0.04] bg-[#0D1117] min-h-[580px]">
            {gridDays.map((cell, index) => {
              if (!cell) {
                return <div key={`empty-${index}`} className="bg-[#161B22]/20 min-h-[110px]" />;
              }

              const isToday = cell.dateStr === todayStr;
              const dayEvents = visibleEvents.filter((ev) => ev.date === cell.dateStr);

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => openCreateModal(cell.dateStr)}
                  className={`p-2 min-h-[110px] transition-colors cursor-pointer group relative flex flex-col justify-between ${
                    isToday ? 'bg-[#F97316]/[0.04] ring-1 ring-inset ring-[#F97316]/30' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold font-mono w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday ? 'bg-[#F97316] text-[#080A0E]' : 'text-white/80 group-hover:text-white'
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    <Plus className="w-3.5 h-3.5 text-[#8B949E] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Day Events List */}
                  <div className="mt-1.5 space-y-1 overflow-y-auto max-h-[85px] no-scrollbar">
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(ev);
                        }}
                        className={`p-1.5 rounded-lg text-left text-[11px] font-medium truncate transition-all flex items-center justify-between gap-1 border ${
                          sectionBadgeColors[ev.section]
                        } ${ev.is_private ? 'border-dashed' : ''}`}
                      >
                        <div className="flex items-center gap-1 min-w-0 truncate">
                          {ev.is_private ? <Lock className="w-3 h-3 shrink-0 text-[#E8C547]" /> : <Globe className="w-3 h-3 shrink-0 opacity-70" />}
                          <span className="truncate">{ev.title}</span>
                        </div>
                        {ev.time && <span className="text-[9px] opacity-75 shrink-0 font-mono">{ev.time.split(' ')[0]}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* AGENDA LIST VIEW */
        <div className="bg-[#0D1117] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 pb-3 border-b border-white/[0.06]">
            <List className="w-5 h-5 text-[#F97316]" />
            <span>Upcoming Agenda ({visibleEvents.length})</span>
          </h3>

          {visibleEvents.length === 0 ? (
            <p className="text-sm text-[#8B949E] font-mono text-center py-12">No events scheduled for the selected criteria.</p>
          ) : (
            <div className="space-y-3">
              {visibleEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => openEditModal(ev)}
                  className="bg-[#161B22] border border-white/[0.06] hover:border-[#F97316]/40 rounded-xl p-4 transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="bg-[#0D1117] px-3 py-2 rounded-xl border border-white/10 text-center shrink-0">
                      <div className="text-[10px] font-mono text-[#8B949E] uppercase">{new Date(ev.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                      <div className="text-lg font-bold text-white font-mono">{new Date(ev.date).getDate()}</div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${sectionBadgeColors[ev.section]}`}>
                          {ev.section}
                        </span>
                        {ev.is_private ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-[#E8C547]/15 text-[#E8C547] px-2 py-0.5 rounded border border-[#E8C547]/30">
                            <Lock className="w-2.5 h-2.5" /> Private to You
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-white/10 text-[#8B949E] px-2 py-0.5 rounded">
                            <Globe className="w-2.5 h-2.5" /> Shared with Team
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-base text-white mt-1 hover:text-[#F97316] transition-colors">{ev.title}</h4>
                      {ev.description && <p className="text-xs text-[#8B949E] mt-0.5 line-clamp-1">{ev.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div className="text-xs font-mono text-[#8B949E]">
                      <div className="flex items-center justify-end gap-1 text-white">
                        <Clock className="w-3.5 h-3.5 text-[#F97316]" />
                        <span>{ev.time || 'All Day'}</span>
                      </div>
                      <div className="text-[10px] mt-0.5">By: {ev.created_by}</div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(ev.id);
                      }}
                      className="p-2 rounded-lg bg-white/[0.04] hover:bg-[#F85149]/20 text-[#8B949E] hover:text-[#F85149] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT EVENT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0D1117] border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-[#F97316]" />
                  <span>{editingEvent ? 'Edit Calendar Event' : 'Schedule New Event'}</span>
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-[#8B949E] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#8B949E] uppercase mb-1">Event Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Staging Database Push Sync"
                    className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#8B949E] uppercase mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#8B949E] uppercase mb-1">Time</label>
                    <input
                      type="text"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      placeholder="e.g. 02:00 PM"
                      className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                </div>

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

                <div>
                  <label className="block text-xs font-mono text-[#8B949E] uppercase mb-1">Description / Agenda Notes</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details for attendees..."
                    className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316]"
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
                        {isPrivate ? '🔒 Private Event (Only You)' : '🌐 Shared Event (Entire Team)'}
                      </div>
                      <div className="text-xs text-[#8B949E] font-mono">
                        {isPrivate
                          ? 'Only you can view this item on the ops calendar.'
                          : 'Visible to all team members with department access.'}
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
                  {editingEvent ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteId(editingEvent.id);
                        setIsModalOpen(false);
                      }}
                      className="text-xs text-[#F85149] hover:underline font-mono flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
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
                      {editingEvent ? 'Save Changes' : 'Schedule Event'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Remove Calendar Event?"
        impact="Are you sure you want to delete this event from the schedule?"
        confirmWord="REMOVE"
      />
    </div>
  );
}
