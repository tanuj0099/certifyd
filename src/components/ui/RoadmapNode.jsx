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
      <div className="px-5 py-3 shadow-lg rounded-xl border-2 border-slate-900 min-w-[220px] max-w-[260px] bg-white cursor-pointer flex flex-col items-center text-center relative z-10 transition-transform hover:scale-105">
        {connectionPoints}
        
        <div className="absolute -top-3.5 bg-slate-900 text-white text-sm font-medium text-slate-600 font-bold px-3 py-1 rounded-md uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
          <Target size={12} /> Core
        </div>
        
        <h3 className="text-sm font-extrabold text-slate-900 mt-2 mb-1">{data.label}</h3>
        <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Required</p>
      </div>
    );
  }

  // 2. STANDARD: The Grid Clusters (More compact for dense packing)
  return (
    <div className={`px-3 py-2.5 shadow-sm transition-all rounded-lg border min-w-[160px] max-w-[200px] bg-white cursor-pointer hover:shadow-md ${
      isCompleted ? 'border-orange-500' : 'border-slate-300 hover:border-slate-400'
    }`}>
      {connectionPoints}

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 mb-1">
          {isCompleted ? (
            <CheckCircle2 size={12} className="text-orange-500" />
          ) : (
            <Circle size={10} className="text-slate-300" />
          )}
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {data.status || 'Pending'}
          </span>
        </div>
        
        <span className="text-sm font-medium text-slate-600 font-bold text-slate-700 leading-tight">
          {data.label}
        </span>
      </div>
    </div>
  );
}
