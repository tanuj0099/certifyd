import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Target, CheckCircle2, Circle } from 'lucide-react';

export default function RoadmapNode({ data }: { data: any }) {
  const isCompleted = data.status === 'done';
  const variant = data.variant || 'standard';

  // 1. CHECKPOINT: Sleek, high-contrast black/slate core nodes
  // 1. CHECKPOINT: Sleek, high-contrast black/slate core nodes
  if (variant === 'checkpoint') {
    return (
      <div className="px-6 py-4 shadow-lg rounded-xl border-2 border-slate-900 min-w-[240px] max-w-[280px] bg-white cursor-pointer flex flex-col items-center text-center relative z-10 transition-transform hover:scale-105">
        
        {/* Main Spine Connections (Visible) */}
        <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-slate-900 !border-0" />
        <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-slate-900 !border-0" />
        
        {/* MAGIC FIX: Invisible Side Connections for the Ribs */}
        <Handle type="source" position={Position.Left} id="left" className="!hidden" />
        <Handle type="source" position={Position.Right} id="right" className="!hidden" />
        
        <div className="absolute -top-3.5 bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
          <Target size={12} /> Core
        </div>
        
        <h3 className="text-base font-extrabold text-slate-900 mt-2 mb-1">{data.label}</h3>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Required</p>
        
      </div>
    );
  }
  // 2. STANDARD: Clean, subtle secondary nodes
  return (
    <div className={`px-4 py-3 shadow-sm transition-all rounded-lg border min-w-[200px] max-w-[240px] bg-white cursor-pointer hover:shadow-md ${
      isCompleted ? 'border-emerald-500' : 'border-slate-300 hover:border-slate-400'
    }`}>
      {/* We use Left/Right handles for standard nodes to make the layout flow outward cleanly */}
      <Handle type="target" position={data.side === 'left' ? Position.Right : Position.Left} className="!w-2 !h-2 !bg-slate-300 !border-0" />

      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-1.5">
          {isCompleted ? (
            <CheckCircle2 size={14} className="text-emerald-500" />
          ) : (
            <Circle size={12} className="text-slate-300" />
          )}
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {data.status || 'Pending'}
          </span>
        </div>
        
        <span className="text-sm font-bold text-slate-700 leading-tight">
          {data.label}
        </span>
      </div>

      {/* Outward handles for deep dives (if they exist) */}
      <Handle type="source" position={data.side === 'left' ? Position.Left : Position.Right} className="!w-2 !h-2 !bg-slate-300 !border-0" />
    </div>
  );
}