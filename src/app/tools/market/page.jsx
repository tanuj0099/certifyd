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
      <div style={{
        marginTop: '28px',
        padding: '14px 18px',
        borderRadius: '10px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        lineHeight: 1.6
      }}>
        <strong>Data Attribution & Methodology Note:</strong> Market Pulse data is continuously aggregated and normalized from Indian job portals including Naukri, LinkedIn India, and AmbitionBox compensation surveys (updated Q1 2026). ROI estimates reflect average certification cost relative to entry-to-ceiling annual increments.
      </div>
    </ToolPageWrapper>
  )
}
