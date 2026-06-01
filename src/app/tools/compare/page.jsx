'use client';

import CertCompare from '@/components/CertCompare.jsx'
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx'

export default function CompareToolPage() {
  return (
    <ToolPageWrapper
      title="Compare"
      subtitle="Certifications"
      description="Compare any two certifications side-by-side. See salary impacts, job demand, study time, and cost for each cert."
    >
      <CertCompare salary={8} prefilledCert="" />
    </ToolPageWrapper>
  )
}
