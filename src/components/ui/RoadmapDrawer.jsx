import React from 'react';

export default function RoadmapDrawer({ isOpen, onClose, nodeData }) {
  if (!isOpen || !nodeData) return null;

  return (
    <aside
      className="absolute right-0 top-0 z-20 h-full w-full max-w-md border-l border-slate-200 bg-white shadow-xl"
      aria-label="Roadmap node details"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-950">
          {nodeData.label || 'Roadmap item'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
          aria-label="Close roadmap details"
        >
          Close
        </button>
      </div>
      <div className="h-[calc(100%-65px)] overflow-y-auto px-5 py-4">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700">
          {nodeData.description || 'No detailed content available yet.'}
        </pre>
      </div>
    </aside>
  );
}
