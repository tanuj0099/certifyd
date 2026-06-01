'use client';

import CareerSimulator from '@/components/CareerSimulator.jsx'
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx'

export default function SimulatorToolPage() {
  return (
    <ToolPageWrapper
      title="Career"
      subtitle="Path Simulator"
      description="Simulate multi-certification career paths. See how stacking certifications impacts your lifetime earning potential."
    >
      <CareerSimulator initialSalary={8} />
    </ToolPageWrapper>
  )
}
