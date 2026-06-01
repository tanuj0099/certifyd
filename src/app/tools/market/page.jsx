'use client';

import ToolPageWrapper from '@/components/ToolPageWrapper.jsx'
import LiveMarketPulse from '@/components/LiveMarketPulse.jsx'

export default function MarketPulsePage() {
  return (
    <ToolPageWrapper
      title="Live Market"
      subtitle="Pulse"
      description="Real-time salary movers, trending roles, and certification demand signals from Naukri + LinkedIn."
    >
      <LiveMarketPulse />
    </ToolPageWrapper>
  )
}
