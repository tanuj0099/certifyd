'use client';

import React from 'react';
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx';
import QuickCTCCheck from '@/components/QuickCTCCheck.jsx';

export default function QuickCheckPage() {
  return (
    <ToolPageWrapper
      title="Quick CTC Check"
      subtitle="Benchmark"
      description="Compare your compensation instantly against verified Indian tech salary benchmarks without uploading any document."
    >
      <QuickCTCCheck />
    </ToolPageWrapper>
  );
}
