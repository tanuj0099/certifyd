'use client';

import React, { useState, useEffect } from 'react';
import { useUrlFilter } from '@/hooks/useUrlFilter';
import Link from 'next/link';
import {
  OpsTaskItem,
  OpsCalendarEvent,
  OpsNoteThread,
  OpsMarketingIdea,
  OpsTeamMember,
  saveOpsTaskAction,
  saveCalendarEventAction,
  saveOpsNoteAction,
  saveMarketingIdeaAction,
  getOpsTasksAction,
  getCalendarEventsAction,
  getOpsNotesAction,
  getMarketingIdeasAction,
} from '../../actions/opsActions';
import { AssigneeSelector } from './AssigneeSelector';
import { useToast } from '../ui/Toast';
import {
  CheckSquare,
  Calendar as CalendarIcon,
  FileText,
  Lightbulb,
  Clock,
  User,
  Filter,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MyWorkClientProps {
  initialTasks: OpsTaskItem[];
  initialEvents: OpsCalendarEvent[];
  initialNotes: OpsNoteThread[];
  initialMarketingIdeas: OpsMarketingIdea[];
  teamMembers: OpsTeamMember[];
  currentUserRole: string;
  currentUserEmail: string;
}

type ModuleFilter = 'all' | 'tasks' | 'calendar' | 'notes' | 'marketing';

export function MyWorkClient({
  initialTasks,
  initialEvents,
  initialNotes,
  initialMarketingIdeas,
  teamMembers,
  currentUserRole,
  currentUserEmail,
}: MyWorkClientProps) {
  const [tasks, setTasks] = useState<OpsTaskItem[]>(initialTasks || []);
  const [events, setEvents] = useState<OpsCalendarEvent[]>(initialEvents || []);
  const [notes, setNotes] = useState<OpsNoteThread[]>(initialNotes || []);
  const [marketingIdeas, setMarketingIdeas] = useState<OpsMarketingIdea[]>(initialMarketingIdeas || []);

  const [activeTab, setActiveTab] = useUrlFilter<ModuleFilter>('tab', 'all');
  const [searchQuery, setSearchQuery] = useUrlFilter<string>('search', '', 300);
  const [selectedMemberEmail, setSelectedMemberEmail] = useState<string>(currentUserEmail);

  const { showToast } = useToast();

  // Live polling sync every 4 seconds
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const [liveTasks, liveEvents, liveNotes, liveMarketing] = await Promise.all([
          getOpsTasksAction(),
          getCalendarEventsAction(),
          getOpsNotesAction(),
          getMarketingIdeasAction(),
        ]);
        if (isMounted) {
          if (liveTasks) setTasks(liveTasks);
          if (liveEvents) setEvents(liveEvents);
          if (liveNotes) setNotes(liveNotes);
          if (liveMarketing) setMarketingIdeas(liveMarketing);
        }
      } catch (e) {}
    }, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Determine matching assignee string logic
  function matchesAssignee(assigneeStr?: string): boolean {
    if (!assigneeStr || assigneeStr === 'Unassigned') return false;
    const cleanAssignee = assigneeStr.trim().toLowerCase();
    const cleanSelectedEmail = selectedMemberEmail.trim().toLowerCase();
    const usernamePart = cleanSelectedEmail.split('@')[0] || '';

    // Direct match with email or username part
    if (cleanAssignee === cleanSelectedEmail || cleanAssignee === usernamePart) {
      return true;
    }

    // Match with team member name
    const memberObj = teamMembers.find((m) => m.email.toLowerCase() === cleanSelectedEmail);
    if (memberObj && cleanAssignee === memberObj.name.toLowerCase()) {
      return true;
    }

    return false;
  }

  // Filter items assigned to the selected person (strictly restricted for standard employees)
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';
  const effectiveMemberEmail = isSuperAdmin ? selectedMemberEmail : currentUserEmail;

  const myTasks = tasks.filter((t) => {
    if (!matchesAssignee(t.assignee)) return false;
    if (!isSuperAdmin) {
      const authorName = (currentUserEmail || '').split('@')[0];
      const isAssignedToMe = Boolean(t.assignee && (
        t.assignee.toLowerCase() === currentUserEmail.toLowerCase() ||
        t.assignee.toLowerCase() === authorName.toLowerCase() ||
        teamMembers.some(m => m.email.toLowerCase() === currentUserEmail.toLowerCase() && (t.assignee || '').toLowerCase() === m.name.toLowerCase())
      ));
      const isCreatedByMe = (t.created_by || '').toLowerCase() === currentUserEmail.toLowerCase();
      if (!isAssignedToMe && !isCreatedByMe) return false;
    }
    return true;
  });
  const myEvents = events.filter((e) => {
    if (!matchesAssignee(e.assignee)) return false;
    if (!isSuperAdmin) {
      const authorName = (currentUserEmail || '').split('@')[0];
      const isAssignedToMe = Boolean(e.assignee && (
        e.assignee.toLowerCase() === currentUserEmail.toLowerCase() ||
        e.assignee.toLowerCase() === authorName.toLowerCase() ||
        teamMembers.some(m => m.email.toLowerCase() === currentUserEmail.toLowerCase() && (e.assignee || '').toLowerCase() === m.name.toLowerCase())
      ));
      const isCreatedByMe = (e.created_by || '').toLowerCase() === currentUserEmail.toLowerCase();
      if (!isAssignedToMe && !isCreatedByMe) return false;
    }
    return true;
  });
  const myNotes = notes.filter((n) => {
    if (!matchesAssignee(n.assignee)) return false;
    if (!isSuperAdmin) {
      const authorName = (currentUserEmail || '').split('@')[0];
      const isAssignedToMe = Boolean(n.assignee && (
        n.assignee.toLowerCase() === currentUserEmail.toLowerCase() ||
        n.assignee.toLowerCase() === authorName.toLowerCase() ||
        teamMembers.some(m => m.email.toLowerCase() === currentUserEmail.toLowerCase() && (n.assignee || '').toLowerCase() === m.name.toLowerCase())
      ));
      const isCreatedByMe = (n.created_by || '').toLowerCase() === currentUserEmail.toLowerCase();
      if (!isAssignedToMe && !isCreatedByMe) return false;
    }
    return true;
  });
  const myMarketing = marketingIdeas.filter((m) => {
    if (!matchesAssignee(m.assignee)) return false;
    if (!isSuperAdmin) {
      const authorName = (currentUserEmail || '').split('@')[0];
      const isAssignedToMe = Boolean(m.assignee && (
        m.assignee.toLowerCase() === currentUserEmail.toLowerCase() ||
        m.assignee.toLowerCase() === authorName.toLowerCase() ||
        teamMembers.some(mObj => mObj.email.toLowerCase() === currentUserEmail.toLowerCase() && (m.assignee || '').toLowerCase() === mObj.name.toLowerCase())
      ));
      const isCreatedByMe = (m.created_by || '').toLowerCase() === currentUserEmail.toLowerCase();
      if (!isAssignedToMe && !isCreatedByMe) return false;
    }
    return true;
  });

  // Search filter
  const filterSearch = (title: string, desc?: string) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (title || '').toLowerCase().includes(q) || (desc || '').toLowerCase().includes(q);
  };

  const filteredTasks = myTasks.filter((t) => filterSearch(t.title, t.description));
  const filteredEvents = myEvents.filter((e) => filterSearch(e.title, e.description));
  const filteredNotes = myNotes.filter((n) => filterSearch(n.title, n.content));
  const filteredMarketing = myMarketing.filter((m) => filterSearch(m.title, m.script_content));

  const totalAssignedCount = myTasks.length + myEvents.length + myNotes.length + myMarketing.length;

  // Quick Task Status update directly from personal work hub
  async function handleUpdateTaskStatus(task: OpsTaskItem, newStatus: OpsTaskItem['status']) {
    const updated = { ...task, status: newStatus };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    await saveOpsTaskAction(updated);
    showToast(`Task moved to ${newStatus}`, 'success');
  }

  // Quick reassign from card
  async function handleReassignItem(type: 'task' | 'event' | 'note' | 'marketing', item: any, newAssignee: string) {
    const updated = { ...item, assignee: newAssignee };
    if (type === 'task') {
      setTasks((prev) => prev.map((t) => (t.id === item.id ? updated : t)));
      await saveOpsTaskAction(updated);
    } else if (type === 'event') {
      setEvents((prev) => prev.map((e) => (e.id === item.id ? updated : e)));
      await saveCalendarEventAction(updated);
    } else if (type === 'note') {
      setNotes((prev) => prev.map((n) => (n.id === item.id ? updated : n)));
      await saveOpsNoteAction(updated);
    } else if (type === 'marketing') {
      setMarketingIdeas((prev) => prev.map((m) => (m.id === item.id ? updated : m)));
      await saveMarketingIdeaAction(updated);
    }
    showToast(`Item reassigned to ${newAssignee}`, 'success');
  }

  // Get current member info for display
  const activeMember = teamMembers.find((m) => m.email.toLowerCase() === selectedMemberEmail.toLowerCase());
  const displayMemberName = activeMember ? activeMember.name : selectedMemberEmail.split('@')[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#161B22] via-[#0F1218] to-[#161B22] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D4A8]/10 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00D4A8] to-[#009E7E] text-[#080A0E] flex items-center justify-center font-bold shadow-lg shadow-[#00D4A8]/20">
              <Briefcase className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <span>Personal Assigned Work Hub</span>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[#00D4A8]/15 text-[#00D4A8] border border-[#00D4A8]/30 font-bold">
                  {totalAssignedCount} Active Items
                </span>
              </h1>
              <p className="text-xs font-mono text-[#8B949E] uppercase tracking-wider mt-0.5">
                Unified Connected Dashboard across Tasks, Calendar, Notes & Marketing
              </p>
            </div>
          </div>
          <p className="text-sm text-[#8B949E] leading-relaxed pt-1">
            All items delegated to <strong className="text-white">{displayMemberName}</strong> across every operational module inside Certifyd. Automatically synced and connected with real-time employee notifications.
          </p>
        </div>

        {/* Member Switcher (Super Admin Only) */}
        {isSuperAdmin ? (
          <div className="bg-[#0D1117]/90 border border-white/10 rounded-2xl p-4 shrink-0 w-full md:w-80 relative z-10 shadow-lg space-y-2">
            <label className="block text-xs font-mono text-[#8B949E] uppercase tracking-wider">
              👑 Super Admin: View Employee Work
            </label>
            <select
              value={selectedMemberEmail}
              onChange={(e) => setSelectedMemberEmail(e.target.value)}
              className="w-full bg-[#161B22] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-[#00D4A8] transition-colors cursor-pointer"
            >
              <option value={currentUserEmail}>✨ My Work ({currentUserEmail})</option>
              {teamMembers
                .filter((m) => m.email !== currentUserEmail)
                .map((m) => (
                  <option key={m.id} value={m.email}>
                    👥 {m.name} ({m.email})
                  </option>
                ))}
            </select>
          </div>
        ) : (
          <div className="bg-[#0D1117]/90 border border-[#00D4A8]/20 rounded-2xl p-4 shrink-0 w-full md:w-72 relative z-10 shadow-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00D4A8]/10 border border-[#00D4A8]/30 flex items-center justify-center shrink-0 text-xl">
              🎯
            </div>
            <div>
              <span className="block text-xs font-mono text-[#00D4A8] uppercase tracking-wider font-bold">
                My Personal Work Hub
              </span>
              <span className="text-sm font-semibold text-white truncate block">
                {currentUserEmail}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('tasks')}
          className={`bg-[#161B22] border rounded-2xl p-5 cursor-pointer transition-all ${
            activeTab === 'tasks' ? 'border-[#00D4A8] ring-1 ring-[#00D4A8]/30 shadow-lg bg-[#161B22]/90' : 'border-white/[0.06] hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-[#8B949E] mb-3">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#F97316]">Tasks Assigned</span>
            <CheckSquare className="w-5 h-5 text-[#F97316]" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{myTasks.length}</div>
          <div className="text-xs text-[#8B949E] mt-1 flex items-center gap-2">
            <span>{myTasks.filter(t => t.status === 'In Progress').length} In Progress</span>
            <span>•</span>
            <span>{myTasks.filter(t => t.status === 'To Do').length} To Do</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('calendar')}
          className={`bg-[#161B22] border rounded-2xl p-5 cursor-pointer transition-all ${
            activeTab === 'calendar' ? 'border-[#00D4A8] ring-1 ring-[#00D4A8]/30 shadow-lg bg-[#161B22]/90' : 'border-white/[0.06] hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-[#8B949E] mb-3">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#3B82F6]">Calendar Events</span>
            <CalendarIcon className="w-5 h-5 text-[#3B82F6]" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{myEvents.length}</div>
          <div className="text-xs text-[#8B949E] mt-1">
            Milestones & scheduled meetings
          </div>
        </div>

        <div
          onClick={() => setActiveTab('notes')}
          className={`bg-[#161B22] border rounded-2xl p-5 cursor-pointer transition-all ${
            activeTab === 'notes' ? 'border-[#00D4A8] ring-1 ring-[#00D4A8]/30 shadow-lg bg-[#161B22]/90' : 'border-white/[0.06] hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-[#8B949E] mb-3">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#EC4899]">Assigned SOPs & Notes</span>
            <FileText className="w-5 h-5 text-[#EC4899]" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{myNotes.length}</div>
          <div className="text-xs text-[#8B949E] mt-1">
            Strategy docs & action item notes
          </div>
        </div>

        <div
          onClick={() => setActiveTab('marketing')}
          className={`bg-[#161B22] border rounded-2xl p-5 cursor-pointer transition-all ${
            activeTab === 'marketing' ? 'border-[#00D4A8] ring-1 ring-[#00D4A8]/30 shadow-lg bg-[#161B22]/90' : 'border-white/[0.06] hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-[#8B949E] mb-3">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#00D4A8]">Marketing Scripts</span>
            <Lightbulb className="w-5 h-5 text-[#00D4A8]" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{myMarketing.length}</div>
          <div className="text-xs text-[#8B949E] mt-1">
            Outreach concepts & ad copy
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs & Search */}
      <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-[#00D4A8] text-[#080A0E] shadow'
                : 'bg-[#161B22] text-[#8B949E] hover:text-white border border-white/10'
            }`}
          >
            <span>All Assigned Items</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'all' ? 'bg-[#080A0E] text-[#00D4A8]' : 'bg-white/10 text-white'}`}>
              {totalAssignedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === 'tasks'
                ? 'bg-[#F97316] text-[#080A0E] shadow'
                : 'bg-[#161B22] text-[#8B949E] hover:text-white border border-white/10'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tasks</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'tasks' ? 'bg-[#080A0E] text-[#F97316]' : 'bg-white/10 text-white'}`}>
              {myTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === 'calendar'
                ? 'bg-[#3B82F6] text-[#080A0E] shadow'
                : 'bg-[#161B22] text-[#8B949E] hover:text-white border border-white/10'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendar</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'calendar' ? 'bg-[#080A0E] text-[#3B82F6]' : 'bg-white/10 text-white'}`}>
              {myEvents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === 'notes'
                ? 'bg-[#EC4899] text-[#080A0E] shadow'
                : 'bg-[#161B22] text-[#8B949E] hover:text-white border border-white/10'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notes</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'notes' ? 'bg-[#080A0E] text-[#EC4899]' : 'bg-white/10 text-white'}`}>
              {myNotes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('marketing')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === 'marketing'
                ? 'bg-[#00D4A8] text-[#080A0E] shadow'
                : 'bg-[#161B22] text-[#8B949E] hover:text-white border border-white/10'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Marketing</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'marketing' ? 'bg-[#080A0E] text-[#00D4A8]' : 'bg-white/10 text-white'}`}>
              {myMarketing.length}
            </span>
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B949E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within assigned items..."
            className="w-full bg-[#161B22] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-[#8B949E] focus:outline-none focus:border-[#00D4A8]"
          />
        </div>
      </div>

      {/* Stream of Assigned Work */}
      <div className="space-y-4">
        {totalAssignedCount === 0 ? (
          <div className="bg-[#161B22] border border-dashed border-white/10 rounded-3xl p-16 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[#00D4A8] mx-auto opacity-70" />
            <h3 className="text-lg font-bold text-white">Zero Pending Items!</h3>
            <p className="text-xs text-[#8B949E] font-mono max-w-md mx-auto">
              No tasks, calendar events, notes, or marketing scripts are currently assigned to {displayMemberName}. You're completely up to date!
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {/* TASKS LISTING */}
            {(activeTab === 'all' || activeTab === 'tasks') && filteredTasks.map((t) => (
              <motion.div
                key={`task-${t.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-[#161B22] border border-white/[0.08] hover:border-[#F97316]/40 rounded-2xl p-5 transition-all shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30">
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Task Delegation</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/10 text-white font-bold">
                      {t.section}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                      t.priority === 'Urgent' ? 'bg-[#F85149]/20 text-[#F85149]' :
                      t.priority === 'High' ? 'bg-[#F97316]/20 text-[#F97316]' : 'bg-[#E8C547]/20 text-[#E8C547]'
                    }`}>
                      {t.priority} Priority
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-[#F97316] transition-colors leading-snug">
                    {t.title}
                  </h3>
                  {t.description && (
                    <p className="text-xs text-[#8B949E] font-sans line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs font-mono text-[#8B949E] pt-1">
                    <span className="flex items-center gap-1 text-[#E8C547]">
                      <Clock className="w-3.5 h-3.5" /> Due: {t.deadline}
                    </span>
                    <span>• Assigned by: {t.created_by}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                  {/* Status Switcher right from hub */}
                  <div className="flex items-center gap-1.5 bg-[#0D1117] p-1 rounded-xl border border-white/10">
                    {(['To Do', 'In Progress', 'In Review', 'Completed'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateTaskStatus(t, st)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all ${
                          t.status === st ? 'bg-[#F97316] text-[#080A0E] shadow' : 'text-[#8B949E] hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <Link
                    href="/ops/tasks"
                    className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/15 text-xs font-mono text-white transition-colors flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>Open in Tasks</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}

            {/* CALENDAR EVENTS LISTING */}
            {(activeTab === 'all' || activeTab === 'calendar') && filteredEvents.map((e) => (
              <motion.div
                key={`event-${e.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-[#161B22] border border-white/[0.08] hover:border-[#3B82F6]/40 rounded-2xl p-5 transition-all shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>Calendar Milestone</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/10 text-white font-bold">
                      {e.section}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#3B82F6]/20 text-[#3B82F6] font-bold">
                      {e.time || 'All Day'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-[#3B82F6] transition-colors leading-snug">
                    {e.title}
                  </h3>
                  {e.description && (
                    <p className="text-xs text-[#8B949E] font-sans line-clamp-2 leading-relaxed">
                      {e.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs font-mono text-[#8B949E] pt-1">
                    <span className="text-[#00D4A8] font-bold">Scheduled: {e.date}</span>
                    <span>• Created by: {e.created_by}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                  <Link
                    href="/ops/calendar"
                    className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/15 text-xs font-mono text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>Open in Calendar</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}

            {/* NOTES LISTING */}
            {(activeTab === 'all' || activeTab === 'notes') && filteredNotes.map((n) => (
              <motion.div
                key={`note-${n.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-[#161B22] border border-white/[0.08] hover:border-[#EC4899]/40 rounded-2xl p-5 transition-all shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#EC4899]/15 text-[#EC4899] border border-[#EC4899]/30">
                      <FileText className="w-3.5 h-3.5" />
                      <span>SOP / Action Note</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/10 text-white font-bold">
                      {n.section}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-[#EC4899] transition-colors leading-snug">
                    {n.title}
                  </h3>
                  <p className="text-xs text-[#8B949E] font-sans line-clamp-2 leading-relaxed">
                    {n.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-mono text-[#8B949E] pt-1">
                    <span>Created by: {n.created_by}</span>
                    <span>• {n.comments?.length || 0} discussion replies</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                  <Link
                    href="/ops/notes"
                    className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/15 text-xs font-mono text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>Open in Notes</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}

            {/* MARKETING IDEAS LISTING */}
            {(activeTab === 'all' || activeTab === 'marketing') && filteredMarketing.map((m) => (
              <motion.div
                key={`marketing-${m.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-[#161B22] border border-white/[0.08] hover:border-[#00D4A8]/40 rounded-2xl p-5 transition-all shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#00D4A8]/15 text-[#00D4A8] border border-[#00D4A8]/30">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Marketing Campaign</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/10 text-white font-bold">
                      {m.channel}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#00D4A8]/20 text-[#00D4A8] font-bold">
                      Status: {m.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-[#00D4A8] transition-colors leading-snug">
                    {m.title}
                  </h3>
                  <p className="text-xs text-[#8B949E] font-mono line-clamp-2 leading-relaxed bg-[#0D1117] p-2.5 rounded-xl border border-white/5">
                    {m.script_content}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-mono text-[#8B949E] pt-1">
                    {m.target_audience && <span>Target: <strong className="text-white">{m.target_audience}</strong></span>}
                    <span>• Created by: {m.created_by}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                  <Link
                    href="/marketing/ideas"
                    className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/15 text-xs font-mono text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>Open in Ideapad</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
