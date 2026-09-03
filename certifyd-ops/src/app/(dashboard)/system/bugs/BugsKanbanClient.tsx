'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { OpsBugReport, updateBugStatusAction, saveBugAction, deleteBugAction } from '../../../../actions/opsActions';
import { Tag, Drawer, Button, message, Input, Select, Popconfirm } from 'antd';
import { BugPlay, MessageSquare, Clock, ExternalLink, Plus, Image as ImageIcon, X, Trash2, Copy } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const COLUMNS = ['To Do', 'In Progress', 'In Review', 'Done'];

const SEVERITY_COLORS: Record<string, string> = {
  Low: 'default',
  Medium: 'warning',
  High: 'error',
  Blocker: 'magenta',
};

// Sortable Item Component
function SortableBugCard({ bug, onClick }: { bug: OpsBugReport; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bug.id,
    data: { type: 'Bug', bug },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (!isDragging) onClick();
      }}
      className={`bg-[#1C2128] backdrop-blur-sm border ${
        bug.status === 'Done' ? 'border-emerald-500/40 shadow-[0_4px_12px_rgba(16,185,129,0.1)] hover:border-emerald-500/80 hover:shadow-[0_8px_24px_rgba(16,185,129,0.2)]' :
        bug.status === 'In Progress' ? 'border-blue-500/40 shadow-[0_4px_12px_rgba(59,130,246,0.1)] hover:border-blue-500/80 hover:shadow-[0_8px_24px_rgba(59,130,246,0.2)]' :
        bug.status === 'In Review' ? 'border-orange-500/40 shadow-[0_4px_12px_rgba(249,115,22,0.1)] hover:border-orange-500/80 hover:shadow-[0_8px_24px_rgba(249,115,22,0.2)]' :
        'border-gray-500/40 shadow-[0_4px_12px_rgba(156,163,175,0.1)] hover:border-gray-500/80 hover:shadow-[0_8px_24px_rgba(156,163,175,0.2)]'
      } rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all relative overflow-hidden flex flex-col gap-3 group`}
    >
      <div className={`absolute top-0 left-0 w-[3px] h-full opacity-80 ${
        bug.status === 'Done' ? 'bg-emerald-500' :
        bug.status === 'In Progress' ? 'bg-blue-500' :
        bug.status === 'In Review' ? 'bg-orange-500' :
        'bg-gray-500'
      }`}></div>
      
      {/* Top row */}
      <div className="flex justify-between items-start gap-2">
        <Tag color={SEVERITY_COLORS[bug.severity] || 'default'} className="m-0 uppercase font-bold text-[10px] rounded border-white/[0.06]">
          {bug.severity}
        </Tag>
        <div className="text-[#8B949E] text-[10px] flex items-center gap-1 font-medium">
          <Clock className="w-3 h-3" />
          {new Date(bug.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Description */}
      <p className="text-[#F0F6FC] text-[13px] line-clamp-3 leading-relaxed">
        {bug.description}
      </p>

      {/* Bottom row */}
      <div className="flex justify-between items-center mt-1 pt-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-3">
          <a 
            href={bug.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[11px] text-blue-400/80 hover:text-blue-300 flex items-center gap-1 z-10 font-medium transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" />
            Link
          </a>
          {bug.screenshot_url && (
            <div className="text-[11px] text-emerald-400/80 flex items-center gap-1 font-medium">
              <ImageIcon className="w-3 h-3" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {bug.comments && bug.comments.length > 0 && (
            <div className="flex items-center gap-1 text-[#8B949E] text-[11px] font-medium">
              <MessageSquare className="w-3 h-3" />
              {bug.comments.length}
            </div>
          )}
          <div 
            className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-[9px] font-bold text-[#F0F6FC] shadow-sm ring-2 ring-[#080A0E]"
            title={bug.reporter_email}
          >
            {bug.reporter_email ? bug.reporter_email.charAt(0).toUpperCase() : '?'}
          </div>
        </div>
      </div>
    </div>
  );
}

// Column Component
function Column({ id, bugs, onBugClick }: { id: string; bugs: OpsBugReport[]; onBugClick: (b: OpsBugReport) => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: 'Column', column: id }
  });

  const handleCopyBugs = () => {
    if (bugs.length === 0) {
      message.info('No bugs to copy in this list.');
      return;
    }
    const textToCopy = bugs.map(bug => `${bug.description}\nLink: ${bug.url}`).join('\n\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      message.success(`Copied ${bugs.length} bugs to clipboard!`);
    }).catch(() => {
      message.error('Failed to copy bugs.');
    });
  };

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 min-w-[300px] max-w-[350px] flex flex-col bg-[#080A0E] backdrop-blur-md rounded-2xl border transition-colors duration-200 overflow-hidden ${
        isOver ? 'border-red-500/30 bg-red-500/[0.02]' : 'border-white/[0.04]'
      }`}
    >
      <div className="p-4 border-b border-white/[0.04] flex justify-between items-center bg-white/[0.02]">
        <h3 className="font-semibold text-[#F0F6FC] text-sm flex items-center gap-2">
          {id === 'To Do' && <span className="w-2 h-2 rounded-full bg-gray-400"></span>}
          {id === 'In Progress' && <span className="w-2 h-2 rounded-full bg-blue-400"></span>}
          {id === 'In Review' && <span className="w-2 h-2 rounded-full bg-orange-400"></span>}
          {id === 'Done' && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
          {id}
        </h3>
        <div className="flex items-center gap-2">
          {id === 'To Do' && (
            <Button 
              type="text" 
              size="small" 
              icon={<Copy className="w-3 h-3" />} 
              onClick={handleCopyBugs}
              className="text-[#8B949E] hover:text-[#F0F6FC] h-6 px-2 flex items-center justify-center border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] rounded text-[10px]"
              title="Copy all bugs"
            >
              Copy All
            </Button>
          )}
          <span className="bg-white/5 text-[#c9d1d9] text-[10px] font-bold px-2 py-0.5 rounded-full">
            {bugs.length}
          </span>
        </div>
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto min-h-[200px] flex flex-col gap-3 custom-scrollbar">
        <SortableContext items={bugs.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {bugs.map((bug) => (
            <SortableBugCard key={bug.id} bug={bug} onClick={() => onBugClick(bug)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function BugsKanbanClient({ initialBugs, userEmail }: { initialBugs: OpsBugReport[]; userEmail: string }) {
  const [bugs, setBugs] = useState<OpsBugReport[]>(initialBugs || []);
  const [activeBug, setActiveBug] = useState<OpsBugReport | null>(null);
  const [selectedBug, setSelectedBug] = useState<OpsBugReport | null>(null);
  
  // Form state
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState('Low');
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const descInputRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  const router = useRouter();

  useEffect(() => {
    if (initialBugs) setBugs(initialBugs);
  }, [initialBugs]);

  // Realtime Sync Subscription
  useEffect(() => {
    const channel = supabase.channel('realtime_ops_bug_reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ops_bug_reports' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setBugs((prev) => [payload.new as OpsBugReport, ...prev.filter(b => b.id !== payload.new.id)]);
        } else if (payload.eventType === 'UPDATE') {
          setBugs((prev) => prev.map(b => b.id === payload.new.id ? payload.new as OpsBugReport : b));
        } else if (payload.eventType === 'DELETE') {
          setBugs((prev) => prev.filter(b => b.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const bug = bugs.find((b) => b.id === active.id);
    if (bug) setActiveBug(bug);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveBug(null);
    const { active, over } = event;
    if (!over) return;

    const activeBug = bugs.find((b) => b.id === active.id);
    if (!activeBug) return;

    let newStatus = activeBug.status;
    
    // Check if dropped directly over a column container
    if (COLUMNS.includes(over.id as string)) {
      newStatus = over.id as string;
    } else {
      // Check if dropped over another bug card
      const overBug = bugs.find((b) => b.id === over.id);
      if (overBug) newStatus = overBug.status;
    }

    if (activeBug.status !== newStatus) {
      // Optimistic Update
      const oldStatus = activeBug.status;
      setBugs((prev) => 
        prev.map(b => b.id === activeBug.id ? { ...b, status: newStatus, updated_at: new Date().toISOString() } : b)
      );

      // Backend Update
      const res = await updateBugStatusAction(activeBug.id, newStatus);
      if (!res.success) {
        message.error('Failed to update bug status');
        // Revert
        setBugs((prev) => 
          prev.map(b => b.id === activeBug.id ? { ...b, status: oldStatus } : b)
        );
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      message.error("Image must be smaller than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateBug = async () => {
    if (!newUrl.trim() || !newDesc.trim()) {
      message.error('URL and Description are required.');
      return;
    }
    setSubmitting(true);
    try {
      const bug: OpsBugReport = {
        id: `bug-${Date.now()}`,
        url: newUrl,
        description: newDesc,
        severity: newSeverity,
        status: 'To Do',
        reporter_email: userEmail || 'unknown',
        screenshot_url: screenshotBase64 || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const res = await saveBugAction(bug);
      if (res.success) {
        message.success('Bug added to To Do list!');
        setNewUrl('');
        setNewDesc('');
        setNewSeverity('Low');
        setScreenshotBase64(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        router.refresh();
      } else {
        message.error(res.message || 'Failed to save bug.');
      }
    } catch (e) {
      message.error('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBug = async (id: string) => {
    const res = await deleteBugAction(id);
    if (res.success) {
      message.success('Bug deleted successfully');
      setSelectedBug(null);
      setBugs(prev => prev.filter(b => b.id !== id));
      router.refresh();
    } else {
      message.error('Failed to delete bug');
    }
  };

  const bugsByCol = COLUMNS.reduce((acc, col) => {
    acc[col] = bugs.filter(b => b.status === col);
    return acc;
  }, {} as Record<string, OpsBugReport[]>);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative bg-[url('/grid.svg')] bg-center">
      {/* Quick Add Inline Form - Premium Finish */}
      <div className="p-5 border-b border-white/[0.04] bg-[#161B22] backdrop-blur-xl sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3 items-end sm:items-center">
          <div className="flex-1 w-full flex flex-wrap sm:flex-nowrap gap-3 items-center">
            <Input 
              placeholder="Page URL where bug occurred..."
              value={newUrl}
              onChange={(e: any) => setNewUrl(e.target.value)}
              onPressEnter={() => descInputRef.current?.focus()}
              className="bg-[#1C2128] border-white/[0.06] text-[#F0F6FC] placeholder-[#7d8590] rounded-lg hover:border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_2px_rgba(239,68,68,0.2)] h-10 min-w-[200px] flex-1"
            />
            <Input 
              ref={descInputRef}
              placeholder="Short description of the bug..."
              value={newDesc}
              onChange={(e: any) => setNewDesc(e.target.value)}
              onPressEnter={handleCreateBug}
              className="bg-[#1C2128] border-white/[0.06] text-[#F0F6FC] placeholder-[#7d8590] rounded-lg hover:border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_2px_rgba(239,68,68,0.2)] h-10 min-w-[250px] flex-[2]"
            />
            <Select 
              value={newSeverity} 
              onChange={setNewSeverity}
              className="w-full sm:w-[130px] h-10 rounded-lg text-[#F0F6FC]"
              popupClassName="!bg-[#1C2128] !border !border-white/[0.1]"
            >
              <Select.Option value="Low"><Tag color="default" className="m-0 border-white/[0.06]">Low</Tag></Select.Option>
              <Select.Option value="Medium"><Tag color="warning" className="m-0 border-white/[0.06]">Medium</Tag></Select.Option>
              <Select.Option value="High"><Tag color="error" className="m-0 border-white/[0.06]">High</Tag></Select.Option>
              <Select.Option value="Blocker"><Tag color="magenta" className="m-0 border-white/[0.06]">Blocker</Tag></Select.Option>
            </Select>
            
            {/* Screenshot Upload Button */}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
            />
            <Button 
              type="default" 
              onClick={() => fileInputRef.current?.click()}
              className={`h-10 px-3 rounded-lg flex items-center justify-center ${screenshotBase64 ? 'border-emerald-500 text-emerald-500 bg-emerald-50' : ''}`}
              icon={<ImageIcon className="w-4 h-4" />}
            >
              {screenshotBase64 ? 'Attached' : 'Screenshot'}
            </Button>
            {screenshotBase64 && (
              <Button 
                type="text" 
                onClick={() => { setScreenshotBase64(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="h-10 w-10 p-0 border border-red-500/30 text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg flex items-center justify-center"
                icon={<X className="w-4 h-4" />}
              />
            )}
          </div>
          <Button 
            type="primary" 
            onClick={handleCreateBug} 
            loading={submitting}
            icon={<Plus className="w-4 h-4" />}
            className="bg-red-600 hover:bg-red-500 border-none w-full sm:w-auto h-10 px-6 rounded-lg font-medium shadow-[0_4px_14px_0_rgb(220,38,38,0.39)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.23)]"
          >
            Report Bug
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-6 custom-scrollbar">
        <div className="flex gap-6 h-full items-start min-w-max">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {COLUMNS.map((colId) => (
              <Column 
                key={colId} 
                id={colId} 
                bugs={bugsByCol[colId] || []} 
                onBugClick={(bug) => setSelectedBug(bug)} 
              />
            ))}

            <DragOverlay>
              {activeBug ? (
                <div className="opacity-90 scale-105 rotate-3 shadow-2xl cursor-grabbing">
                  <SortableBugCard bug={activeBug} onClick={() => {}} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Modern Drawer for Bug Details */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <BugPlay className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-[#F0F6FC] font-semibold">Bug Details</span>
          </div>
        }
        placement="right"
        width={480}
        onClose={() => setSelectedBug(null)}
        open={!!selectedBug}
        className="border-l border-white/[0.06]"
        classNames={{
          header: 'bg-[#161B22] border-b border-white/[0.05] !p-5',
          body: 'bg-[#0D1117] !p-6'
        }}
        closeIcon={<X className="w-5 h-5 text-[#8B949E] hover:text-[#F0F6FC] transition-colors" />}
      >
        {selectedBug && (
          <div className="flex flex-col gap-6">
            <div className="bg-[#1C2128] p-5 rounded-xl border border-white/[0.04]">
              <div className="text-[11px] text-[#8B949E] uppercase tracking-widest mb-3 font-bold">Description</div>
              <p className="text-[#F0F6FC] text-sm whitespace-pre-wrap leading-relaxed">
                {selectedBug.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1C2128] p-4 rounded-xl border border-white/[0.04] flex flex-col justify-center">
                <div className="text-[11px] text-[#8B949E] uppercase tracking-widest mb-2 font-bold">Status</div>
                <div className="text-[#F0F6FC] font-semibold flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    selectedBug.status === 'Done' ? 'bg-emerald-400' :
                    selectedBug.status === 'In Progress' ? 'bg-blue-400' :
                    selectedBug.status === 'In Review' ? 'bg-orange-400' : 'bg-gray-400'
                  }`}></span>
                  {selectedBug.status}
                </div>
              </div>
              <div className="bg-[#1C2128] p-4 rounded-xl border border-white/[0.04] flex flex-col justify-center">
                <div className="text-[11px] text-[#8B949E] uppercase tracking-widest mb-2 font-bold">Severity</div>
                <Tag color={SEVERITY_COLORS[selectedBug.severity] || 'default'} className="m-0 uppercase font-bold text-[10px] w-fit rounded border-white/[0.06]">
                  {selectedBug.severity}
                </Tag>
              </div>
            </div>

            <div className="bg-[#1C2128] p-4 rounded-xl border border-white/[0.04]">
               <div className="text-[11px] text-[#8B949E] uppercase tracking-widest mb-2 font-bold">Page URL</div>
               <a 
                  href={selectedBug.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-blue-400 hover:text-blue-300 break-all flex items-center gap-2 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  {selectedBug.url}
                </a>
            </div>

            <div className="bg-[#1C2128] p-4 rounded-xl border border-white/[0.04] flex justify-between items-center">
              <div>
                <div className="text-[11px] text-[#8B949E] uppercase tracking-widest mb-2 font-bold">Reported By</div>
                <div className="text-[#F0F6FC] text-sm font-medium">
                  {selectedBug.reporter_email}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-sm font-bold text-[#F0F6FC] shadow-lg ring-4 ring-[#0D1117]">
                {selectedBug.reporter_email ? selectedBug.reporter_email.charAt(0).toUpperCase() : '?'}
              </div>
            </div>
            
            {/* Screenshot Rendering */}
            {selectedBug.screenshot_url && (
              <div className="bg-[#1C2128] p-4 rounded-xl border border-white/[0.04]">
                <div className="text-[11px] text-[#8B949E] uppercase tracking-widest mb-3 font-bold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Screenshot Attached
                </div>
                <div className="rounded-lg overflow-hidden border border-white/[0.06] bg-black/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedBug.screenshot_url} alt="Bug Screenshot" className="w-full object-contain max-h-[300px]" />
                </div>
              </div>
            )}

            <div className="pt-4 mt-2 border-t border-red-500/10 flex justify-end">
              <Popconfirm
                title="Delete bug report"
                description="Are you sure you want to delete this bug?"
                onConfirm={() => handleDeleteBug(selectedBug.id)}
                okText="Yes, delete"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <Button danger type="text" icon={<Trash2 className="w-4 h-4" />} className="hover:bg-red-500/10 transition-colors">
                  Delete Bug Report
                </Button>
              </Popconfirm>
            </div>

          </div>
        )}
      </Drawer>
    </div>
  );
}
