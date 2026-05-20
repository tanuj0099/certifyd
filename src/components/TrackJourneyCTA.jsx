import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, CheckCircle, ArrowRight, LogIn } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'
import { useJourneyStore } from '../store/useJourneyStore.js'

const STORAGE_KEY = 'certify-roi-tracked-journeys'
const FB = 'var(--font-body)'
const FH = 'var(--font-head)'
const FM = 'var(--font-mono)'
const EMERALD = 'var(--linear-blue)'
const INDIGO = 'var(--linear-blue)'

function getTrackedJourneys() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveTrackedJourney(journey) {
  try {
    const list = getTrackedJourneys()
    const exists = list.some(
      (j) => j.certName === journey.certName && j.savedAt === journey.savedAt
    )
    if (!exists) {
      list.unshift(journey)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 10)))
    }
    return true
  } catch {
    return false
  }
}

function isAlreadyTracked(certName) {
  return getTrackedJourneys().some((j) => j.certName === certName)
}

export default function TrackJourneyCTA({ certName, salary, certCost, hikePercent, mode, breakEven, fiveYearGain, isStudent }) {
  const { user } = useAuth()
  const setMode = useJourneyStore((s) => s.setMode)
  const setTargetDomain = useJourneyStore((s) => s.setTargetDomain)

  const [saved, setSaved] = useState(false)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)

  useEffect(() => {
    setSaved(isAlreadyTracked(certName))
  }, [certName])

  if (!certName) return null

  const handleTrack = () => {
    if (!user) {
      setShowAuthPrompt(true)
      return
    }

    const journey = {
      certName,
      salary,
      certCost,
      hikePercent,
      mode: mode || 'professional',
      breakEven,
      fiveYearGain,
      savedAt: new Date().toISOString(),
    }

    if (saveTrackedJourney(journey)) {
      setSaved(true)
    }
  }

  const handleNavigate = () => {
    setMode(mode || 'professional')
    window.location.href = '/app'
  }

  return (
    <AnimatePresence mode="wait">
      {!saved ? (
        <motion.div
          key="cta"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          style={{
            marginTop: '16px',
            padding: '14px 16px',
            borderRadius: '14px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-accent)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: '180px' }}>
            <div style={{ fontFamily: FH, fontWeight: '700', fontSize: '13px', color: 'var(--text)', marginBottom: '2px', letterSpacing: '-0.01em' }}>
              Track this journey
            </div>
            <div style={{ fontFamily: FB, fontSize: '12px', color: 'var(--text-3)', lineHeight: '1.5' }}>
              {user
                ? 'Save this result. We\'ll notify you when salary data updates.'
                : 'Sign in to save this result and revisit it anytime.'}
            </div>
          </div>

          <motion.button
            onClick={handleTrack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: '10px 18px',
              borderRadius: '99px',
              background: 'var(--accent)',
              border: 'none',
              color: 'var(--bg)',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              fontFamily: FH,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              letterSpacing: '-0.01em',
              boxShadow: '0 4px 14px -2px var(--accent)',
            }}
          >
            <Bookmark size={13} />
            {user ? 'Save Result' : 'Sign In to Save'}
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          key="saved"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: '14px',
            background: EMERALD + '08',
            border: '1px solid ' + EMERALD + '25',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={14} color={EMERALD} />
            <span style={{ fontFamily: FB, fontSize: '12px', color: EMERALD, fontWeight: '600' }}>
              Journey tracked — {certName}
            </span>
          </div>

          <motion.button
            onClick={handleNavigate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: '7px 14px',
              borderRadius: '99px',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-3)',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: FM,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              letterSpacing: '0.03em',
            }}
          >
            View all tracked <ArrowRight size={10} />
          </motion.button>
        </motion.div>
      )}

      {/* Auth prompt overlay for guests */}
      <AnimatePresence>
        {showAuthPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={() => setShowAuthPrompt(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                padding: '28px 24px',
                borderRadius: '20px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                maxWidth: '360px',
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 20px 60px -10px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: INDIGO + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <LogIn size={20} color={INDIGO} />
              </div>
              <div style={{ fontFamily: FH, fontWeight: '800', fontSize: '18px', color: 'var(--text)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                Save your ROI result
              </div>
              <div style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.6', marginBottom: '20px' }}>
                Sign in to track this journey, get notified on salary updates, and revisit your saved results anytime.
              </div>

              {/* Trigger auth modal by dispatching custom event */}
              <motion.button
                onClick={() => {
                  setShowAuthPrompt(false)
                  window.dispatchEvent(new CustomEvent('open-auth-modal'))
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '99px',
                  background: 'var(--accent)',
                  border: 'none',
                  color: 'var(--bg)',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: FH,
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 20px -4px var(--accent)',
                }}
              >
                <LogIn size={15} />
                Sign in with Google
              </motion.button>

              <button
                onClick={() => setShowAuthPrompt(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '99px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-4)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontFamily: FB,
                }}
              >
                Maybe later
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  )
}
