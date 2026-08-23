'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Target, CheckCircle2, Circle } from 'lucide-react';

export default function RoadmapNode({ data }) {
  const isCompleted = data.status === 'done';
  const variant = data.variant || 'standard';

  // Invisible 360-degree connection points for flawless auto-routing
  const connectionPoints = (
    <>
      <Handle type="target" position={Position.Top} id="t-top" className="opacity-0" />
      <Handle type="target" position={Position.Bottom} id="t-bottom" className="opacity-0" />
      <Handle type="target" position={Position.Left} id="t-left" className="opacity-0" />
      <Handle type="target" position={Position.Right} id="t-right" className="opacity-0" />
      
      <Handle type="source" position={Position.Top} id="s-top" className="opacity-0" />
      <Handle type="source" position={Position.Bottom} id="s-bottom" className="opacity-0" />
      <Handle type="source" position={Position.Left} id="s-left" className="opacity-0" />
      <Handle type="source" position={Position.Right} id="s-right" className="opacity-0" />
    </>
  );

  // 1. CHECKPOINT: The Main Spine (Slightly larger)
  if (variant === 'checkpoint') {
    return (
      <div className="px-5 py-3 shadow-lg rounded-xl border-2 min-w-[220px] max-w-[260px] cursor-pointer flex flex-col items-center text-center relative z-10 transition-transform hover:scale-105"
           style={{ background: 'var(--bg-alt)', borderColor: 'var(--border)' }}>
        {connectionPoints}
        
        <div className="absolute -top-3.5 text-sm font-medium font-bold px-3 py-1 rounded-md uppercase tracking-widest flex items-center gap-1.5 shadow-sm"
             style={{ background: 'var(--bg)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
          <Target size={12} /> Core
        </div>
        
        <h3 className="text-sm font-extrabold mt-2 mb-1" style={{ color: 'var(--text)' }}>{data.label}</h3>
        <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>Required</p>
      </div>
    );
  }

  // 2. STANDARD: The Grid Clusters (More compact for dense packing)
  return (
    <div className={`px-3 py-2.5 shadow-sm transition-all rounded-lg border min-w-[160px] max-w-[200px] cursor-pointer hover:shadow-md ${
      isCompleted ? 'border-orange-500' : 'hover:border-slate-400'
    }`} style={{ background: 'var(--bg-alt)', borderColor: isCompleted ? undefined : 'var(--border)' }}>
      {connectionPoints}

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 mb-1">
          {isCompleted ? (
            <CheckCircle2 size={12} className="text-orange-500" />
          ) : (
            <Circle size={10} style={{ color: 'var(--border)' }} />
          )}
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>
            {data.status || 'Pending'}
          </span>
        </div>
        
        <span className="text-sm font-medium font-bold leading-tight" style={{ color: 'var(--text-2)' }}>
          {data.label}
        </span>
      </div>
    </div>
  );
}
