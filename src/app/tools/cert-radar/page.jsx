'use client';

import { Suspense } from 'react';
import CertRadar from '@/components/CertRadar.jsx';
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx';

// CertRadar uses useSearchParams which requires a Suspense boundary
function CertRadarContent() {
  return (
    <div data-theme="dark" className="bg-[var(--bg)] text-[var(--text)]">
      <ToolPageWrapper
        title="Certification"
        subtitle="Radar"
        description="Discover and analyze premium credentials to accelerate your career growth."
      >
        <CertRadar />
      </ToolPageWrapper>
    </div>
  );
}

export default function CertRadarTool() {
  return (
    <Suspense fallback={
      <div data-theme="dark" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
        LOADING...
      </div>
    }>
      <CertRadarContent />
    </Suspense>
  );
}
