import CertRadar from '../components/CertRadar.jsx'
import ToolPageWrapper from '../components/ToolPageWrapper.jsx'

export default function CertRadarTool() {
  return (
    <ToolPageWrapper
      title="Cert Radar"
      subtitle="Pipeline Intelligence"
      description="Browse the live certification catalogue collected by the pipeline, filtered by domain and provider."
    >
      <CertRadar />
    </ToolPageWrapper>
  )
}
