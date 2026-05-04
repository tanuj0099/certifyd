import React, { useState, useEffect, createContext, useContext } from 'react'
import { motion } from 'framer-motion'
import { useTheme as useGlobalTheme, THEME_PRESETS } from '../hooks/useTheme'

// ─────────────────────────────────────────────────────────
// THEMES — Maps to 5-theme engine in useTheme.jsx
// Components that use C.bg, C.text, etc. read from here.
// ─────────────────────────────────────────────────────────
export const THEMES = Object.fromEntries(
  Object.entries(THEME_PRESETS).map(([id, t]) => [id, {
    name:      id,
    bg:        t.bg,
    bgAlt:     t.bgAlt,
    surface:   t.surface,
    text:      t.text,
    text2:     t.text2,
    text3:     t.text3,
    text4:     t.text4,
    gold:      t.gold || '#C9A84C',
    goldL:     t.gold || '#C9A84C',
    err:       '#D94848',
    line:      t.border,
    lineHeavy: t.borderMid,
    border:    t.border,
    borderMid: t.borderMid,
    certBg:    t.bg,
  }])
)

// Legacy compat: dark/light aliases
THEMES.dark  = THEMES.nordic
THEMES.light = THEMES.ash

export const F_SERIF = "'Inter', system-ui, sans-serif"
export const F_SANS  = "'Inter', 'DM Sans', sans-serif"
export const F_MONO  = "'JetBrains Mono', 'IBM Plex Mono', monospace"

// Spring-loaded entrance (stiffness: 120, damping: 20)
export const RISE = {
  hidden: { y: 28, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120, damping: 20 } }
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
  const { current } = useGlobalTheme()
  return THEMES[current.id] || THEMES.nordic
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
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        padding: large ? '0 30px' : '0 22px',
        height: large ? '54px' : '44px',
        background: 'var(--accent)',
        border: 'none',
        borderRadius: '9999px',
        fontSize: large ? '12px' : '11px',
        fontFamily: F_SANS, fontWeight: '600',
        letterSpacing: '0.07em', textTransform: 'uppercase',
        cursor: 'pointer',
        color: 'var(--bg)',
        transition: 'all 0.3s ease',
        ...style
      }}
    >
      {children}
    </motion.button>
  )
}

export function GlassPill({ children, style = {} }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '10px',
      padding: '7px 16px', borderRadius: '9999px',
      background: 'var(--bg-alt)',
      border: '1px solid var(--border)',
      ...style
    }}>
      {children}
    </div>
  )
}

export function AppSection({ id = '', title = '', children, bg = '', noBorderTop = false }) {
  const C = useThemeContext()
  const isMobile = useIsMobile()
  return (
    <div style={{ position: 'relative', padding: isMobile ? '16px' : '32px 24px' }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
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
