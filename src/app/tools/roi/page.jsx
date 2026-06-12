'use client';
import { Suspense } from 'react';
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx'
import MasterWorkspace from '@/components/MasterWorkspace.jsx'

export default function ROIToolPage() {
  return (
    <ToolPageWrapper
      title="ROI"
      subtitle="Calculator"
      description="Get precise financial projections for any certification. Calculate break-even timelines, 5-year gains, and salary impacts with real India data."
    >
      <div id="workspace">
        <Suspense fallback={<div className="p-8 text-center text-[var(--text-3)]">Loading workspace...</div>}>
          <MasterWorkspace />
        </Suspense>
      </div>
    </ToolPageWrapper>
  )
}
