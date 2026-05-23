import React from 'react';

const SkeletonGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div 
          key={i} 
          className="rounded-2xl bg-zinc-900/40 border border-white/5 p-5 animate-pulse flex flex-col gap-4"
        >
          {/* Header Placeholder (Provider & Difficulty badges) */}
          <div className="flex flex-wrap gap-2">
            <div className="h-6 w-20 bg-white/5 rounded-full"></div>
            <div className="h-6 w-24 bg-white/5 rounded-full"></div>
          </div>
          
          {/* Title Placeholder */}
          <div className="space-y-2">
            <div className="h-5 w-3/4 bg-white/10 rounded"></div>
            <div className="h-5 w-1/2 bg-white/10 rounded"></div>
          </div>

          {/* Domain Placeholder */}
          <div className="h-4 w-1/3 bg-white/5 rounded mt-2"></div>

          {/* Divider */}
          <div className="h-px w-full bg-white/5 my-2"></div>

          {/* Metrics Footer (2 Columns) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-3 w-16 bg-white/5 rounded"></div>
              <div className="h-4 w-24 bg-white/10 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-16 bg-white/5 rounded"></div>
              <div className="h-4 w-24 bg-white/10 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonGrid;
