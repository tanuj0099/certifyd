import React, { useState, useEffect, createContext, useContext } from 'react'
import { motion } from 'framer-motion'
import { useTheme as useGlobalTheme } from '../hooks/useTheme'

// ─────────────────────────────────────────────────────────
// THEMES
// ─────────────────────────────────────────────────────────
export const THEMES = {
  dark: {
    name: 'dark',
    bg: '#0A0A0A',
    bgAlt: '#101010',
    surface: '#131313',
    text: '#F0F0F0',
    text2: '#A8A8A8',
    text3: '#6E6E6E',
    text4: '#3A3A3A',
    gold: '#D4AF37',
    goldL: '#F0D060',
    err: '#D94848',
    line: '#1E1E1E',
    lineHeavy: '#2C2C2C',
    border: 'rgba(255,255,255,0.07)',
    borderMid: 'rgba(255,255,255,0.13)',
    certBg: '#080808',
  },
  light: {
    name: 'light',
    bg: '#F4F2EE',
    bgAlt: '#EBE8E3',
    surface: '#FAFAF8',
    text: '#121212',
    text2: '#555555',
    text3: '#858585',
    text4: '#A3A3A3',
    gold: '#A07828',
    goldL: '#C9A84C',
    err: '#C93636',
    line: '#DDD9D3',
    lineHeavy: '#C2BCB3',
    border: 'rgba(0,0,0,0.07)',
    borderMid: 'rgba(0,0,0,0.15)',
    certBg: '#F8F8F6',
  }
}

export const F_SERIF = "'EB Garamond', 'Cormorant Garamond', Georgia, serif"
export const F_SANS  = "'Inter', 'DM Sans', sans-serif"
export const F_MONO  = "'JetBrains Mono', 'IBM Plex Mono', monospace"

export const RISE = {
  hidden: { y: 28, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
}

export function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => {
    const c = () => setM(window.innerWidth < 768)
    c(); window.addEventListener('resize', c)
    return () => window.removeEventListener('resize', c)
  }, [])
  return m
}

export function useThemeContext() {
  const { isDark } = useGlobalTheme()
  return isDark ? THEMES.dark : THEMES.light
}

// ─────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────
export function CrosshairIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <line x1="7" y1="1" x2="7" y2="13" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <line x1="1" y1="7" x2="13" y2="7" stroke={color} strokeWidth="0.8" opacity="0.5" />
    </svg>
  )
}

export function PillBtn({ onClick = () => {}, children, large, style = {} }) {
  const C = useThemeContext()
  const [h, setH] = useState(false)
  const d = C.name === 'dark'
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
        background: d
          ? `linear-gradient(135deg, rgba(255,255,255,${h ? 0.07 : 0.045}), rgba(255,255,255,${h ? 0.02 : 0.01}))`
          : `linear-gradient(135deg, rgba(0,0,0,${h ? 0.05 : 0.035}), rgba(0,0,0,${h ? 0.015 : 0.008}))`,
        border: `1px solid ${d ? `rgba(255,255,255,${h ? 0.13 : 0.09})` : `rgba(0,0,0,${h ? 0.1 : 0.07})`}`,
        borderRadius: '9999px',
        fontSize: large ? '12px' : '11px',
        fontFamily: F_SANS, fontWeight: '600',
        letterSpacing: '0.07em', textTransform: 'uppercase',
        cursor: 'pointer',
        color: d ? C.goldL : C.gold,
        boxShadow: d
          ? `0 2px 12px rgba(0,0,0,${h ? 0.35 : 0.25})`
          : `0 2px 8px rgba(0,0,0,${h ? 0.06 : 0.04})`,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        ...style
      }}
    >
      {children}
    </motion.button>
  )
}

export function GlassPill({ children, style = {} }) {
  const C = useThemeContext()
  const d = C.name === 'dark'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '10px',
      padding: '7px 16px', borderRadius: '9999px',
      background: d ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.03)',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      border: `1px solid ${d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
      ...style
    }}>
      {children}
    </div>
  )
}

export function AppSection({ id = '', title = '', children, bg = '', noBorderTop = false }) {
  const C = useThemeContext()
  const isMobile = useIsMobile()
  const d = C.name === 'dark'
  return (
    <div style={{ position: 'relative', padding: isMobile ? '16px' : '32px 24px' }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        background: d ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${d ? 'rgba(255, 255, 255, 0.08)' : 'rgba(26,25,22,0.06)'}`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        borderRadius: '16px',
        overflow: 'hidden'
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
        <div style={{ flex: 1, padding: isMobile ? '32px 16px' : '64px 4vw', position: 'relative', overflow: 'hidden' }}>
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
