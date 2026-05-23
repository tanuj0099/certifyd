import React from 'react'

export default function SkeletonLoader({ type = 'dashboard' }) {
  if (type === 'dashboard') {
    return (
      <div className="min-h-screen bg-[#010102] p-6 pt-32 w-full">
        {/* Top Navigation Bar Shimmer */}
        <div className="h-12 w-full bg-white/[0.02] border-b border-white/[0.04] rounded-lg mb-8 animate-pulse overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />
        </div>
        
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Metric Hub Column */}
          <div className="h-[300px] bg-white/[0.02] border border-white/[0.06] rounded-2xl animate-pulse overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />
          </div>

          {/* Multi-Axis Chart Bento Card Core Frame */}
          <div className="h-[400px] md:col-span-2 bg-white/[0.015] border border-white/[0.06] rounded-2xl relative overflow-hidden animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />
          </div>
        </div>
      </div>
    )
  }

  // Fallback for other types
  return (
    <div className="w-full h-full min-h-[200px] bg-[#010102] rounded-2xl border border-white/[0.06] animate-pulse relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />
    </div>
  )
}
