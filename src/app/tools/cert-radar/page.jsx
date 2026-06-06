'use client';

import { Suspense } from 'react';
import CertRadar from '@/components/CertRadar.jsx';
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx';

// CertRadar uses useSearchParams which requires a Suspense boundary.
// NOTE: data-theme is intentionally NOT set here — it is managed globally by
// ThemeProvider on document.documentElement. Hardcoding data-theme="dark"
// would override the user's theme preference.
function CertRadarContent() {
  return (
    <ToolPageWrapper
      title="Certification Radar"
      subtitle="Radar"
      description="Discover and analyze premium credentials to accelerate your career growth."
    >
      <CertRadar />
    </ToolPageWrapper>
  );
}

export default function CertRadarTool() {
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
      <CertRadarContent />
    </Suspense>
  );
}
