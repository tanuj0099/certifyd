'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useJourneyStore } from '@/store/useJourneyStore.js'
import BurnRate from '@/components/BurnRate.jsx'
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx'

export default function DashboardPage() {
  const router = useRouter()
  const certName = useJourneyStore(s => s.certName)
  const selectedCert = useJourneyStore(s => s.selectedCert)
  const breakEvenMonths = 6 // Ideally we'd persist the ROI results, but we can fall back to 6

  // If no cert is selected, they probably refreshed or navigated directly without selecting.
  // We can let them stay or prompt them to go back to ROI calculator.
  if (!certName) {
    return (
      <ToolPageWrapper title="Your" subtitle="Dashboard" description="Track your certification progress.">
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
          <p>No certification selected.</p>
          <button 
            onClick={() => router.push('/tools/roi')}
            style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--accent)', color: 'var(--bg)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Find a Certification
          </button>
        </div>
      </ToolPageWrapper>
    )
  }

  return (
    <ToolPageWrapper 
      title="Study" 
      subtitle="Dashboard" 
      description={`Track your progress for ${certName}`}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <BurnRate
            certName={certName}
            breakEvenMonths={breakEvenMonths}
          />
        </motion.div>
      </div>
    </ToolPageWrapper>
  )
}
