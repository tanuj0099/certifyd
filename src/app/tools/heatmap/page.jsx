'use client';

import { Suspense } from 'react';
import Heatmap from '@/components/Heatmap.jsx'
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx'

export default function HeatmapToolPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.1em' }}>
        LOADING...
      </div>
    }>
      <ToolPageWrapper
        title="City Demand"
        subtitle="Heatmap"
        description="See which certifications are in high demand in your city. Based on live job posting data from Naukri and LinkedIn India."
      >
        <Heatmap
          prefilledCity=""
          prefilledDomain=""
          certName=""
          resumeName=""
        />
      </ToolPageWrapper>
    </Suspense>
  )
}
