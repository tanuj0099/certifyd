import CertRadar from '../components/CertRadar.jsx'
import { MarketingFooter } from '../components/MarketingPageShell.jsx'

// CertRadar now manages its own full-page layout (header + stats + grid).
// We just need a thin shell for the footer.
export default function CertRadarTool() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <CertRadar />
      <MarketingFooter />
    </div>
  )
}
