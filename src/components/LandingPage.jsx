import { motion, useScroll, AnimatePresence } from 'framer-motion'
import React, { useRef, useState, useEffect } from 'react'
import { ArrowRight, ChevronDown, BarChart2, CheckCircle2 } from 'lucide-react'
import FeaturesBentoGrid from './FeaturesBentoGrid.jsx'
import { useJourneyStore } from '../store/useJourneyStore.js'
import { THEMES, useThemeContext } from './SharedUI.jsx'
import { useRouter } from 'next/navigation'
import SEOHead from './SEOHead.jsx'

function useTheme() {
  return useThemeContext()
}

// 
// HOOKS
// 
function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => {
    const c = () => setM(window.innerWidth < 768)
    c(); window.addEventListener('resize', c)
    return () => window.removeEventListener('resize', c)
  }, [])
  return m
}

// ---------------------------------------------------------
// TOKENS
// ---------------------------------------------------------
const F_SERIF = "var(--font-serif)";
const F_SANS = "var(--font-sans)";
const F_MONO = "var(--font-mono)";

const RISE = {
  hidden: { y: 28, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
}

// ---------------------------------------------------------
// PRIMITIVES
// ---------------------------------------------------------
function CrosshairIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <line x1="7" y1="1" x2="7" y2="13" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <line x1="1" y1="7" x2="13" y2="7" stroke={color} strokeWidth="0.8" opacity="0.5" />
    </svg>
  )
}

function CountUp({ end, prefix = '', suffix = '', duration = 1.8 }) {
  const [count, setCount] = useState(0)
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (!on) return
    const v = parseFloat(String(end).replace(/[^0-9.]/g, ''))
    const frames = Math.round(duration * 60)
    let f = 0
    const t = setInterval(() => {
      f++
      setCount(v * (1 - Math.pow(1 - f / frames, 3)))
      if (f >= frames) { setCount(v); clearInterval(t) }
    }, 1000 / 60)
    return () => clearInterval(t)
  }, [on, end, duration])
  return <motion.span onViewportEnter={() => setOn(true)}>{prefix}{count.toLocaleString('en-IN', { maximumFractionDigits: String(end).includes('.') ? 1 : 0 })}{suffix}</motion.span>
}

function PillBtn({ onClick = () => {}, children, large, primary = false }) {
  const [h, setH] = useState(false)
  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      whileTap={{ scale: 0.97 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        padding: large ? '0 30px' : '0 22px',
        height: large ? '54px' : '44px',
        background: primary ? 'var(--text)' : 'var(--bg-elevated)',
        border: primary ? '1px solid var(--text)' : '1px solid var(--border)',
        borderRadius: '9999px',
        fontSize: large ? '12px' : '11px',
        fontFamily: F_SANS, fontWeight: '600',
        letterSpacing: '0.07em', textTransform: 'uppercase',
        cursor: 'pointer',
        color: primary ? 'var(--bg)' : 'var(--text)',
        boxShadow: primary ? `0 4px 14px transparent` : `0 2px 8px transparent`,
        transition: 'all 0.3s ease',
      }}
    >
      {children}
    </motion.button>
  )
}


function GlassPill({ children }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '10px',
      padding: '7px 16px', borderRadius: '9999px',
      background: 'var(--bg-alt)',
      border: '1px solid var(--border)',
    }}>
      {children}
    </div>
  )
}

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""
// STORY SECTION
// """""""""""""""""""""""""""""""""""""""""""""""""""""""""
function StorySection({ id = '', title = '', children, bg = '', noBorderTop = false }) {
  const C = useTheme()
  const isMobile = useIsMobile()
  return (
    <div style={{
      position: 'relative',
      padding: isMobile ? '16px' : '32px 24px',
      background: bg || C.bg,
      borderTop: noBorderTop ? 'none' : `1px solid ${C.border}`,
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        background: 'transparent',
        border: 'none',
        borderRadius: 0,
        overflow: 'visible'
      }}>
        {!isMobile && (
          <div style={{ width: '140px', flexShrink: 0, borderRight: `1px solid ${C.border}`, position: 'relative' }}>
            <div style={{ position: 'sticky', top: '120px', padding: '32px 0', display: 'flex', alignItems: 'center', flexDirection: 'column', height: '360px' }}>
              <CrosshairIcon color={C.text4} />
              <div style={{ width: '1px', flex: 1, background: C.border, margin: '16px 0' }} />
              <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontFamily: F_MONO, fontSize: '11px', color: C.text3, letterSpacing: '0.18em' }}>
                <span style={{ color: C.gold, fontWeight: '700' }}>{id}</span>{' '}
                <span style={{ opacity: 0.5 }}>//</span>{' '}
                {title}
              </div>
              <div style={{ width: '1px', flex: 1, background: C.border, margin: '16px 0' }} />
              <CrosshairIcon color={C.text4} />
            </div>
          </div>
        )}
        <div style={{ flex: 1, padding: isMobile ? '32px 16px' : '64px 4vw', position: 'relative', overflow: 'visible' }}>
          {isMobile && (
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: F_MONO, fontSize: '11px', color: C.gold, fontWeight: '700', letterSpacing: '0.12em' }}>{id}</span>
              <div style={{ height: '1px', flex: 1, background: C.border }} />
              <span style={{ fontFamily: F_MONO, fontSize: '11px', color: C.text3, letterSpacing: '0.12em' }}>{title}</span>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""
// TRUST STRIP
// """""""""""""""""""""""""""""""""""""""""""""""""""""""""
function TrustStrip() {
  const C = useTheme()
  const isMobile = useIsMobile()
  const items = [
    { tag: 'SYS.CLOUD', text: 'AWS cert holders earn ₹2.4L more/yr in Bangalore' },
    { tag: 'SYS.DEMAND', text: '2,400+ cloud roles open on Naukri right now' },
    { tag: 'SYS.FINANCE', text: 'Average PMP payback period: 7 months' },
    { tag: 'SYS.DATA', text: 'Google Analytics  ₹18K invested  ₹3.2L annual gain' },
    { tag: 'SYS.DEVOPS', text: 'CKA Kubernetes: highest ROI cert in India 2026' },
  ]
  return (
    <div style={{ borderBottom: `1px solid ${C.border}`, background: C.bg, position: 'relative', zIndex: 10, height: '48px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: C.bg, zIndex: 11, borderRight: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 20px', boxShadow: `20px 0 20px -10px ${C.bg}` }}>
        <span style={{ fontFamily: F_MONO, fontSize: '11px', color: C.text3, letterSpacing: '0.18em' }}>MARKET_DATA</span>
      </div>
      {/*
        BEFORE: paddingLeft: isMobile ? '140px' : '150px'
        On a 375px phone, 140px left-pad leaves only 235px for the ticker
        content - the "MARKET_DATA" label badge is ~130px wide, so the
        ticker text was clipping behind it and causing a horizontal overflow.
        FIX: reduce to 120px on mobile so the ticker has enough room.
      */}
      <div style={{ flex: 1, paddingLeft: isMobile ? '120px' : '150px' }}>
        <motion.div animate={{ x: ['0%', '-50%'] }} transition={{ duration: 45, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex', width: 'max-content' }}>
          {[...items, ...items, ...items].map((item, i) => (
            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', height: '48px', borderRight: `1px solid ${C.border}`, padding: '0 36px' }}>
              <span style={{ fontFamily: F_MONO, fontSize: '11px', color: C.text3, marginRight: '14px', letterSpacing: '0.08em' }}>[{item.tag}]</span>
              <span style={{ fontFamily: F_SANS, fontSize: '13px', color: C.text2, letterSpacing: '0.01em', fontWeight: '500' }}>{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

// 
// CERT INTELLIGENCE - metallic border + swoosh
// 
function CertAssembly() {
  const C = useTheme()
  const isMobile = useIsMobile()
  const trackRef = useRef(null)
  const { scrollY } = useScroll()
  const [prog, setProg] = useState(0)
  const [showSwoosh, setShowSwoosh] = useState(false)

  useEffect(() => {
    const update = () => {
      const el = trackRef.current; if (!el) return
      const rect = el.getBoundingClientRect()
      const total = el.offsetHeight - window.innerHeight
      if (total <= 0) return
      setProg(Math.max(0, Math.min(1, -rect.top / total)))
    }
    const unsub = scrollY.on('change', update)
    update()
    return unsub
  }, [scrollY])

  useEffect(() => {
    if (!isMobile && prog > 0.86 && !showSwoosh) {
      const timer = setTimeout(() => setShowSwoosh(true), 200)
      return () => clearTimeout(timer)
    }
  }, [prog, showSwoosh, isMobile])

  const rm = (p, a, b, c, d) => c + (d - c) * Math.max(0, Math.min(1, (p - a) / (b - a)))
  const p8 = rm(prog, 0, 0.8, 0, 1)

  const l1Desktop = `perspective(1200px) translateZ(${rm(p8, 0, 1, -220, 0)}px) translateY(${rm(p8, 0, 1, -55, 0)}px) rotateY(${rm(p8, 0, 1, 26, 0)}deg) rotateX(${rm(p8, 0, 1, 11, 0)}deg)`
  const l2Desktop = `perspective(1200px) translateZ(${rm(p8, 0, 1, 220, 0)}px) translateY(${rm(p8, 0, 1, 55, 0)}px) rotateY(${rm(p8, 0, 1, -20, 0)}deg) rotateX(${rm(p8, 0, 1, -8, 0)}deg)`

  const certScale = prog < 0.8 ? rm(prog, 0, 0.8, 0.64, 1.0) : rm(prog, 0.8, 1.0, 1.0, 0.9)
  const certOpacity = prog < 0.05 ? rm(prog, 0, 0.05, 0, 1) : prog > 0.9 ? rm(prog, 0.9, 1.0, 1, 0.4) : 1
  const hintOp = prog > 0.16 ? 0 : prog > 0.06 ? rm(prog, 0.06, 0.16, 1, 0) : 1
  const assembledOp = rm(prog, 0.8, 0.88, 0, 1)

  const cardW = isMobile ? 'min(320px, 90vw)' : 'min(440px, 76vw)'

  if (isMobile) {
    return (
      <div style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '48px 24px 56px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.94 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: cardW }}
        >
          <div style={{ fontFamily: F_MONO, fontSize: '10px', color: C.text4, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '20px', textAlign: 'center' }}>
            // CERT INTELLIGENCE
          </div>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '480/340', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${C.borderMid}`, background: C.certBg, boxShadow: '0 24px 64px rgba(0,0,0,0.28)' }}>
            <svg viewBox="0 0 480 340" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}>
              <defs>
                <linearGradient id="metalGradM" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%"   stopColor="#333" />
                  <stop offset="35%"  stopColor="#aaa" />
                  <stop offset="55%"  stopColor="#b0b0b0" />
                  <stop offset="100%" stopColor="#444" />
                </linearGradient>
              </defs>
              <rect x="1.5" y="1.5" width="477" height="337" fill="none" stroke="url(#metalGradM)" strokeWidth="1.5" />
              <rect x="12" y="12" width="456" height="316" fill="none" stroke="#2a2a2a" strokeWidth="0.8" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 24px' }}>
              <div style={{ fontFamily: F_MONO, fontSize: '10px', color: C.gold, letterSpacing: '0.18em', marginBottom: '12px', textTransform: 'uppercase' }}>
                Certify  Cert Intelligence
              </div>
              <div style={{ fontFamily: F_SERIF, fontWeight: '400', fontSize: '1.5rem', color: C.text, marginBottom: '4px', textAlign: 'center', lineHeight: 1.1 }}>
                Route Briefing
              </div>
              <div style={{ fontFamily: F_SANS, fontSize: '12px', color: C.text3, marginBottom: '24px', textAlign: 'center' }}>
                Personalised  India 2026
              </div>
              <div style={{ display: 'flex', gap: '24px', marginBottom: '20px', justifyContent: 'center', width: '100%' }}>
                {[
                  { l: 'PAYBACK',   v: '6 MO',    c: C.text },
                  { l: '5-YR GAIN', v: '₹14.2L',  c: C.gold },
                  { l: 'DELTA',     v: '+35%',     c: C.text },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: F_MONO, fontSize: '10px', color: C.text3, letterSpacing: '0.1em', marginBottom: '5px' }}>{s.l}</div>
                    <div style={{ fontFamily: F_MONO, fontSize: '1.1rem', color: s.c, fontWeight: '600', letterSpacing: '-0.02em' }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ width: '70%', height: '1px', background: C.borderMid, marginBottom: '12px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={11} color={C.gold} />
                <span style={{ fontFamily: F_MONO, fontSize: '10px', color: C.text3, letterSpacing: '0.08em' }}>
                  CALCULATED FROM YOUR INPUTS
                </span>
              </div>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{ marginTop: '16px', textAlign: 'center' }}
          >
            <div style={{ fontFamily: F_MONO, fontSize: '11px', color: C.text4, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
               Analysis complete
            </div>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div ref={trackRef} style={{
      height: '280vh',
      position: 'relative',
      borderBottom: `1px solid ${C.border}`,
      background: C.bg,
    }}>
      <div style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', height: '100%' }}>
          <div style={{ position: 'absolute', left: '140px', top: 0, bottom: 0, width: '1px', background: C.border }} />
        </div>
      </div>

      <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: C.bg, opacity: 0.95 }} />

        <div style={{ position: 'relative', zIndex: 4 }}>
          <div style={{ transform: `scale(${certScale})`, opacity: certOpacity }}>
            <div style={{ position: 'relative', width: cardW, height: `calc(${cardW} / 1.414)`, transformStyle: 'preserve-3d' }}>

              <div style={{ position: 'absolute', inset: 0, transform: l1Desktop }}>
                <svg viewBox="0 0 480 340" width="100%" height="100%" style={{ position: 'absolute', inset: 0, display: 'block' }}>
                  <defs>
                    <linearGradient id="metalGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%"   stopColor="#333" />
                      <stop offset="18%"  stopColor="#777" />
                      <stop offset="35%"  stopColor="#aaa" />
                      <stop offset="48%"  stopColor="#c8c8c8" />
                      <stop offset="55%"  stopColor="#b0b0b0" />
                      <stop offset="70%"  stopColor="#888" />
                      <stop offset="85%"  stopColor="#666" />
                      <stop offset="100%" stopColor="#444" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="480" height="340" fill={C.certBg} />
                  <rect x="1.5" y="1.5" width="477" height="337" fill="none" stroke="url(#metalGrad)" strokeWidth="1.5" />
                  <rect x="12" y="12" width="456" height="316" fill="none" stroke="#2a2a2a" strokeWidth="0.8" />
                </svg>
              </div>

              <div style={{ position: 'absolute', inset: 0, transform: l2Desktop, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
                <div style={{ fontFamily: F_MONO, fontSize: '11px', color: C.gold, letterSpacing: '0.18em', marginBottom: '14px', textTransform: 'uppercase' }}>Certify  Cert Intelligence</div>
                <div style={{ fontFamily: F_SERIF, fontWeight: '400', fontSize: 'clamp(1.5rem, 3.2vw, 2.4rem)', color: C.text, marginBottom: '6px', textAlign: 'center', lineHeight: 1.1 }}>ROI Briefing</div>
                <div style={{ fontFamily: F_SANS, fontSize: '13px', color: C.text3, marginBottom: '28px', textAlign: 'center' }}>Live Data  India 2026</div>
                <div style={{ display: 'flex', gap: '28px', marginBottom: '20px', width: '100%', justifyContent: 'center' }}>
                  {[
                    { l: 'PAYBACK',   v: '6 MO',    c: C.text },
                    { l: '5-YR GAIN', v: '₹14.2L',  c: C.gold },
                    { l: 'DELTA',     v: '+35%',     c: C.text },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: F_MONO, fontSize: '11px', color: C.text3, letterSpacing: '0.1em', marginBottom: '6px' }}>{s.l}</div>
                      <div style={{ fontFamily: F_MONO, fontSize: 'clamp(1rem, 2.6vw, 1.5rem)', color: s.c, fontWeight: '600', letterSpacing: '-0.02em' }}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ width: '75%', height: '1px', background: C.borderMid, marginBottom: '14px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={12} color={C.gold} />
                  <span style={{ fontFamily: F_MONO, fontSize: '11px', color: C.text3, letterSpacing: '0.08em' }}>CALCULATED FROM YOUR INPUTS</span>
                </div>
              </div>

              <AnimatePresence>
                {showSwoosh && (
                  <motion.div key="swoosh"
                    initial={{ left: '-40%', opacity: 0 }}
                    animate={{ left: '140%', opacity: [0, 1, 1, 1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1, ease: [0.22, 0.61, 0.36, 1] }}
                    onAnimationComplete={() => setShowSwoosh(false)}
                    style={{
                      position: 'absolute',
                      top: '-15%',
                      bottom: '-15%',
                      width: '30%',
                      background: 'transparent',
                      transform: 'skewX(-15deg)',
                      pointerEvents: 'none',
                      zIndex: 12,
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          <div style={{ opacity: hintOp, marginTop: '36px', textAlign: 'center', pointerEvents: 'none' }}>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
              <div style={{ fontFamily: F_MONO, fontSize: '11px', color: C.text3, letterSpacing: '0.18em' }}> SCROLL TO BUILD </div>
            </motion.div>
          </div>
        </div>

        <div style={{ opacity: assembledOp, position: 'absolute', bottom: '10%', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none', zIndex: 5 }}>
          <div className="glass" style={{ fontFamily: F_MONO, fontSize: '11px', color: C.text3, letterSpacing: '0.15em', display: 'inline-block', padding: '8px 18px' }}>
             ANALYSIS COMPLETE
          </div>
        </div>
      </div>
    </div>
  )
}

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""
// DATA COMPOSITION - drop-in replacement for the existing
// DataComposition() function in LandingPage.jsx
//
// Rules applied:
//  1. StorySection wrapper preserved - left margin sidebar untouched
//  2. True bento grid: 5yr gain = md:col-span-2, metrics tile right
//  3. Cards: flat #141414, 1px border only, no glass/blur/shadow
//  4. Green (#2D6A4F / C.gold) ONLY on 5yr gain value + +35% text
//     + "Calculate ROI" button - all other accents dimmed to text3
//  5. tabular-nums on every large metric
// """""""""""""""""""""""""""""""""""""""""""""""""""""""""

function DataComposition() {
  const C = useTheme()
  const isMobile = useIsMobile()

  // "" Flat card token - no glass, no blur, no shadow """"""
  const CARD_BG = C.surface
  const CARD_BORDER = '1px solid var(--border)'
  const CARD_RADIUS = '4px'

  // "" Accent rules:
  //   - PRIMARY   C.gold  (5yr gain, +35%)
  //   - MUTED     C.text3 (payback, labels, icons, decorative borders)
  //   - NEUTRAL   C.text  (payback value - important but not brand-green)
  const PRIMARY_ACCENT = C.gold
  const MUTED_ACCENT   = C.text3

  // "" Shared metric label style """""""""""""""""""""""""""
  const labelStyle = {
    fontFamily: F_MONO,
    fontSize: '10px',
    color: MUTED_ACCENT,            // dimmed - not green
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    marginBottom: '10px',
    display: 'block',
  }

  // "" Shared big number style """""""""""""""""""""""""""""
  const bigNumBase = {
    fontFamily: F_MONO,
    fontVariantNumeric: 'tabular-nums',   // rigid alignment
    fontFeatureSettings: '"tnum"',
    lineHeight: 1,
    letterSpacing: '-0.03em',
    fontWeight: '500',
  }

  // "" Grid layout """""""""""""""""""""""""""""""""""""""""
  // Mobile: single column stack
  // Desktop: 3-col grid, hero card spans 2 cols
  //
  //  """""""""""""""""""""""""""""""""""""""
  //    ₹14.2L 5-YR GAIN     6 MO PAYBACK 
  //  "  (col-span-2)        """""""""""""""""
  //  "                      "  +35% DELTA   "
  //  """"""""""""""""""""""""""""""""""""""""

  const gridStyle = isMobile
    ? { display: 'flex', flexDirection: 'column', gap: '8px' }
    : {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gridTemplateRows:    '1fr 1fr',
        gap: '8px',
      }

  return (
    <StorySection id="02" title="METRICS_LOG" noBorderTop>

      {/* "" Section label """"""""""""""""""""""""""""""" */}
      <motion.div variants={RISE} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div style={{
          fontFamily: F_SANS,
          fontSize: '14px',
          color: C.text2,
          letterSpacing: '0.01em',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '6px', height: '6px',
            background: MUTED_ACCENT,   // dimmed square, not green
            borderRadius: '1px',
          }} />
          The numbers behind the route
        </div>
      </motion.div>

      {/* "" Bento grid """""""""""""""""""""""""""""""""" */}
      <motion.div
        variants={RISE}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        style={gridStyle}
      >

        {/* CARD 1 - 5-Year Net Gain (hero, spans 2 rows on desktop) */}
        <div style={{
          background:   CARD_BG,
          border:       CARD_BORDER,
          borderRadius: CARD_RADIUS,
          padding:      isMobile ? '32px 28px' : '44px 40px',
          display:      'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gridRow:      isMobile ? 'auto' : '1 / 3',    // spans both rows
        }}>

          {/* Top label row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            <span style={labelStyle}>// 5_YR_NET_GAIN</span>
            <div style={{
              fontFamily: F_MONO,
              fontSize: '10px',
              color: MUTED_ACCENT,
              letterSpacing: '0.1em',
              padding: '3px 9px',
              border: CARD_BORDER,    // same muted border, not green
              borderRadius: '2px',
            }}>
              {"AWS SAA  BLR '26"}
            </div>
          </div>

          {/* Big number - PRIMARY_ACCENT (gold/green) */}
          <div>
            <div style={{
              ...bigNumBase,
              fontSize: isMobile ? 'clamp(3.8rem, 14vw, 6rem)' : 'clamp(4rem, 8vw, 7rem)',
              color: PRIMARY_ACCENT,   //  brand green, earns its place
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '2px',
            }}>
              <span style={{
                fontSize: isMobile ? 'clamp(1.8rem, 6vw, 2.8rem)' : 'clamp(2rem, 4vw, 3rem)',
                marginTop: isMobile ? '0.4rem' : '0.5rem',
                color: PRIMARY_ACCENT,
                fontVariantNumeric: 'tabular-nums',
                fontFeatureSettings: '"tnum"',
              }}>₹</span>
              <CountUp end={14.2} />
              <span style={{
                fontSize: isMobile ? 'clamp(1.8rem, 6vw, 2.8rem)' : 'clamp(2rem, 4vw, 3rem)',
                marginTop: isMobile ? '0.4rem' : '0.5rem',
                color: PRIMARY_ACCENT,
                fontVariantNumeric: 'tabular-nums',
                fontFeatureSettings: '"tnum"',
              }}>L</span>
            </div>

            <div style={{
              fontFamily: F_SANS,
              fontSize: '14px',
              color: C.text2,
              lineHeight: '1.65',
              maxWidth: '36ch',
              marginTop: '16px',
            }}>
              Cumulative salary uplift net of certification cost &mdash;
              calculated from your salary, city, and expected hike.
              Not a range. A number.
            </div>
          </div>

          {/* Bottom rule */}
          <div style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: CARD_BORDER,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{
              width: '6px', height: '6px',
              borderRadius: '50%',
              background: MUTED_ACCENT,  // muted dot, not green
            }} />
            <span style={{
              fontFamily: F_MONO,
              fontSize: '10px',
              color: MUTED_ACCENT,
              letterSpacing: '0.1em',
            }}>
              {"SOURCE: NAUKRI  AMBITIONBOX  LINKEDIN INDIA  Q1 2026"}
            </span>
          </div>
        </div>

        {/* CARD 2 - Payback Period */}
        <div style={{
          background:   CARD_BG,
          border:       CARD_BORDER,
          borderRadius: CARD_RADIUS,
          padding:      isMobile ? '28px' : '32px 28px',
          display:      'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <span style={labelStyle}>// PAYBACK_PERIOD</span>

          <div>
            <div style={{
              ...bigNumBase,
              fontSize: isMobile ? 'clamp(2.8rem, 10vw, 4rem)' : 'clamp(2.4rem, 4vw, 3.6rem)',
              color: C.text,   //  neutral, not green - payback is neutral fact
              marginBottom: '10px',
            }}>
              <CountUp end={6} suffix=" MO" />
            </div>

            <div style={{
              fontFamily: F_SANS,
              fontSize: '13px',
              color: C.text3,
              lineHeight: '1.6',
            }}>
              Probabilistic payback window with confidence range.
              Not a rough guess.
            </div>
          </div>

          {/* Muted tick mark */}
          <div style={{
            marginTop: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path
                d="M1 4L3.8 7L9 1"
                stroke={MUTED_ACCENT}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span style={{
              fontFamily: F_MONO,
              fontSize: '10px',
              color: MUTED_ACCENT,
              letterSpacing: '0.1em',
            }}>
              CITY-CALIBRATED
            </span>
          </div>
        </div>

        {/* CARD 3 - Salary Delta */}
        <div style={{
          background:   CARD_BG,
          border:       CARD_BORDER,
          borderRadius: CARD_RADIUS,
          padding:      isMobile ? '28px' : '32px 28px',
          display:      'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <span style={labelStyle}>// SALARY_DELTA</span>

          <div>
            <div style={{
              ...bigNumBase,
              fontSize: isMobile ? 'clamp(2.8rem, 10vw, 4rem)' : 'clamp(2.4rem, 4vw, 3.6rem)',
              color: PRIMARY_ACCENT,   //  brand green - positive outcome, earns it
              marginBottom: '10px',
            }}>
              <CountUp end={35} suffix="%" />
            </div>

            <div style={{
              fontFamily: F_SANS,
              fontSize: '13px',
              color: C.text3,
              lineHeight: '1.6',
            }}>
              India-sourced. City-specific.
              Not US data converted at today&apos;s rate.
            </div>
          </div>

          {/* Muted provenance tag */}
          <div style={{
            marginTop: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            border: CARD_BORDER,
            borderRadius: '2px',
            alignSelf: 'flex-start',
          }}>
            <span style={{
              fontFamily: F_MONO,
              fontSize: '10px',
              color: MUTED_ACCENT,
              letterSpacing: '0.1em',
            }}>
              MEDIAN '26
            </span>
          </div>
        </div>

      </motion.div>
    </StorySection>
  )
}// """""""""""""""""""""""""""""""""""""""""""""""""""""""""
// HOW IT WORKS
// """""""""""""""""""""""""""""""""""""""""""""""""""""""""
function HowItWorks({ onEnter }) {
  const C = useTheme()
  const isMobile = useIsMobile()
  const steps = [
    { id: '01', label: 'Current Baseline', subtitle: 'Where you stand now', desc: 'Enter your current salary, role, and city. Upload your resume to automatically map your skills and benchmark salary.' },
    { id: '02', label: 'Certification Pathways', subtitle: 'Compare your options', desc: 'Select a cert or get a data-driven recommendation. Compare up to three paths side by side on cost, time, and expected ROI.' },
    { id: '03', label: 'ROI Dashboard', subtitle: 'See the numbers', desc: 'Estimated payback window, 5-year net gain, monthly delta - all calibrated to your city and salary. A financial projection, not a promise.' },
  ]
  return (
    <StorySection id="03" title="SYS_ARCHITECTURE" bg={C.surface}>
      <motion.div variants={RISE} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <h2 style={{ margin: '0 0 52px' }}>Three inputs.<br />Data-driven projections.</h2>
      </motion.div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '32px' : '36px' }}>
        {steps.map((step, i) => (
          <motion.div key={step.id} variants={RISE} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{ fontFamily: F_MONO, fontSize: '30px', color: C.gold, fontWeight: '700', lineHeight: 1 }}>{step.id}</div>
              <div style={{ width: '100%', height: '1px', background: C.border }} />
            </div>
            <div style={{ fontFamily: F_SANS, fontWeight: '700', fontSize: '18px', color: C.text, marginBottom: '6px', letterSpacing: '-0.02em' }}>{step.label}</div>
            <div style={{ fontFamily: F_MONO, fontSize: '11px', color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '14px' }}>{step.subtitle}</div>
            <div style={{ fontFamily: F_SANS, fontSize: '14px', color: C.text2, lineHeight: '1.65' }}>{step.desc}</div>
          </motion.div>
        ))}
      </div>
      <motion.div variants={RISE} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ marginTop: '52px' }}>
        <PillBtn onClick={onEnter} large>Calculate ROI <ArrowRight size={15} /></PillBtn>
      </motion.div>
    </StorySection>
  )
}

// 
// PIVOT DOMAINS CARD
// Action card on Landing Page - saves targetDomain to store
// before navigating so ResumeAnalyzer can pick it up.
// 
function PivotDomainsCard({ onEnter }) {
  const C = useTheme()
  const isMobile = useIsMobile()
  const setTargetDomain = useJourneyStore(function (s) { return s.setTargetDomain })
  const storedDomain    = useJourneyStore(function (s) { return s.targetDomain || '' })

  const [domain, setDomain]   = useState(storedDomain)
  const [pivotFocus, setPivotFocus] = useState(false)

  const FM = F_MONO
  const LINEAR_BLUE = 'var(--accent)'
  const COOL_GREY   = C.text3

  function handleStartSwitching() {
    setTargetDomain(domain)
    onEnter()
  }

  return (
    <StorySection id="02.5" title="PIVOT_ENGINE" bg={C.surface}>
      <motion.div variants={RISE} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '32px' : '64px', alignItems: 'start' }}>

          {/*  Left: Optimize Current Path  */}
          <div>
            <div style={{ fontFamily: FM, fontSize: '10px', color: COOL_GREY, letterSpacing: '0.14em', marginBottom: '14px' }}>// OPTIMIZE CURRENT PATH</div>
            <div style={{ fontFamily: F_SANS, fontWeight: '700', fontSize: '20px', color: C.text, letterSpacing: '-0.02em', marginBottom: '10px', lineHeight: 1.2 }}>Already in your lane.<br />Go deeper, not wider.</div>
            <div style={{ fontFamily: F_SANS, fontSize: '14px', color: C.text2, lineHeight: '1.7', marginBottom: '22px' }}>
              Select a cert, input your current salary, and we calculate the exact payback window and 5-year gain - down to the rupee.
            </div>
            <PillBtn onClick={onEnter}>
              Calculate ROI <ArrowRight size={13} />
            </PillBtn>
          </div>

          {/*  Right: Pivot Domains  */}
          <div>
            <div style={{ fontFamily: FM, fontSize: '10px', color: COOL_GREY, letterSpacing: '0.14em', marginBottom: '14px' }}>// PIVOT DOMAINS</div>
            <div style={{ fontFamily: F_SANS, fontWeight: '700', fontSize: '20px', color: C.text, letterSpacing: '-0.02em', marginBottom: '10px', lineHeight: 1.2 }}>Switch fields.<br />Get a cert-first roadmap.</div>
            <div style={{ fontFamily: F_SANS, fontSize: '14px', color: C.text2, lineHeight: '1.7', marginBottom: '18px' }}>
              Enter the domain you want to break into. We validate it, then surface certifications specifically for switchers.
            </div>

            {/* Input + state machine */}
            <div style={{ position: 'relative' }}>
              {/*
                BEFORE: padding: '4px 4px 4px 14px' - the input row was ~40px tall,
                below the 48px minimum for form inputs.
                FIX: minHeight: '52px' on the wrapper ensures the whole row
                (input + button) meets the fat-finger target.
                fontSize: '16px' on the input prevents iOS Safari from
                auto-zooming the viewport when the field is focused.
              */}
              <div style={{
                display: 'flex', gap: '8px', alignItems: 'center',
                padding: '4px 4px 4px 14px',
                minHeight: '52px',
                borderRadius: '8px',
                border: '1px solid ' + (pivotFocus ? LINEAR_BLUE + '60' : (!C.isLight ? 'var(--border-subtle)' : 'transparent')),
                background: !C.isLight ? 'var(--border-subtle)' : 'transparent',
                transition: 'border-color 0.18s',
              }}>
                <input
                  value={domain}
                  onChange={function (e) { setDomain(e.target.value) }}
                  onFocus={function () { setPivotFocus(true) }}
                  onBlur={function () { setPivotFocus(false) }}
                  onKeyDown={function (e) { if (e.key === 'Enter' && domain.trim()) handleStartSwitching() }}
                  placeholder="e.g. Cybersecurity, Data Science, Finance..."
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontFamily: FM,
                    fontSize: '16px', /* prevents iOS Safari viewport zoom on focus */
                    color: C.text,
                  }}
                />
                <button
                  onClick={handleStartSwitching}
                  disabled={!domain.trim()}
                  style={{
                    padding: '11px 16px', /* bumped from 9px  11px for 44px+ touch target */
                    borderRadius: '6px',
                    background: domain.trim() ? LINEAR_BLUE : 'transparent',
                    border: '1px solid ' + (domain.trim() ? LINEAR_BLUE : 'var(--border-subtle)'),
                    color: domain.trim() ? C.text : C.text3,
                    fontFamily: FM, fontSize: '11px', fontWeight: '700',
                    cursor: domain.trim() ? 'pointer' : 'not-allowed',
                    letterSpacing: '0.06em', whiteSpace: 'nowrap',
                    transition: 'all 0.18s',
                    minHeight: '44px',
                  }}
                >
                  START SWITCHING 
                </button>
              </div>

              {/* Validation note - appears when domain is non-empty */}
              {domain.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                  style={{
                    marginTop: '8px', padding: '8px 12px', borderRadius: '6px',
                    background: C.bgAlt,
                    border: '1px solid ' + (!C.isLight ? 'var(--border-subtle)' : 'transparent'),
                    fontFamily: FM, fontSize: '10px', color: COOL_GREY, letterSpacing: '0.08em',
                  }}
                >
                  VALIDATION WILL RUN ON ANALYSIS // {domain.trim().toUpperCase()}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </StorySection>
  )
}

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""
// VS SECTION
// """""""""""""""""""""""""""""""""""""""""""""""""""""""""
// 
function VsSection() {
  const C = useTheme()
  const pairs = [
    { wrong: '"AWS is good for cloud engineers"', right: 'AWS SAA at ₹9L salary: payback month 6. ₹14.2L net gain over 5 years. Or it isn\'t worth it.' },
    { wrong: '"Upskill for career growth"', right: '₹23,600 extra every month from month 7 - compounding over 5 years. In rupees, not "growth."' },
    { wrong: 'US salary data converted to rupees', right: 'Naukri  AmbitionBox  LinkedIn India. 2026 data. Not converted from San Francisco.' },
  ]
  return (
    <StorySection id="04" title="INDUSTRY_RISKS" bg={C.bg}>
      <motion.div variants={RISE} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <h2 style={{ margin: '0 0 52px' }}>Every other guide<br />is pointing you wrong.</h2>
      </motion.div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {pairs.map((pair, i) => (
          <motion.div key={i} variants={RISE} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ delay: i * 0.08 }} style={{ paddingTop: i > 0 ? '36px' : '0', paddingBottom: i < pairs.length - 1 ? '36px' : '0', borderBottom: i < pairs.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ fontFamily: F_SANS, fontWeight: '500', fontSize: '16px', color: C.text3, letterSpacing: '-0.01em', marginBottom: '10px', textDecoration: 'line-through', opacity: 0.5 }}>{pair.wrong}</div>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '3px', height: '14px', background: C.gold, marginTop: '5px', flexShrink: 0 }} />
              <div style={{ fontFamily: F_SANS, fontSize: '15px', color: C.text, lineHeight: '1.6' }}>{pair.right}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </StorySection>
  )
}

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""
// 11 PM STORIES
// """""""""""""""""""""""""""""""""""""""""""""""""""""""""
function ElevenPM({ onEnter }) {
  const C = useTheme()
  const isMobile = useIsMobile()
  const stories = [
    { time: '11:47 PM', name: 'Rohan', loc: 'Pune', role: '2 yrs  Backend Engineer', thought: '"Should I do AWS? Or is it too late?"', context: 'Ex-classmate promoted to Cloud Architect. ₹28L CTC.', answer: 'AWS SAA at ₹9L: payback month 6. 5-year gain ₹14.2L.' },
    { time: '11:12 PM', name: 'Sneha', loc: 'Bangalore', role: '6 yrs  Ops Manager', thought: '"Is the switch possible without an MBA?"', context: 'Every data job requires 3 years experience. She has zero.', answer: 'Google Data Analytics + 2 GitHub projects. 5 months. ₹8L  ₹12L.' },
    { time: '12:03 AM', name: 'Arjun', loc: 'Pune', role: 'CS  Fresh graduate', thought: '"Which cert gets me placed here in India?"', context: 'Three articles. All recommend AWS. All in USD.', answer: 'Student Mode. GCP placed 47 Pune freshers in Q1 2026.' },
  ]
  return (
    <StorySection id="05" title="USER_STORIES" bg={C.surface}>
      <motion.div variants={RISE} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <h2 style={{ margin: '0 0 52px' }}>We know what you're<br />thinking right now.</h2>
      </motion.div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', borderTop: `1px solid ${C.border}` }}>
        {stories.map((s, i) => {
          const last = i === stories.length - 1
          return (
            <motion.div key={i} variants={RISE} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ delay: i * 0.08 }} onClick={onEnter} style={{ paddingLeft: !isMobile && i > 0 ? '36px' : '0', paddingRight: !isMobile && i < 2 ? '36px' : '0', paddingTop: '36px', paddingBottom: '36px', borderRight: !isMobile && !last ? `1px solid ${C.border}` : 'none', borderBottom: isMobile && !last ? `1px solid ${C.border}` : 'none', cursor: 'pointer' }}>
              <div style={{ fontFamily: F_MONO, fontSize: '11px', color: C.text3, letterSpacing: '0.06em', marginBottom: '14px' }}>// LOG_TIME: {s.time}</div>
              <div style={{ fontFamily: F_SERIF, fontStyle: 'italic', fontWeight: '400', fontSize: '20px', color: C.text, lineHeight: 1.35, marginBottom: '14px' }}>{s.thought}</div>
              <div style={{ fontFamily: F_SANS, fontSize: '13px', color: C.text2, lineHeight: '1.6', marginBottom: '20px' }}><em style={{ fontStyle: 'italic' }}>{s.name}</em>, {s.loc} - {s.role}. {s.context}</div>
              <div style={{ width: '20px', height: '2px', background: C.text3, marginBottom: '14px' }} />
              <div style={{ fontFamily: F_SANS, fontWeight: '600', fontSize: '13px', color: C.text, lineHeight: '1.55' }}>{s.answer}</div>
            </motion.div>
          )
        })}
      </div>
    </StorySection>
  )
}

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""
// THREE MODES
// """""""""""""""""""""""""""""""""""""""""""""""""""""""""
function ThreeModes() {
  const C = useTheme()
  const isMobile = useIsMobile()
  const modes = [
    { id: 'student',      label: 'Breaking In',  sub: 'No salary yet',              desc: 'Path to a ₹4.8L+ first offer. Reframes ROI around career investment and time-to-hire, not salary hikes.' },
    { id: 'switcher',     label: 'Domain Pivot',  sub: 'Changing fields',            desc: 'Switch domains in 5-8 months. Only fast-track options shown. Longer programs filtered out.' },
    { id: 'professional', label: 'Level Up',      sub: 'Upskilling for a promotion', desc: 'Maximum ROI on your next cert. Payback window, city benchmarks, and a reimbursement case for your manager.' },
  ]
  return (
    <StorySection id="06" title="SYS_MODES" bg={C.bg}>
      <motion.div variants={RISE} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <h2 style={{ margin: '0 0 52px' }}>Three tracks.<br /><span style={{ color: C.gold }}>One tool.</span></h2>
      </motion.div>
      <div className="glass" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '24px' : '32px', padding: isMobile ? '24px' : '32px' }}>
        {modes.map((m, i) => (
          <motion.div 
            key={m.label} 
            variants={RISE} 
            initial="hidden" 
            whileInView="show" 
            viewport={{ once: true }} 
            transition={{ delay: i * 0.08 }}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              const s = useJourneyStore.getState();
              if (s.setMode) s.setMode(m.id);
              if (s.setActiveTab) s.setActiveTab('resume');
              setTimeout(() => document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' }), 50);
            }}
          >
            <div style={{ fontFamily: F_SANS, fontWeight: '700', fontSize: '17px', color: C.text, letterSpacing: '-0.02em', marginBottom: '6px' }}>{m.label}</div>
            <div style={{ fontFamily: F_MONO, fontSize: '11px', color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '14px' }}>{m.sub}</div>
            <div style={{ fontFamily: F_SANS, fontSize: '14px', color: C.text2, lineHeight: '1.65' }}>{m.desc}</div>
          </motion.div>
        ))}
      </div>
    </StorySection>
  )
}

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""
// SOCIAL PROOF
// """""""""""""""""""""""""""""""""""""""""""""""""""""""""
function SocialProof() {
  const C = useTheme()
  const isMobile = useIsMobile()
  const quotes = [
    { quote: 'Certify said payback was month 8. It was month 7. Switched companies immediately. ₹6L hike.', name: 'Priya S.', detail: 'Bangalore  Engineer  Cloud Architect', hike: '+₹6L/yr' },
    { quote: 'Was about to spend ₹12L on an MBA. The analysis showed a different path - 5 months, 1% of the cost.', name: 'Rahul M.', detail: 'Hyderabad  Ops Manager  Data Analyst', hike: 'Saved ₹12L' },
    { quote: 'Student Mode. India-specific. GCP placed 47 Pune freshers in Q1 2026. My ₹5.2L offer was one of them.', name: 'Ananya K.', detail: 'Pune  Fresh Graduate', hike: '₹5.2L offer' },
  ]
  return (
    <StorySection id="07" title="FIELD_REPORTS" bg={C.surface}>
      <motion.div variants={RISE} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <h2 style={{ margin: '0 0 52px' }}>They ran the numbers first.<br /><span style={{ color: C.gold }}>Then decided.</span></h2>
      </motion.div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {quotes.map((q, i) => {
          const last = i === quotes.length - 1
          return (
            <motion.div key={i} variants={RISE} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ paddingTop: i > 0 ? '40px' : '0', paddingBottom: !last ? '40px' : '0', borderBottom: !last ? `1px solid ${C.border}` : 'none', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 160px', gap: '20px', alignItems: 'end' }}>
              <div>
                <div style={{ fontFamily: F_SERIF, fontStyle: 'italic', fontWeight: '400', fontSize: 'clamp(1.1rem, 2.2vw, 1.6rem)', color: C.text, letterSpacing: '-0.01em', lineHeight: 1.35, marginBottom: '20px' }}>"{q.quote}"</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ width: '16px', height: '2px', background: C.text3, flexShrink: 0 }} />
                  <span style={{ fontFamily: F_SANS, fontWeight: '600', fontSize: '13px', color: C.text }}>{q.name}</span>
                  <span style={{ fontFamily: F_MONO, fontSize: '11px', color: C.text3 }}>{q.detail}</span>
                </div>
              </div>
              <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                <div style={{ fontFamily: F_MONO, fontWeight: '600', fontSize: 'clamp(1.4rem, 2.8vw, 1.9rem)', color: C.text, letterSpacing: '-0.04em', lineHeight: 1 }}>{q.hike}</div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </StorySection>
  )
}

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""
// FAQ
// """""""""""""""""""""""""""""""""""""""""""""""""""""""""
const FAQ_ITEMS = [
  { q: 'How accurate are the ROI calculations?', a: 'Based on median salary data from Naukri, AmbitionBox, and LinkedIn India - updated quarterly. Directional estimates, not guarantees.' },
  { q: 'Do I need to create an account?', a: 'No. The ROI calculator, comparison tool, and city demand heatmap are all free with no signup.' },
  { q: 'What certifications are covered?', a: '103 certifications across 17 domains - cloud, data, cybersecurity, finance, project management, and more.' },
  { q: 'Is this only useful for India?', a: 'Salary benchmarks and demand data are India-specific. The framework applies anywhere, but numbers are calibrated for India.' },
  { q: 'How does the resume analysis work?', a: 'Upload your resume. The tool reads your domain, experience level, and existing skills to benchmark your current position and surface certifications with the highest ROI for your profile. No AI buzzwords - just filtered, ranked data.' },
]

function FAQItem({ item }) {
  const C = useTheme()
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', padding: '22px 0', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ fontFamily: F_SANS, fontWeight: '600', fontSize: '15px', color: C.text, letterSpacing: '-0.01em', lineHeight: 1.4 }}>{item.q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0 }}><ChevronDown size={16} color={C.text3} /></motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="ans" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24 }} style={{ overflow: 'hidden' }}>
            <div style={{ paddingBottom: '22px', fontFamily: F_SANS, fontSize: '14px', color: C.text2, lineHeight: '1.65', maxWidth: '64ch' }}>{item.a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FAQ() {
  const C = useTheme()
  const isMobile = useIsMobile()
  return (
    <StorySection id="08" title="LOGISTICS" bg={C.bg}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '260px 1fr', gap: isMobile ? '36px' : '64px', alignItems: 'start' }}>
        <div style={{ position: isMobile ? 'static' : 'sticky', top: '140px' }}>
          <motion.h2 variants={RISE} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ fontFamily: F_SANS, fontWeight: '700', fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', color: C.text, letterSpacing: '-0.025em', lineHeight: 1.15, margin: 0 }}>Common<br />questions<br />answered.</motion.h2>
        </div>
        <motion.div variants={RISE} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <div style={{ borderTop: `1px solid ${C.border}` }}>{FAQ_ITEMS.map((item, i) => <FAQItem key={i} item={item} />)}</div>
        </motion.div>
      </div>
    </StorySection>
  )
}

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""
// FINAL CTA - centered, bold, clean, no sidebar
// """""""""""""""""""""""""""""""""""""""""""""""""""""""""
// --------------------------------------------------
// FINAL CTA - centered, bold, clean, no sidebar
// --------------------------------------------------
function FinalCTA({ onEnter }) {
  const C = useTheme()
  const isMobile = useIsMobile()
  const d = !C.isLight

  return (
    <div style={{
      background: C.surface,
      borderTop: `1px solid ${C.border}`,
      position: 'relative',
      overflow: 'hidden',
      padding: isMobile ? '100px 24px' : '160px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
    }}>
      {/* Topographic circles - subtle */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: d ? 0.12 : 0.08 }}>
        <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
          <circle cx="400" cy="300" r="120" fill="none" stroke={C.lineHeavy} strokeWidth="0.8" />
          <circle cx="400" cy="300" r="200" fill="none" stroke={C.lineHeavy} strokeWidth="0.6" />
          <circle cx="400" cy="300" r="290" fill="none" stroke={C.lineHeavy} strokeWidth="0.5" />
          <circle cx="400" cy="300" r="380" fill="none" stroke={C.lineHeavy} strokeWidth="0.4" />
        </svg>
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px' }}>
        <motion.h2
          variants={RISE}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          style={{
            fontFamily: F_SERIF,
            fontStyle: 'italic',
            fontWeight: '400',
            fontSize: isMobile ? 'clamp(2.8rem, 10vw, 4.5rem)' : 'clamp(3.5rem, 8vw, 6.5rem)',
            color: C.text,
            letterSpacing: '-0.025em',
            lineHeight: isMobile ? 1.0 : 0.96,
            margin: '0 0 28px',
          }}
        >
          You'll know<br />the answer.
        </motion.h2>

        <motion.p
          variants={RISE}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          style={{
            fontFamily: F_SANS,
            fontSize: isMobile ? '14px' : '16px',
            color: C.text2,
            lineHeight: '1.65',
            maxWidth: '44ch',
            margin: '0 auto 44px',
          }}
        >
          Stop reading generic advice. Stop asking Reddit.{' '}
          <span style={{ color: C.text, fontWeight: '600' }}>Know the exact payback period before you pay the exam fee.</span>
        </motion.p>

        <motion.div
          variants={RISE}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ delay: 0.16 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}
        >
          <PillBtn onClick={onEnter} large>Calculate ROI <ArrowRight size={15} /></PillBtn>
          <GlassPill>
            <div style={{ display: 'flex', gap: '4px' }}>
              <div style={{ width: '4px', height: '10px', background: C.gold }} />
              <div style={{ width: '4px', height: '10px', background: C.gold, opacity: 0.35 }} />
            </div>
            <span style={{ fontFamily: F_SANS, fontSize: '11px', color: C.text2, letterSpacing: '0.03em', fontWeight: '400' }}>Complimentary  Private  India-calibrated</span>
          </GlassPill>
        </motion.div>
      </div>
    </div>
  )
}



export default function App({ onNavigate, onEnter, isDark = true }) {
  const C = useThemeContext()
  const isMobile = useIsMobile()
  const router = useRouter()
  const handleEnter = typeof onEnter === 'function' ? onEnter : function() {
    router.push('/tools/roi')
  }

  return (
      <div style={{
        minHeight: '100vh',
        background: C.bg,
        color: C.text,
        overflow: 'clip',
        transition: 'background 0.3s ease, color 0.3s ease',
      }}>
        {/* -------------------------------------------
            HERO - centered mountain, tagline on mountain
        ------------------------------------------- */}
        <div style={{
          position: 'relative',
          height: '100vh',
          minHeight: isMobile ? '100svh' : '680px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${C.border}`,
          overflow: 'hidden',
        }}>

          {/* Mountain - centered, full bleed */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: C.bg }}>
            {isMobile ? (
              <img
                src="/mountain.png"
                alt="Mountain background"
                loading="lazy"
                style={{
                  position: 'absolute',
                  bottom: 0, left: 0,
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                  objectPosition: 'center bottom',
                  filter: !C.isLight
                    ? 'brightness(0.42) contrast(1.08) saturate(0.55)'
                    : 'brightness(0.62) contrast(1.12) saturate(0.82)',
                  maskImage: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 55%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 55%, transparent 100%)',
                }}
              />
            ) : (
              <img
                src="/mountain.png"
                alt="Mountain background"
                loading="lazy"
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center center',
                  filter: !C.isLight
                    ? 'brightness(0.38) contrast(1.12) saturate(0.6)'
                    : 'brightness(0.62) contrast(1.12) saturate(0.82)',
                }}
              />
            )}            {/* Overlay for text readability */}
            <div style={{
              position: 'absolute', inset: 0,
              background: C.isLight
                ? 'linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.28) 50%, rgba(0,0,0,0.38) 100%)'
                : 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.5) 100%)',
            }} />
          </div>

          {/* Centered content ON the mountain */}
          <div style={{
            position: 'relative', zIndex: 2,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center',
            /* 16px side padding on phones, 24px on larger */
            padding: isMobile ? '0 16px' : '0 24px',
            maxWidth: '820px',
            width: '100%',
          }}>
            {/* Mono label - centered with gold lines on both sides */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              style={{
                fontFamily: F_MONO, fontSize: '11px', color: C.text3,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                marginBottom: '32px',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}
            >
              <div style={{ width: '28px', height: '1px', background: C.gold }} />
              ROI Analysis for Indian Professionals
              <div style={{ width: '28px', height: '1px', background: C.gold }} />
            </motion.div>

            {/* Headline - tightly spaced, on the mountain */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.06 }}
              style={{
                fontFamily: F_SERIF, fontWeight: '400',
                fontSize: isMobile
                  ? 'clamp(2.6rem, 9vw, 4.2rem)'
                  : 'clamp(4rem, 7.5vw, 7.5rem)',
                lineHeight: 0.88,
                letterSpacing: '-0.03em',
                color: '#F4F5F8',
                marginBottom: '28px',
                maxWidth: '13ch',
                textShadow: '0 2px 24px rgba(0,0,0,0.45)',
              }}
            >
              Your next cert<br />
              is either a{' '}
              <span style={{ color: C.gold, fontStyle: 'italic' }}>goldmine</span>
              <br />
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>or a{' '}</span>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>mistake.</span>
            </motion.h1>

            {/* Supporting text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.18 }}
              style={{
                fontFamily: F_SANS,
                fontSize: isMobile ? '13px' : '16px',
                color: 'rgba(244,245,248,0.92)',
                opacity: 1,
                maxWidth: '380px', lineHeight: '1.6',
                margin: '0 0 36px',
                textShadow: '0 1px 20px transparent',
              }}
            >
              Know the exact payback period before you pay the fee. Calculated for your city and current salary.
            </motion.p>

            {/* CTA - button only, no pill box */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.28 }}
            >
              <PillBtn onClick={handleEnter} large primary>Calculate ROI <ArrowRight size={15} /></PillBtn>
            </motion.div>
          </div>
        </div>

        {/* ---------- SECTIONS ---------- */}
        <TrustStrip />
        <CertAssembly />
        <DataComposition />
        <FeaturesBentoGrid onEnter={handleEnter} />
        <PivotDomainsCard onEnter={handleEnter} />
        <HowItWorks onEnter={handleEnter} />
        <VsSection />
        <ElevenPM onEnter={handleEnter} />
        <ThreeModes />
        <SocialProof />
        <FAQ />
        <FinalCTA onEnter={handleEnter} />
      </div>
  )
}
