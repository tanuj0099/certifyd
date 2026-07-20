'use client';

import React, { useState } from 'react';
import { OpsTaskItem, OpsTeamMember, saveOpsTaskAction, deleteOpsTaskAction, getOpsTasksAction } from '../../actions/opsActions';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import {
  CheckSquare,
  Plus,
  Filter,
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  Trash2,
  MessageSquare,
  ChevronRight,
  LayoutGrid,
  List,
  Layers,
  Send,
  X,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TasksClientProps {
  initialTasks: OpsTaskItem[];
  teamMembers: OpsTeamMember[];
  currentUserRole: string;
  currentUserEmail: string;
}

type SectionType = 'all' | 'marketing' | 'technical' | 'database' | 'verifications' | 'content' | 'admin';

export function TasksClient({ initialTasks, teamMembers, currentUserRole, currentUserEmail }: TasksClientProps) {
  const [tasks, setTasks] = useState<OpsTaskItem[]>(initialTasks || []);
  const [activeSection, setActiveSection] = useState<SectionType>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialTasks) setTasks(initialTasks);
  }, [initialTasks]);

  React.useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const liveTasks = await getOpsTasksAction();
        if (isMounted && liveTasks) {
          setTasks(liveTasks);
        }
      } catch (e) {}
    }, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<OpsTaskItem | null>(null);

  // Inspector Modal
  const [activeTask, setActiveTask] = useState<OpsTaskItem | null>(null);
  const [newNoteText, setNewNoteText] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [section, setSection] = useState<OpsTaskItem['section']>('marketing');
  const [assignee, setAssignee] = useState(teamMembers?.[0]?.name || 'Super Admin');
  const [priority, setPriority] = useState<OpsTaskItem['priority']>('Medium');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
  const [status, setStatus] = useState<OpsTaskItem['status']>('To Do');
  const [checklist, setChecklist] = useState<{ id: string; text: string; completed: boolean }[]>([
    { id: 'c1', text: 'Initial scoping and requirement gathering', completed: false },
    { id: 'c2', text: 'Execute primary deliverables', completed: false }
  ]);
  const [newChecklistInput, setNewChecklistInput] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { showToast } = useToast();

  const sections: { id: SectionType; label: string; icon: string }[] = [
    { id: 'all', label: 'All Departments', icon: '🌐' },
    { id: 'marketing', label: 'Marketing Side', icon: '📈' },
    { id: 'technical', label: 'Technical Side', icon: '⚙️' },
    { id: 'database', label: 'Database', icon: '🗄️' },
    { id: 'verifications', label: 'Verifications', icon: '🛡️' },
    { id: 'content', label: 'Content & Support', icon: '💬' },
    { id: 'admin', label: 'General Admin', icon: '👑' },
  ];

  const filteredTasks = (tasks || []).filter((t) => {
    if (!t) return false;
    const matchSection = activeSection === 'all' || t.section === activeSection;
    const q = searchQuery.toLowerCase();
    const matchSearch = (t.title || '').toLowerCase().includes(q) ||
                        (t.description || '').toLowerCase().includes(q) ||
                        (t.assignee || '').toLowerCase().includes(q);
    return matchSection && matchSearch;
  });

  function openCreateModal() {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setSection(activeSection === 'all' ? 'marketing' : activeSection);
    setAssignee(teamMembers[0]?.name || 'Super Admin');
    setPriority('Medium');
    setDeadline(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
    setStatus('To Do');
    setChecklist([
      { id: 'c1', text: 'Review section requirements & deadlines', completed: false },
      { id: 'c2', text: 'Execute department action items', completed: false }
    ]);
    setIsModalOpen(true);
  }

  function openEditModal(t: OpsTaskItem) {
    setEditingTask(t);
    setTitle(t.title);
    setDescription(t.description);
    setSection(t.section);
    setAssignee(t.assignee);
    setPriority(t.priority);
    setDeadline(t.deadline);
    setStatus(t.status);
    setChecklist(t.checklist || []);
    setIsModalOpen(true);
  }

  function handleAddChecklistItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newChecklistInput.trim()) return;
    setChecklist((prev) => [...prev, { id: `c-${Date.now()}`, text: newChecklistInput.trim(), completed: false }]);
    setNewChecklistInput('');
  }

  function handleRemoveChecklistItem(id: string) {
    setChecklist((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleSaveTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData: OpsTaskItem = {
      id: editingTask ? editingTask.id : `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      section,
      assignee,
      priority,
      deadline,
      status,
      checklist,
      notes: editingTask ? editingTask.notes : [],
      created_by: editingTask ? editingTask.created_by : currentUserEmail,
      created_at: editingTask ? editingTask.created_at : new Date().toISOString(),
    };

    setTasks((prev) => {
      const exists = prev.some((t) => t.id === taskData.id);
      if (exists) return prev.map((t) => (t.id === taskData.id ? taskData : t));
      return [taskData, ...prev];
    });

    if (activeTask && activeTask.id === taskData.id) {
      setActiveTask(taskData);
    }

    setIsModalOpen(false);
    await saveOpsTaskAction(taskData);
    const latest = await getOpsTasksAction();
    if (latest) setTasks(latest);
    showToast(editingTask ? 'Updated delegated task!' : 'Delegated new section task!', 'success');
  }

  async function handleStatusChange(task: OpsTaskItem, newStatus: OpsTaskItem['status']) {
    const updated = { ...task, status: newStatus };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    if (activeTask && activeTask.id === task.id) setActiveTask(updated);
    await saveOpsTaskAction(updated);
    const latest = await getOpsTasksAction();
    if (latest) setTasks(latest);
    showToast(`Task moved to ${newStatus}`, 'success');
  }

  async function handleToggleSubtask(task: OpsTaskItem, subtaskId: string) {
    const updatedChecklist = task.checklist.map((c) =>
      c.id === subtaskId ? { ...c, completed: !c.completed } : c
    );
    const updated = { ...task, checklist: updatedChecklist };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    if (activeTask && activeTask.id === task.id) setActiveTask(updated);
    await saveOpsTaskAction(updated);
    const latest = await getOpsTasksAction();
    if (latest) setTasks(latest);
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTask || !newNoteText.trim()) return;

    const note = {
      author: currentUserEmail.split('@')[0],
      text: newNoteText.trim(),
      date: 'Just now',
    };

    const updatedNotes = [...(activeTask.notes || []), note];
    const updatedTask = { ...activeTask, notes: updatedNotes };

    setTasks((prev) => prev.map((t) => (t.id === activeTask.id ? updatedTask : t)));
    setActiveTask(updatedTask);
    setNewNoteText('');

    await saveOpsTaskAction(updatedTask);
    const latest = await getOpsTasksAction();
    if (latest) setTasks(latest);
    showToast('Added comment to task log', 'success');
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setTasks((prev) => prev.filter((t) => t.id !== deleteId));
    if (activeTask && activeTask.id === deleteId) setActiveTask(null);
    setDeleteId(null);
    await deleteOpsTaskAction(deleteId);
    const latest = await getOpsTasksAction();
    if (latest) setTasks(latest);
    showToast('Deleted delegated task', 'success');
  }

  async function handleDropTaskStatus(taskId: string, newStatus: OpsTaskItem['status']) {
    const target = tasks.find((t) => t.id === taskId);
    if (!target || target.status === newStatus) return;
    const updated = { ...target, status: newStatus };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    if (activeTask && activeTask.id === taskId) setActiveTask(updated);
    await saveOpsTaskAction(updated);
    const latest = await getOpsTasksAction();
    if (latest) setTasks(latest);
    showToast(`Task moved to "${newStatus}"`, 'success');
  }

  async function handleDropTaskSection(taskId: string, newSection: OpsTaskItem['section']) {
    const target = tasks.find((t) => t.id === taskId);
    if (!target || target.section === newSection) return;
    const updated = { ...target, section: newSection };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    if (activeTask && activeTask.id === taskId) setActiveTask(updated);
    await saveOpsTaskAction(updated);
    const latest = await getOpsTasksAction();
    if (latest) setTasks(latest);
    showToast(`Re-assigned task to department: ${newSection}`, 'success');
  }

  const priorityColors: Record<OpsTaskItem['priority'], string> = {
    Urgent: 'bg-[#F85149]/15 text-[#F85149] border-[#F85149]/30',
    High: 'bg-[#E8C547]/15 text-[#E8C547] border-[#E8C547]/30',
    Medium: 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30',
    Low: 'bg-[#8B949E]/15 text-[#8B949E] border-[#8B949E]/30',
  };

  const statusColumns: OpsTaskItem['status'][] = ['To Do', 'In Progress', 'In Review', 'Completed'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#F97316]" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Whole-Section Task Delegation</h1>
          </div>
          <p className="text-sm text-[#8B949E] mt-1 font-mono">
            Delegate entire batches of work by department with deadlines, checklists, assignee teams, and collaborative logs.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-[#161B22] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'kanban' ? 'bg-[#F97316] text-[#080A0E] font-bold shadow' : 'text-[#8B949E] hover:text-white'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-[#F97316] text-[#080A0E] font-bold shadow' : 'text-[#8B949E] hover:text-white'
              }`}
              title="List View Table"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] text-[#080A0E] font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-[#F97316]/15"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Delegate Section Tasks</span>
          </button>
        </div>
      </div>

      {/* Section Department Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.04] no-scrollbar">
        {sections.map((s) => {
          const count = tasks.filter((t) => s.id === 'all' || t.section === s.id).length;
          const isActive = activeSection === s.id;

          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              onDragOver={(e) => {
                if (s.id === 'all') return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverSection(s.id);
              }}
              onDragLeave={() => setDragOverSection(null)}
              onDrop={async (e) => {
                if (s.id === 'all') return;
                e.preventDefault();
                setDragOverSection(null);
                const taskId = e.dataTransfer.getData('text/plain');
                if (taskId) await handleDropTaskSection(taskId, s.id as any);
              }}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                dragOverSection === s.id
                  ? 'bg-[#F97316] text-[#080A0E] scale-105 shadow-lg font-bold'
                  : isActive
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

      {/* Search Input */}
      <div className="flex justify-end">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter delegated tasks..."
          className="bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-[#8B949E] focus:outline-none focus:border-[#F97316] w-64"
        />
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {statusColumns.map((colStatus) => {
            const colTasks = filteredTasks.filter((t) => t.status === colStatus);

            return (
              <div
                key={colStatus}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverColumn(colStatus);
                }}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragOverColumn(null);
                  const taskId = e.dataTransfer.getData('text/plain');
                  if (taskId) await handleDropTaskStatus(taskId, colStatus);
                }}
                className={`bg-[#0D1117]/80 border rounded-2xl p-4 min-h-[450px] flex flex-col transition-all ${
                  dragOverColumn === colStatus
                    ? 'border-[#F97316] bg-[#F97316]/[0.03] ring-2 ring-[#F97316]/30'
                    : 'border-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      colStatus === 'Completed' ? 'bg-[#22C55E]' :
                      colStatus === 'In Review' ? 'bg-[#E8C547]' :
                      colStatus === 'In Progress' ? 'bg-[#3B82F6]' : 'bg-[#8B949E]'
                    }`} />
                    <h3 className="font-bold text-sm text-white">{colStatus}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-mono font-semibold text-[#8B949E]">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  <AnimatePresence>
                    {colTasks.length === 0 ? (
                      <div className="h-32 flex items-center justify-center border border-dashed border-white/5 rounded-xl text-center p-4">
                        <span className="text-xs text-[#8B949E] font-mono">No tasks in {colStatus}</span>
                      </div>
                    ) : (
                      colTasks.map((task) => {
                        const totalSub = task.checklist?.length || 0;
                        const doneSub = task.checklist?.filter((c) => c.completed).length || 0;
                        const progress = totalSub > 0 ? Math.round((doneSub / totalSub) * 100) : 0;

                        return (
                          <motion.div
                            key={task.id}
                            layout
                            draggable={true}
                            onDragStart={(e: any) => {
                              e.dataTransfer.setData('text/plain', task.id);
                              e.dataTransfer.effectAllowed = 'move';
                              setDraggedTaskId(task.id);
                            }}
                            onDragEnd={() => setDraggedTaskId(null)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={() => setActiveTask(task)}
                            className={`bg-[#161B22] border rounded-xl p-4 transition-all cursor-pointer shadow-md hover:shadow-xl group relative select-none ${
                              draggedTaskId === task.id
                                ? 'opacity-40 scale-95 border-[#F97316]'
                                : 'border-white/[0.08] hover:border-[#F97316]/40'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${priorityColors[task.priority]}`}>
                                {task.priority}
                              </span>
                              <span className="text-[11px] font-mono text-[#8B949E] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {task.deadline}
                              </span>
                            </div>

                            <h4 className="font-bold text-sm text-white group-hover:text-[#F97316] transition-colors line-clamp-2">
                              {task.title}
                            </h4>

                            <p className="text-xs text-[#8B949E] mt-1.5 line-clamp-2 font-sans">
                              {task.description}
                            </p>

                            {totalSub > 0 && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-[10px] font-mono text-[#8B949E] mb-1">
                                  <span>Checklist: {doneSub}/{totalSub}</span>
                                  <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-[#F97316] to-[#EA580C] h-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-[#8B949E]">
                              <div className="flex items-center gap-1.5 min-w-0 truncate">
                                <User className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
                                <span className="truncate text-[11px] font-mono font-medium text-white/80">{task.assignee}</span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {task.notes && task.notes.length > 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-[11px] font-mono text-[#E8C547]">
                                    <MessageSquare className="w-3 h-3" />
                                    {task.notes.length}
                                  </span>
                                )}
                                <ChevronRight className="w-4 h-4 text-[#8B949E] group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW TABLE */
        <div className="bg-[#0D1117] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-[#8B949E] font-mono text-xs bg-[#161B22]/50">
                <th className="py-3.5 px-4">TASK TITLE & DESCRIPTION</th>
                <th className="py-3.5 px-4">SECTION</th>
                <th className="py-3.5 px-4">ASSIGNEE</th>
                <th className="py-3.5 px-4">PRIORITY</th>
                <th className="py-3.5 px-4">DEADLINE</th>
                <th className="py-3.5 px-4">CHECKLIST</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8B949E] font-mono">
                    No delegated operational tasks match your current criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const totalSub = t.checklist?.length || 0;
                  const doneSub = t.checklist?.filter((c) => c.completed).length || 0;

                  return (
                    <tr key={t.id} onClick={() => setActiveTask(t)} className="hover:bg-white/[0.02] cursor-pointer transition-colors">
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-bold text-white hover:text-[#F97316] transition-colors">{t.title}</div>
                        <div className="text-xs text-[#8B949E] truncate mt-0.5">{t.description}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs uppercase text-[#F97316] font-bold">{t.section}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-white/90">{t.assignee}</td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${priorityColors[t.priority]}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#8B949E]">{t.deadline}</td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span className="text-white font-bold">{doneSub}</span> / {totalSub}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold font-mono ${
                          t.status === 'Completed' ? 'bg-[#22C55E]/20 text-[#22C55E]' :
                          t.status === 'In Review' ? 'bg-[#E8C547]/20 text-[#E8C547]' :
                          t.status === 'In Progress' ? 'bg-[#3B82F6]/20 text-[#3B82F6]' : 'bg-white/10 text-white'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(t)}
                            className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/10 text-xs font-mono text-white transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteId(t.id)}
                            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-[#F85149]/20 text-[#8B949E] hover:text-[#F85149] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* CREATE / EDIT TASK MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0D1117] border border-white/10 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-[#F97316]" />
                  <span>{editingTask ? 'Edit Delegated Task' : 'Delegate New Section Task'}</span>
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-[#8B949E] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTask} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#8B949E] uppercase mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Audit AWS Cloud Certifications Staging Batch"
                    className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8B949E] uppercase mb-1">Detailed Instructions / Description</label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide full context, links, and deliverables for the assignee..."
                    className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#8B949E] uppercase mb-1">Target Section</label>
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
                    <label className="block text-xs font-mono text-[#8B949E] uppercase mb-1">Assignee</label>
                    <select
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                      className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316]"
                    >
                      <option value="Entire Marketing Team">👥 Entire Marketing Team</option>
                      <option value="Entire Technical Team">👥 Entire Technical Team</option>
                      <option value="Entire Verifications Team">👥 Entire Verifications Team</option>
                      <option value="Super Admin">👑 Super Admin</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.name}>👤 {m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#8B949E] uppercase mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316]"
                    >
                      <option value="Urgent">🚨 Urgent</option>
                      <option value="High">⚠️ High</option>
                      <option value="Medium">⚡ Medium</option>
                      <option value="Low">💤 Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#8B949E] uppercase mb-1">Deadline Date</label>
                    <input
                      type="date"
                      required
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#8B949E] uppercase mb-1">Initial Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316]"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="In Review">In Review</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Checklist Builder */}
                <div className="pt-2 border-t border-white/10">
                  <label className="block text-xs font-mono text-[#F97316] uppercase mb-2 font-bold">
                    Subtask Checklist Items ({checklist.length})
                  </label>
                  <div className="space-y-2 max-h-36 overflow-y-auto mb-3">
                    {checklist.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-[#161B22] p-2 rounded-xl border border-white/5 text-sm">
                        <span className="text-white truncate">{item.text}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklistItem(item.id)}
                          className="text-[#8B949E] hover:text-[#F85149] p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newChecklistInput}
                      onChange={(e) => setNewChecklistInput(e.target.value)}
                      placeholder="Add subtask deliverable..."
                      className="flex-1 bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#F97316]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddChecklistItem(e as any);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddChecklistItem}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-sm font-semibold text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#F97316]/90 text-[#080A0E] font-bold text-sm transition-all shadow-lg shadow-[#F97316]/20"
                  >
                    {editingTask ? 'Update Task' : 'Delegate Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INSPECTOR / DETAILS MODAL */}
      <AnimatePresence>
        {activeTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0D1117] border border-white/15 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-white/10 gap-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${priorityColors[activeTask.priority]}`}>
                      {activeTask.priority} Priority
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono uppercase text-[#F97316] font-bold">
                      {activeTask.section}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white leading-snug">{activeTask.title}</h2>
                  <p className="text-xs text-[#8B949E] font-mono mt-1">
                    Assigned to: <span className="text-white font-semibold">{activeTask.assignee}</span> • Due: <span className="text-[#E8C547]">{activeTask.deadline}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { openEditModal(activeTask); }}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/10 text-xs font-mono text-white transition-colors"
                  >
                    Edit
                  </button>
                  <button onClick={() => setActiveTask(null)} className="text-[#8B949E] hover:text-white p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="py-4 space-y-6 overflow-y-auto flex-1 pr-1">
                <div>
                  <h4 className="text-xs font-mono text-[#8B949E] uppercase mb-1">Instructions & Context</h4>
                  <div className="bg-[#161B22] p-4 rounded-xl border border-white/5 text-sm text-white/90 leading-relaxed font-sans whitespace-pre-wrap">
                    {activeTask.description}
                  </div>
                </div>

                {/* Status Switcher */}
                <div>
                  <h4 className="text-xs font-mono text-[#8B949E] uppercase mb-2">Update Operational Status</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {statusColumns.map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(activeTask, st)}
                        className={`py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                          activeTask.status === st
                            ? 'bg-[#F97316] text-[#080A0E] border-[#F97316] shadow-lg shadow-[#F97316]/20'
                            : 'bg-[#161B22] text-[#8B949E] hover:text-white border-white/10'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtask Checklist */}
                <div>
                  <h4 className="text-xs font-mono text-[#F97316] uppercase mb-2 font-bold flex items-center justify-between">
                    <span>Deliverables Checklist</span>
                    <span>
                      {activeTask.checklist?.filter((c) => c.completed).length || 0} / {activeTask.checklist?.length || 0} Completed
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {(!activeTask.checklist || activeTask.checklist.length === 0) ? (
                      <p className="text-xs text-[#8B949E] italic font-mono">No checklist items specified for this task.</p>
                    ) : (
                      activeTask.checklist.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleSubtask(activeTask, item.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                            item.completed
                              ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-white'
                              : 'bg-[#161B22] border-white/10 hover:border-white/20 text-white/90'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                            item.completed ? 'bg-[#22C55E] border-[#22C55E] text-[#080A0E]' : 'border-white/30 bg-transparent'
                          }`}>
                            {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className={`text-sm ${item.completed ? 'line-through text-[#8B949E]' : ''}`}>
                            {item.text}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Collaborative Activity & Comments Log */}
                <div className="pt-2 border-t border-white/10">
                  <h4 className="text-xs font-mono text-[#8B949E] uppercase mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#E8C547]" />
                    <span>Collaborative Log & Notes ({activeTask.notes?.length || 0})</span>
                  </h4>

                  <div className="space-y-3 max-h-48 overflow-y-auto mb-4 pr-1">
                    {(!activeTask.notes || activeTask.notes.length === 0) ? (
                      <p className="text-xs text-[#8B949E] italic font-mono text-center py-4 bg-[#161B22]/50 rounded-xl border border-white/5">
                        No team comments on this task yet. Leave a note below!
                      </p>
                    ) : (
                      activeTask.notes.map((note, idx) => (
                        <div key={idx} className="bg-[#161B22] p-3.5 rounded-xl border border-white/5 space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="font-bold text-[#F97316]">👤 {note.author}</span>
                            <span className="text-[#8B949E] text-[11px]">{note.date}</span>
                          </div>
                          <p className="text-sm text-white/90 font-sans">{note.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Note Form */}
                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Write a progress comment or note..."
                      className="flex-1 bg-[#161B22] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#8B949E] focus:outline-none focus:border-[#F97316]"
                    />
                    <button
                      type="submit"
                      disabled={!newNoteText.trim()}
                      className="px-4 py-2.5 rounded-xl bg-[#E8C547] hover:bg-[#E8C547]/90 disabled:opacity-50 text-[#080A0E] font-bold text-sm transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span>Post Note</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between shrink-0">
                <button
                  onClick={() => setDeleteId(activeTask.id)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#F85149] hover:underline font-mono"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Task</span>
                </button>
                <button
                  onClick={() => setActiveTask(null)}
                  className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#F97316]/90 text-[#080A0E] font-bold text-sm transition-all"
                >
                  Close Inspector
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
        title="Delete Delegated Task?"
        impact="Are you sure you want to remove this delegated task? All attached checklists and status logs will be deleted."
        confirmWord="DELETE"
      />
    </div>
  );
}
