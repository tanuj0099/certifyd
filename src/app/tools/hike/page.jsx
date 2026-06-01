'use client';

import HikeVerifier from '@/components/HikeVerifier.jsx'
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx'

export default function HikeVerifierToolPage() {
  return (
    <ToolPageWrapper
      title="Salary Hike"
      subtitle="Verifier"
      description="Verify if the salary increase you're offered after getting a certification aligns with market standards."
    >
      <HikeVerifier />
    </ToolPageWrapper>
  )
}
