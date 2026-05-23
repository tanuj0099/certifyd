import React from 'react'

export default function SkeletonLoader({ type = 'dashboard' }) {
  if (type === 'dashboard') {
    return (
      <div className="min-h-screen bg-transparent w-full p-6 pt-32 transition-colors">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-[220px_1fr_300px] gap-5">
          
          {/* Left Sidebar Skeleton */}
          <div className="hidden md:block">
            <div className="p-4 bg-zinc-100 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.05] animate-pulse rounded-2xl sticky top-[120px]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-zinc-200 dark:bg-white/[0.06] animate-pulse" />
                <div className="flex-1">
                  <div className="h-3 w-24 bg-zinc-200 dark:bg-white/[0.06] rounded-full mb-2 animate-pulse" />
                  <div className="h-2 w-16 bg-zinc-200 dark:bg-white/[0.06] rounded-full animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-9 w-full rounded-xl bg-zinc-200 dark:bg-white/[0.06] animate-pulse" />
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div>
            <div className="h-8 w-48 bg-zinc-200 dark:bg-white/[0.06] rounded-full mb-6 animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[90px] w-full bg-zinc-100 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.05] animate-pulse rounded-2xl" />
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden md:block">
            <div className="p-4 bg-zinc-100 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.05] animate-pulse rounded-2xl">
              <div className="h-3 w-20 bg-zinc-200 dark:bg-white/[0.06] rounded-full mb-4 animate-pulse" />
              <div className="h-8 w-12 bg-zinc-200 dark:bg-white/[0.06] rounded-xl mb-6 animate-pulse" />
              
              <div className="pt-4 border-t border-zinc-200 dark:border-white/[0.05] space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-[42px] w-full rounded-xl bg-zinc-200 dark:bg-white/[0.06] animate-pulse" />
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  }

  // Fallback for other types
  return (
    <div className="w-full h-full min-h-[200px] bg-transparent rounded-2xl border border-zinc-200/50 dark:border-white/[0.05] animate-pulse relative overflow-hidden transition-colors">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-100 dark:via-white/[0.04] to-transparent skeleton-shimmer" />
    </div>
  )
}
