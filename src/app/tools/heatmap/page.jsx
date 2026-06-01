'use client';

import Heatmap from '@/components/Heatmap.jsx'
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx'

export default function HeatmapToolPage() {
  return (
    <ToolPageWrapper
      title="City Demand"
      subtitle="Heatmap"
      description="See which certifications are in high demand in your city. Based on live job posting data from Naukri and LinkedIn India."
    >
      <Heatmap
        prefilledCity=""
        prefilledDomain=""
        certName=""
        resumeName=""
      />
    </ToolPageWrapper>
  )
}
