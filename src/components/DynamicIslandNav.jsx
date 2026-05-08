// ─────────────────────────────────────────────────────────
// DynamicIslandNav.jsx — CertifyROI
// ─────────────────────────────────────────────────────────

import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Menu, X, User, LogOut } from 'lucide-react'
import { useTheme as useThemeEngine } from '../hooks/useTheme'

const F_SANS  = "'Inter', 'DM Sans', sans-serif"
const F_MONO  = "'JetBrains Mono', 'IBM Plex Mono', monospace"

const MARKETING_NAV_ITEMS = [
  { label: 'Home',           pageId: 'home'          },
  { label: 'Tools',          pageId: 'app'           },
  { label: 'Product',        pageId: 'how-it-works'  },
  { label: 'Pricing',        pageId: 'pricing'       },
  { label: 'About',          pageId: 'about'         },
  { label: 'FAQ',            pageId: 'faq'           },
]

const APP_NAV_ITEMS = [
  { label: 'Home',           pageId: 'home',       path: '/' },
  { label: 'Market Pulse',   pageId: 'app',        path: '/tools/market' },
  { label: 'Cert Compare',   pageId: 'compare',    path: '/tools/compare' },
]

function NavItem({ item, label, pageId, isActive, onActivate, onNavigate, theme }) {
  const [hovered, setHovered] = useState(false)
  const t = theme

  return (
    <a
      href={item?.path || '#' + pageId}
      onClick={(e) => {
        e.preventDefault()
        onActivate(pageId)
        if (onNavigate) {
          if (item?.path) onNavigate(item.path)
          else onNavigate(pageId)
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center',
        padding: '6px 12px', borderRadius: '100px',
        textDecoration: 'none', outline: 'none', cursor: 'pointer', userSelect: 'none',
      }}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute', inset: 0, borderRadius: '100px',
              background: t.name === 'dark' ? 'var(--border-subtle)' : 'transparent',
            }}
          />
        )}
      </AnimatePresence>
      <span style={{
        position: 'relative', fontFamily: F_SANS, fontSize: '13px',
        fontWeight: isActive ? '600' : '400', letterSpacing: '-0.01em',
        color: isActive ? t.text : t.text2, transition: 'color 0.15s',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      {isActive && (
        <motion.div
          layoutId="nav-active-indicator"
          style={{
            position: 'absolute', bottom: '3px', left: '12px', right: '12px',
            height: '1.5px', borderRadius: '1px', background: t.gold,
          }}
          transition={{ type: 'spring', stiffness: 480, damping: 36 }}
        />
      )}
    </a>
  )
}

function ThemeToggle({ isDark, onToggle, theme }) {
  const t = theme
  return (
    <motion.button
  data-testid="theme-toggle"
  onClick={onToggle}
      whileTap={{ scale: 0.9 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        height: '32px', padding: '0 12px', borderRadius: '100px',
        border: '1px solid ' + t.border,
        background: 'transparent',
        cursor: 'pointer', color: t.text2, flexShrink: 0,
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      {/* Color swatch */}
      <div style={{
        width: '8px', height: '8px', borderRadius: '50%',
        background: t.gold,
        transition: 'background 0.3s',
      }} />
      <AnimatePresence mode="wait">
        <motion.span
          key={t.name}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.12 }}
          style={{
            fontFamily: F_MONO, fontSize: '9px',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            fontWeight: '600',
          }}
        >
          {t.name}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

function MobileMenuPanel({ isOpen, onClose, activeHref, onActivate, isDark, onToggle, onNavigate, theme, navItems }) {
  const t = theme

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 440, damping: 36 }}
          style={{
            position: 'fixed', top: '80px', left: '16px', right: '16px', zIndex: 9998,
            borderRadius: '20px',
            background: t.name === 'dark' ? 'transparent' : 'transparent',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid ' + t.borderMid,
            boxShadow: t.name === 'dark'
              ? '0 24px 48px transparent'
              : '0 24px 48px transparent',
            padding: '8px', overflow: 'hidden',
          }}
        >
          {navItems.map((item, i) => {
            const isActive = activeHref === item.pageId
            return (
              <motion.div
                key={item.pageId}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <a
                  href={'#' + item.pageId}
                  onClick={(e) => {
                    e.preventDefault()
                    onActivate(item.pageId)
                    if (onNavigate) onNavigate(item.pageId)
                    onClose()
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '13px 16px', borderRadius: '12px', textDecoration: 'none',
                    background: isActive ? (t.name === 'dark' ? 'var(--border-subtle)' : 'transparent') : 'transparent',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                >
                  <span style={{
                    fontFamily: F_SANS, fontSize: '16px',
                    fontWeight: isActive ? '600' : '400',
                    color: isActive ? t.text : t.text2, letterSpacing: '-0.01em',
                  }}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: t.gold }} />
                  )}
                </a>
              </motion.div>
            )
          })}

          <div style={{ height: '1px', background: t.border, margin: '8px 16px' }} />

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: navItems.length * 0.04 + 0.05, duration: 0.3 }}
            style={{ padding: '8px 8px 4px', display: 'flex', justifyContent: 'flex-end' }}
          >
            <ThemeToggle isDark={isDark} onToggle={onToggle} theme={t} />
          </motion.div>
          {theme.user && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: navItems.length * 0.04 + 0.1, duration: 0.3 }}
              style={{ padding: '8px', display: 'flex', justifyContent: 'flex-start' }}
            >
              <a
                href="/profile"
                onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('/profile'); onClose(); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', padding: '12px 16px', borderRadius: '12px', textDecoration: 'none',
                  background: 'var(--accent)', color: 'var(--bg)', cursor: 'pointer', fontFamily: F_SANS, fontSize: '15px', fontWeight: '600'
                }}
              >
                <User size={15} />
                My Profile
              </a>
            </motion.div>
          )}
          {!theme.user && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: navItems.length * 0.04 + 0.1, duration: 0.3 }}
              style={{ padding: '8px', display: 'flex', justifyContent: 'flex-start' }}
            >
              <button
                onClick={(e) => {
                  e.preventDefault()
                  if (theme.onSignIn) theme.onSignIn()
                  onClose()
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', padding: '12px 16px', borderRadius: '12px', textDecoration: 'none',
                  background: 'var(--accent)', color: 'var(--bg)', cursor: 'pointer', border: 'none', fontFamily: F_SANS, fontSize: '15px', fontWeight: '600'
                }}
              >
                Sign In
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────
export default function DynamicIslandNav({ isDark, toggleTheme, onNavigate, currentPage, user, onSignIn, onSignOut }) {
  // Pull from 2-theme engine
  const { current: currentPreset, toggleTheme: toggleThemeEngine } = useThemeEngine()

  const theme = currentPreset ? {
    name: currentPreset.id,
    text: currentPreset.text,
    text2: currentPreset.text2,
    text3: currentPreset.text3,
    text4: currentPreset.text4,
    gold: currentPreset.accent,
    goldL: currentPreset.accent,
    silver: currentPreset.text3,
    silverL: currentPreset.text2,
    border: currentPreset.border,
    borderMid: currentPreset.borderMid,
  } : {
    name: 'nordic',
    text: '#F4F5F8', text2: '#A0A3AB', text3: '#6B6E76', text4: '#44474F',
    gold: 'var(--accent)', goldL: 'var(--accent)', silver: '#6B6E76', silverL: '#A0A3AB',
    border: 'rgba(255,255,255,0.08)', borderMid: 'rgba(255,255,255,0.14)',
  }

  const isLight = currentPreset?.isLight || false
  const activeNavItems = (user || currentPage === 'app') ? APP_NAV_ITEMS : MARKETING_NAV_ITEMS

  const [activeHref, setActiveHref] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const islandRef = useRef(null)

  const rotX = useMotionValue(0)
  const rotY = useMotionValue(0)
  const lift = useMotionValue(0)
  // Strict motion spec: spring physics (stiffness: 100, damping: 20)
  const springCfg = { type: 'spring', stiffness: 100, damping: 20, mass: 0.8 }
  const sRotX = useSpring(rotX, springCfg)
  const sRotY = useSpring(rotY, springCfg)
  const sLift = useSpring(lift, { stiffness: 100, damping: 20 })

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (currentPage) setActiveHref(currentPage)
  }, [currentPage])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onScroll = () => setMenuOpen(false)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [menuOpen])

  const handlePointerMove = useCallback((e) => {
    const el = islandRef.current
    if (!el || isMobile) return
    const rect = el.getBoundingClientRect()
    const nx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
    const ny = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
    rotY.set(nx * 4); rotX.set(-ny * 4); lift.set(6)
  }, [isMobile, rotX, rotY, lift])

  const handlePointerLeave = useCallback(() => {
    rotX.set(0); rotY.set(0); lift.set(0)
  }, [rotX, rotY, lift])

  const glassBg = isLight ? 'rgba(255,255,255,0.78)' : 'rgba(34,35,38,0.78)'
  const borderColor = theme.border
  const innerHL = theme.border
  const shadow = scrolled
    ? (isDark ? '0 20px 60px transparent, 0 8px 24px transparent' : '0 20px 60px transparent, 0 8px 24px transparent')
    : (isDark ? '0 8px 32px transparent, 0 2px 8px transparent' : '0 8px 32px transparent, 0 2px 8px transparent')

  return (
    <>
      {/* Nav pill — floats at top-center, no full-width strip */}
      <div style={{
        position: 'fixed', top: '14px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, pointerEvents: 'none',
      }}>
        <motion.div
          ref={islandRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          style={{
            rotateX: sRotX, rotateY: sRotY, translateZ: sLift,
            transformStyle: 'preserve-3d', transformPerspective: 800,
            display: 'inline-flex', alignItems: 'center',
            height: isMobile ? '52px' : '48px',
            padding: '0 14px',
            gap: '4px',
            background: glassBg,
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            borderRadius: '100px',
            border: '1px solid ' + borderColor,
            boxShadow: shadow,
            outline: '1px solid ' + innerHL,
            outlineOffset: '-2px',
            pointerEvents: 'auto', cursor: 'default', userSelect: 'none',
          }}
          initial={{ y: -64, opacity: 0, scale: 0.92 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
        >
          {!isMobile && (
            <>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {activeNavItems.map((item) => (
                  <NavItem
                    key={item.pageId}
                    item={item}
                    label={item.label}
                    pageId={item.pageId}
                    isActive={activeHref === item.pageId || activeHref === item.path}
                    onActivate={setActiveHref}
                    onNavigate={onNavigate}
                    theme={theme}
                  />
                ))}
              </div>
              <div style={{ width: '1px', height: '20px', background: borderColor, flexShrink: 0, margin: '0 4px' }} />
              <div style={{ padding: '0 4px', flexShrink: 0 }}>
                <ThemeToggle isDark={isDark} onToggle={toggleThemeEngine} theme={theme} />
              </div>
              <div style={{ width: '1px', height: '20px', background: borderColor, flexShrink: 0, margin: '0 4px' }} />
              <div style={{ padding: '0 4px', flexShrink: 0 }}>
                <button
                  onClick={user ? onSignOut : onSignIn}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    height: '32px', padding: '0 14px', borderRadius: '16px',
                    background: user ? 'transparent' : '#F4F5F8',
                    border: '1px solid ' + borderColor,
                    color: user ? theme.text : '#222326',
                    fontFamily: F_SANS, fontSize: '12px', fontWeight: '600',
                    cursor: 'pointer', transition: 'all 0.15s', outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if(!user) e.currentTarget.style.transform = 'scale(1.02)'
                  }}
                  onMouseLeave={(e) => {
                    if(!user) e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <User size={13} strokeWidth={2.5} />
                  {user ? 'Sign Out' : 'Sign In'}
                </button>
              </div>
            </>
          )}

          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Logo label on mobile */}
              <span style={{ fontFamily: F_SANS, fontSize: '13px', fontWeight: '700', color: theme.text, letterSpacing: '-0.02em' }}>
                Certify<span style={{ color: theme.gold }}>ROI</span>
              </span>
              <div style={{ width: '1px', height: '16px', background: borderColor }} />
              <button
                onClick={user ? onSignOut : onSignIn}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: user ? (isDark ? 'var(--border-subtle)' : 'transparent') : 'transparent',
                  border: '1px solid ' + borderColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: theme.text2, flexShrink: 0,
                }}
              >
                <User size={14} strokeWidth={2.5} />
              </button>
              <motion.button
                onClick={() => setMenuOpen((v) => !v)}
                whileTap={{ scale: 0.9 }}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  border: '1px solid ' + borderColor,
                  background: menuOpen ? (isDark ? 'transparent' : 'transparent') : (isDark ? 'var(--border-subtle)' : 'transparent'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: theme.text2, flexShrink: 0,
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={menuOpen ? 'x' : 'menu'}
                    initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {menuOpen ? <X size={15} strokeWidth={2} /> : <Menu size={15} strokeWidth={2} />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>

      <MobileMenuPanel
        isOpen={isMobile && menuOpen}
        theme={{...theme, user, onSignIn}}
        onClose={() => setMenuOpen(false)}
        activeHref={activeHref}
        onActivate={setActiveHref}
        isDark={isDark}
        onToggle={toggleTheme}
        onNavigate={onNavigate}
        navItems={activeNavItems}
      />
    </>
  )
}
