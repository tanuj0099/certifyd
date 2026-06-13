'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CertCompare from '@/components/CertCompare.jsx'
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx'

function CompareContent() {
  const searchParams = useSearchParams();
  const cert1 = searchParams.get('cert1') || '';
  const cert2 = searchParams.get('cert2') || '';

  return (
    <ToolPageWrapper
      title="Compare"
      subtitle="Certifications"
      description="Compare any two certifications side-by-side. See salary impacts, job demand, study time, and cost for each cert."
    >
      <CertCompare salary={8} prefilledCertA={cert1} prefilledCertB={cert2} />
    </ToolPageWrapper>
  )
}

export default function CompareToolPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        letterSpacing: '0.1em',
      }}>
        LOADING...
      </div>
    }>
      <CompareContent />
    </Suspense>
  )
}
