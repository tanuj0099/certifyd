'use client';

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import ResumeAnalyzer from '@/components/ResumeAnalyzer.jsx'
import { ModePill } from '@/components/ModeSelector.jsx'
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx'
import { AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

import { useJourneyStore } from '@/store/useJourneyStore.js'

const T = { duration: 0.32, ease: [0.4, 0, 0.2, 1] }

export default function ResumeToolPage() {
  const mode = useJourneyStore(s => s.mode)
  const modeLocked = useJourneyStore(s => s.modeLocked)
  const setMode = useJourneyStore(s => s.setMode)
  const resetMode = useJourneyStore(s => s.resetMode)
  const router = useRouter()

  useEffect(() => {
    if (!modeLocked) {
      const currentPath = window.location.pathname + window.location.search;
      router.push('/choose-path?returnTo=' + encodeURIComponent(currentPath));
    }
  }, [modeLocked, router]);

  const handleModeReset = () => {
    resetMode()
  }

  const handleCertSelected = (certName, city, domain, name) => {
    import('@/store/useJourneyStore.js').then(({ useJourneyStore }) => {
      useJourneyStore.getState().setResumeContext({ certName, city, domain, name })
      useJourneyStore.getState().setActiveTab('calculator')
      router.push('/tools/roi')
    })
  }

  return (
    <ToolPageWrapper
      title="AI Resume"
      subtitle="Analysis"
      description="Upload your resume and get personalized certification recommendations based on your experience and career goals."
    >
      {/* Mode Selector (Now a separate page, redirect happens above) */}

      {/* Tool Content */}
      {modeLocked && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={T}
        >
          <div style={{ marginBottom: '24px' }}>
            <ModePill mode={mode} onReset={handleModeReset} />
          </div>

          <ResumeAnalyzer
            mode={mode}
            onCertSelected={handleCertSelected}
          />
        </motion.div>
      )}
    </ToolPageWrapper>
  )
}
