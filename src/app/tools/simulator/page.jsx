'use client';

import { Suspense } from 'react';
import CareerSimulator from '@/components/CareerSimulator.jsx'
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx'

export default function SimulatorToolPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.1em' }}>
        LOADING...
      </div>
    }>
      <ToolPageWrapper
        title="Career"
        subtitle="Path Simulator"
        description="Simulate multi-certification career paths. See how stacking certifications impacts your lifetime earning potential."
      >
        <CareerSimulator initialSalary={8} />
      </ToolPageWrapper>
    </Suspense>
  )
}
