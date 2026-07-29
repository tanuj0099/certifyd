import React, { useState, useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { ArrowRight, ChevronDown, Terminal, Target } from 'lucide-react'

// Internal fonts to use
const F_HEAD = '"Geist", "Satoshi", "Inter", sans-serif'
const F_BODY = '"Inter", sans-serif'
const F_MONO = '"JetBrains Mono", "Fira Code", monospace'

// Single accent
const ACCENT = '#00E5A8'
const BG = '#050505'
const TEXT_P = '#E9E9E9'
const TEXT_S = '#888888'
const BORDER = 'rgba(255,255,255,0.1)'

function HeroV5({ onEnter, router, isMobile }) {
  // Mouse tracking for subtle grid movement
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const smoothX = useSpring(mouseX, { damping: 50, stiffness: 400 })
  const smoothY = useSpring(mouseY, { damping: 50, stiffness: 400 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e
      const x = (clientX / window.innerWidth - 0.5) * 15 // max shift 15px
      const y = (clientY / window.innerHeight - 0.5) * 15
      mouseX.set(x)
      mouseY.set(y)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  // Terminal card animation states
  const [stage, setStage] = useState(0)
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 800)
    const t2 = setTimeout(() => setStage(2), 1600)
    const t3 = setTimeout(() => setStage(3), 2200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div style={{
      position: 'relative',
      height: '100vh',
      minHeight: isMobile ? '100svh' : '760px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      background: BG,
      borderBottom: `1px solid ${BORDER}`,
      color: TEXT_P,
    }}>
      {/* ALMOST INVISIBLE GRID */}
      <motion.div
        style={{
          position: 'absolute', inset: -20,
          zIndex: 1, pointerEvents: 'none',
          x: smoothX, y: smoothY,
        }}
      >
        <svg width="100%" height="100%" style={{ opacity: 0.05 }}>
          <defs>
            <pattern id="dotGrid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#FFFFFF" />
            </pattern>
            <radialGradient id="fade" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="gridMask">
              <rect width="100%" height="100%" fill="url(#fade)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotGrid)" mask="url(#gridMask)" />
        </svg>
      </motion.div>

      {/* LEFT CONTENT (55%) */}
      <div style={{
        flex: isMobile ? 'none' : '0 0 55%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: isMobile ? '120px 24px 60px' : '0 8% 0 10%',
        position: 'relative',
        zIndex: 3,
        borderRight: isMobile ? 'none' : `1px solid ${BORDER}`,
      }}>
        {/* Subtle decorative marker */}
        {!isMobile && (
          <div style={{ position: 'absolute', top: '40px', left: '40px', display: 'flex', gap: '4px' }}>
            <div style={{ width: '4px', height: '4px', background: TEXT_S }} />
            <div style={{ width: '4px', height: '4px', background: TEXT_S }} />
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 style={{
            fontFamily: F_HEAD,
            fontWeight: '700',
            fontSize: isMobile ? 'clamp(2.5rem, 8vw, 3.5rem)' : 'clamp(4rem, 5.5vw, 6rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            marginBottom: '24px',
            color: TEXT_P,
          }}>
            Know the ROI<br />
            before you <span style={{ color: ACCENT }}>invest in the certificate.</span>
          </h1>

          <p style={{
            fontFamily: F_BODY,
            fontSize: isMobile ? '16px' : '18px',
            lineHeight: 1.6,
            color: TEXT_S,
            maxWidth: '480px',
            marginBottom: '40px',
          }}>
            Stop guessing which certification is worth your time. Get data-driven salary projections based on verified Indian career outcomes.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '60px' }}>
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={typeof onEnter === 'function' ? onEnter : () => router.push('/tools/roi')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '16px 32px',
                background: TEXT_P, color: BG,
                border: 'none', borderRadius: '16px',
                fontFamily: F_BODY, fontWeight: '600', fontSize: '15px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              Calculate my ROI <ArrowRight size={16} />
            </motion.button>
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/offer-analysis')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '16px 28px',
                background: 'transparent', color: TEXT_P,
                border: `1px solid ${BORDER}`, borderRadius: '16px',
                fontFamily: F_BODY, fontWeight: '500', fontSize: '15px',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = TEXT_S}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = BORDER}
            >
              Analyze Offer
            </motion.button>
          </div>

          {/* TRUST LAYER */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, auto)',
            gap: isMobile ? '24px' : '32px',
            paddingTop: '32px',
            borderTop: `1px solid ${BORDER}`,
          }}>
            {[
              { val: '10,000+', lbl: 'Outcomes' },
              { val: '₹72Cr+', lbl: 'Salary Tracked' },
              { val: '250+', lbl: 'Certifications' },
              { val: '89%', lbl: 'Accuracy' },
            ].map((stat, i) => (
              <div key={i}>
                <div style={{ fontFamily: F_MONO, fontSize: '16px', fontWeight: '500', color: TEXT_P, marginBottom: '4px' }}>
                  {stat.val}
                </div>
                <div style={{ fontFamily: F_BODY, fontSize: '12px', color: TEXT_S }}>
                  {stat.lbl}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* RIGHT CONTENT (45%) */}
      <div style={{
        flex: isMobile ? 'none' : '0 0 45%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '40px 24px 80px' : '0 40px',
        position: 'relative',
        zIndex: 3,
      }}>
        {/* TERMINAL UI */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            width: '100%', maxWidth: '440px',
            background: '#0A0A0A',
            border: `1px solid ${BORDER}`,
            borderRadius: '16px',
            padding: '32px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <Terminal size={18} color={TEXT_S} />
            <span style={{ fontFamily: F_MONO, fontSize: '12px', color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              ROI Projection Terminal
            </span>
          </div>

          {/* Cert Title */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ fontFamily: F_BODY, fontSize: '13px', color: TEXT_S, marginBottom: '8px' }}>
              Target Certification
            </div>
            <div style={{ fontFamily: F_MONO, fontSize: '20px', color: TEXT_P }}>
              AWS Solutions Architect
            </div>
          </div>

          {/* Data Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${BORDER}`, paddingBottom: '16px' }}>
              <span style={{ fontFamily: F_BODY, fontSize: '14px', color: TEXT_S }}>Cost</span>
              <span style={{ fontFamily: F_MONO, fontSize: '14px', color: TEXT_P }}>₹22,000</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${BORDER}`, paddingBottom: '16px' }}>
              <span style={{ fontFamily: F_BODY, fontSize: '14px', color: TEXT_S }}>Average Salary Increase</span>
              <span style={{ fontFamily: F_MONO, fontSize: '14px', color: stage >= 1 ? ACCENT : TEXT_S }}>
                {stage >= 1 ? '+38%' : '...'}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${BORDER}`, paddingBottom: '16px' }}>
              <span style={{ fontFamily: F_BODY, fontSize: '14px', color: TEXT_S }}>Break-even</span>
              <span style={{ fontFamily: F_MONO, fontSize: '14px', color: TEXT_P }}>
                {stage >= 2 ? '7 months' : '...'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${BORDER}`, paddingBottom: '16px' }}>
              <span style={{ fontFamily: F_BODY, fontSize: '14px', color: TEXT_S }}>Confidence</span>
              <span style={{ fontFamily: F_MONO, fontSize: '14px', color: TEXT_P }}>
                {stage >= 3 ? '89%' : '...'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontFamily: F_BODY, fontSize: '14px', color: TEXT_P, fontWeight: '500' }}>ROI Score</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: F_MONO, fontSize: '18px', color: ACCENT, fontWeight: '600' }}>
                  {stage >= 3 ? '9.1' : '-.-'}
                </span>
                <span style={{ fontFamily: F_MONO, fontSize: '14px', color: TEXT_S }}>/10</span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div style={{ marginTop: '32px', height: '2px', background: '#1A1A1A', width: '100%' }}>
            <motion.div 
              initial={{ width: '0%' }}
              animate={{ width: stage === 0 ? '10%' : stage === 1 ? '40%' : stage === 2 ? '70%' : '100%' }}
              transition={{ duration: 0.8 }}
              style={{ height: '100%', background: ACCENT }}
            />
          </div>
        </motion.div>
      </div>

      {/* SCROLL NUDGE */}
      {!isMobile && (
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', bottom: '32px', left: '10%',
            display: 'flex', alignItems: 'center', gap: '8px',
            fontFamily: F_MONO, fontSize: '10px', letterSpacing: '0.1em',
            textTransform: 'uppercase', color: TEXT_S,
            zIndex: 10,
          }}
        >
          <ChevronDown size={14} /> Scroll to explore
        </motion.div>
      )}
    </div>
  )
}

export default HeroV5
