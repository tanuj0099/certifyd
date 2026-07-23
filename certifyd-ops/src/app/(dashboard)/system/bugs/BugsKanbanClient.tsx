'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { OpsBugReport, updateBugStatusAction, saveBugAction } from '../../../../actions/opsActions';
import { Tag, Drawer, Button, message, Input, Spin, Select } from 'antd';
import { BugPlay, MessageSquare, Clock, ExternalLink, Plus } from 'lucide-react';
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
        // Prevent click if they are dragging
        if (!isDragging) {
          onClick();
        }
      }}
      className="bg-[#1C1F26] border border-white/[0.06] hover:border-red-500/30 rounded-lg p-4 cursor-grab active:cursor-grabbing group shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col gap-3"
    >
      {/* Top row */}
      <div className="flex justify-between items-start gap-2">
        <Tag color={SEVERITY_COLORS[bug.severity] || 'default'} className="m-0 uppercase font-bold text-[10px]">
          {bug.severity}
        </Tag>
        <div className="text-[#8B949E] text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(bug.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Description */}
      <p className="text-white text-sm line-clamp-3 leading-snug">
        {bug.description}
      </p>

      {/* Bottom row */}
      <div className="flex justify-between items-center mt-1 border-t border-white/[0.04] pt-3">
        <a 
          href={bug.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3 h-3" />
          View Page
        </a>
        <div className="flex items-center gap-2">
          {bug.comments && bug.comments.length > 0 && (
            <div className="flex items-center gap-1 text-[#8B949E] text-xs">
              <MessageSquare className="w-3 h-3" />
              {bug.comments.length}
            </div>
          )}
          <div 
            className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
            title={bug.reporter_email}
          >
            {bug.reporter_email.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Column Component
function Column({ id, bugs, onBugClick }: { id: string; bugs: OpsBugReport[]; onBugClick: (b: OpsBugReport) => void }) {
  return (
    <div className="flex-1 min-w-[280px] max-w-[350px] flex flex-col bg-[#080A0E] rounded-xl border border-white/[0.04] overflow-hidden">
      <div className="p-4 border-b border-white/[0.04] flex justify-between items-center bg-white/[0.01]">
        <h3 className="font-semibold text-white/90">{id}</h3>
        <span className="bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded-full">
          {bugs.length}
        </span>
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto min-h-[150px] flex flex-col gap-3 custom-scrollbar">
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
  const [bugs, setBugs] = useState<OpsBugReport[]>(initialBugs);
  const [activeBug, setActiveBug] = useState<OpsBugReport | null>(null);
  const [selectedBug, setSelectedBug] = useState<OpsBugReport | null>(null); // For drawer
  
  // Form state
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState('Low');
  const [submitting, setSubmitting] = useState(false);
  const descInputRef = React.useRef<any>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  const router = useRouter();

  useEffect(() => {
    setBugs(initialBugs);
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
      activationConstraint: {
        distance: 5, // 5px drag distance before firing, allows clicks to pass through
      },
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

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    // Find containers
    const activeId = active.id;
    const overId = over.id;

    // We only care about drag end for column moves in this simple setup
    // For a complex setup, we'd handle it here. 
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveBug(null);
    const { active, over } = event;
    if (!over) return;

    const activeBug = bugs.find((b) => b.id === active.id);
    if (!activeBug) return;

    // Determine the target column based on the over element
    let newStatus = activeBug.status;
    
    // If over a column itself
    if (COLUMNS.includes(over.id as string)) {
      newStatus = over.id as string;
    } else {
      // If over another card, get its status
      const overBug = bugs.find((b) => b.id === over.id);
      if (overBug) {
        newStatus = overBug.status;
      }
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

  // Group bugs by column
  const bugsByCol = COLUMNS.reduce((acc, col) => {
    acc[col] = bugs.filter(b => b.status === col);
    return acc;
  }, {} as Record<string, OpsBugReport[]>);

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
        reporter_email: userEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const res = await saveBugAction(bug);
      if (res.success) {
        message.success('Bug added to To Do list!');
        setNewUrl('');
        setNewDesc('');
        setNewSeverity('Low');
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

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* Quick Add Inline Form */}
      <div className="p-4 border-b border-white/[0.06] bg-white/[0.01] flex flex-col sm:flex-row gap-3 items-end sm:items-center">
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-3">
          <Input 
            placeholder="URL of the issue..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onPressEnter={() => descInputRef.current?.focus()}
            className="bg-[#1C1F26] border-white/10 text-white placeholder-white/30"
          />
          <Input 
            ref={descInputRef}
            placeholder="Short description of the bug..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            onPressEnter={handleCreateBug}
            className="bg-[#1C1F26] border-white/10 text-white placeholder-white/30"
          />
          <Select 
            value={newSeverity} 
            onChange={setNewSeverity}
            className="w-full sm:w-[120px]"
            dropdownStyle={{ backgroundColor: '#1C1F26', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Select.Option value="Low"><Tag color="default" className="m-0">Low</Tag></Select.Option>
            <Select.Option value="Medium"><Tag color="warning" className="m-0">Medium</Tag></Select.Option>
            <Select.Option value="High"><Tag color="error" className="m-0">High</Tag></Select.Option>
            <Select.Option value="Blocker"><Tag color="magenta" className="m-0">Blocker</Tag></Select.Option>
          </Select>
        </div>
        <Button 
          type="primary" 
          onClick={handleCreateBug} 
          loading={submitting}
          icon={<Plus className="w-4 h-4" />}
          className="bg-red-600 hover:bg-red-700 border-none w-full sm:w-auto"
        >
          Add Bug
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto p-6 custom-scrollbar">
        <div className="flex gap-6 h-full items-start">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
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
                <div className="opacity-90 scale-105 rotate-2">
                  <SortableBugCard bug={activeBug} onClick={() => {}} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Drawer for Bug Details */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <BugPlay className="w-5 h-5 text-red-500" />
            <span className="text-white/90 font-semibold">Bug Details</span>
          </div>
        }
        placement="right"
        width={400}
        onClose={() => setSelectedBug(null)}
        open={!!selectedBug}
        className="bg-[#080A0E] border-l border-white/10"
        headerStyle={{ backgroundColor: '#1C1F26', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        bodyStyle={{ padding: '24px', backgroundColor: '#080A0E' }}
        closeIcon={<span className="text-white/50 hover:text-white">✕</span>}
      >
        {selectedBug && (
          <div className="flex flex-col gap-6">
            <div>
              <div className="text-xs text-white/50 uppercase tracking-wider mb-2 font-semibold">Description</div>
              <p className="text-white/90 text-sm whitespace-pre-wrap leading-relaxed bg-white/[0.02] p-4 rounded-lg border border-white/[0.04]">
                {selectedBug.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
                <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Status</div>
                <div className="text-white/90 text-sm font-medium">{selectedBug.status}</div>
              </div>
              <div className="bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
                <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Severity</div>
                <Tag color={SEVERITY_COLORS[selectedBug.severity] || 'default'} className="m-0 uppercase font-bold text-[10px]">
                  {selectedBug.severity}
                </Tag>
              </div>
            </div>

            <div className="bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
               <div className="text-xs text-white/50 uppercase tracking-wider mb-1">URL</div>
               <a 
                  href={selectedBug.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-blue-400 hover:text-blue-300 break-all flex items-start gap-2"
                >
                  <ExternalLink className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {selectedBug.url}
                </a>
            </div>

            <div className="bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
              <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Reporter</div>
              <div className="text-white/90 text-sm flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center text-[10px] font-bold text-white">
                  {selectedBug.reporter_email.charAt(0).toUpperCase()}
                </div>
                {selectedBug.reporter_email}
              </div>
            </div>

            {/* Placeholder for Comments */}
            <div className="mt-4 border-t border-white/10 pt-6">
              <div className="text-xs text-white/50 uppercase tracking-wider mb-4 font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments ({selectedBug.comments?.length || 0})
              </div>
              {/* Future: Map over comments array here */}
              <p className="text-white/30 text-sm italic text-center py-4">
                Comments feature coming in next iteration.
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
