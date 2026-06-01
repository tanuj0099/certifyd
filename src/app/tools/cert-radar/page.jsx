'use client';

import CertRadar from '@/components/CertRadar.jsx'
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx'

export default function CertRadarTool() {
  return (
    <ToolPageWrapper
      title="Certification"
      subtitle="Radar"
      description="Discover and analyze premium credentials to accelerate your career growth."
    >
      <CertRadar />
    </ToolPageWrapper>
  )
}
