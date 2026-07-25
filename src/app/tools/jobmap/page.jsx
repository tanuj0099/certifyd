'use client';

import { Suspense } from 'react';
import JobCertMap from '@/components/JobCertMap.jsx'
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx'

export default function JobMapToolPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.1em' }}>
        LOADING...
      </div>
    }>
      <ToolPageWrapper
        title="Certification"
        subtitle="to Job Map"
        description="See which jobs and roles value each certification. Filter by role, salary range, and company type."
      >
        <JobCertMap />
      </ToolPageWrapper>
    </Suspense>
  )
}
