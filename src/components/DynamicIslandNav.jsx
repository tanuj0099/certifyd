import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, User, X } from 'lucide-react'
import { useTheme } from '../hooks/useTheme.jsx'
import UserAccountMenu from './UserAccountMenu.jsx'

const F_SANS = "'Inter', 'DM Sans', sans-serif"
const F_MONO = "'JetBrains Mono', 'IBM Plex Mono', monospace"

const CORE_NAV = [
  { label: 'Home', pageId: 'home' },
  { label: 'Tools', pageId: 'app' },
]

const TOOL_NAV = [
  { label: 'Dashboard', pageId: 'app', description: 'ROI calculator' },
  { label: 'Market Pulse', pageId: 'tools/market', description: 'Live role demand' },
  { label: 'Cert Radar', pageId: 'tools/cert-radar', description: 'Certification pipeline' },
]

function hrefFor(pageId) {
  return pageId === 'home' ? '/' : `/${pageId}`
}

function isActivePage(currentPage, pageId) {
  if (pageId === 'home') return currentPage === 'home'
  if (pageId === 'app') return currentPage === 'app'
  return currentPage === pageId
}

function navigateTo(event, item, onNavigate, onActivate, onClose) {
  event.preventDefault()
  onActivate(item.pageId)
  onNavigate?.(item.pageId)
  onClose?.()
}

function NavLink({ item, active, onNavigate, onActivate, compact = false, variant = 'core' }) {
  return (
    <a
      href={hrefFor(item.pageId)}
      onClick={(event) => navigateTo(event, item, onNavigate, onActivate)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '34px',
        padding: compact ? '0 12px' : variant === 'tool' ? '0 14px' : '0 12px',
        borderRadius: '999px',
        border: variant === 'tool' ? '1px solid var(--border)' : '1px solid transparent',
        background: active ? 'var(--text)' : 'transparent',
        color: active ? 'var(--bg)' : variant === 'tool' ? 'var(--text-2)' : 'var(--text-2)',
        textDecoration: 'none',
        fontFamily: F_SANS,
        fontSize: compact ? '12px' : '13px',
        fontWeight: active ? 800 : variant === 'tool' ? 700 : 600,
        letterSpacing: 0,
        whiteSpace: 'nowrap',
        transition: 'background 180ms ease, color 180ms ease, border-color 180ms ease',
      }}
    >
      {item.label}
      {active ? (
        <motion.span
          layoutId="dynamic-island-active-dot"
          style={{
            position: 'absolute',
            bottom: '4px',
            left: '50%',
            width: '18px',
            height: '1px',
            transform: 'translateX(-50%)',
            background: active ? 'var(--bg)' : 'var(--text)',
          }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        />
      ) : null}
    </a>
  )
}

// ─── Watch-inspired Sun/Moon animation ────────────────────────────────────────
function SunIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {/* Rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
        <motion.line
          key={deg}
          x1="8" y1="8"
          x2={8 + 5.5 * Math.cos((deg * Math.PI) / 180)}
          y2={8 + 5.5 * Math.sin((deg * Math.PI) / 180)}
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ delay: i * 0.04, duration: 0.28, ease: 'easeOut' }}
          style={{ transformOrigin: '8px 8px' }}
        />
      ))}
      {/* Core circle */}
      <motion.circle
        cx="8" cy="8" r="2.8"
        stroke="currentColor" strokeWidth="1.3" fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ transformOrigin: '8px 8px' }}
      />
    </svg>
  )
}

function MoonIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {/* Moon crescent path — precise watch-complication style */}
      <motion.path
        d="M11.5 8.5C11.5 11.538 9.038 14 6 14C4.46 14 3.07 13.37 2.07 12.36C2.69 12.51 3.34 12.59 4 12.59C7.64 12.59 10.59 9.64 10.59 6C10.59 5.34 10.51 4.69 10.36 4.07C11.08 5 11.5 6.2 11.5 7.5V8.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
      />
      {/* Stars */}
      {[{ cx: 13, cy: 4 }, { cx: 11.5, cy: 2 }].map((star, i) => (
        <motion.circle
          key={i}
          cx={star.cx} cy={star.cy} r="0.9"
          fill="currentColor"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.1, duration: 0.2 }}
          style={{ transformOrigin: `${star.cx}px ${star.cy}px` }}
        />
      ))}
    </svg>
  )
}

function SystemIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {/* Half-circle left = moon, right = sun */}
      <motion.path
        d="M8 2.5 A5.5 5.5 0 0 0 8 13.5"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.4 }}
      />
      <motion.path
        d="M8 2.5 A5.5 5.5 0 0 1 8 13.5"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"
        strokeDasharray="2 2"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      />
      <motion.circle
        cx="8" cy="8" r="1.8"
        stroke="currentColor" strokeWidth="1.2" fill="none"
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 20 }}
        style={{ transformOrigin: '8px 8px' }}
      />
    </svg>
  )
}

// ─── Theme Toggle Button ──────────────────────────────────────────────────────
function ThemeToggle({ mode, onCycle }) {
  const [open, setOpen] = useState(false)

  const options = [
    { id: 'light', label: 'Light', Icon: SunIcon },
    { id: 'dark', label: 'Dark', Icon: MoonIcon },
    { id: 'system', label: 'Auto', Icon: SystemIcon },
  ]

  const current = options.find(o => o.id === mode) || options[2]
  const CurrentIcon = current.Icon

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label={`Theme: ${current.label}. Click to change.`}
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          height: '32px',
          padding: '0 11px',
          borderRadius: '999px',
          border: '1px solid var(--border)',
          background: open ? 'var(--border)' : 'transparent',
          color: 'var(--text-2)',
          fontFamily: F_MONO,
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'background 180ms ease, color 180ms ease',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={current.id}
            initial={{ opacity: 0, scale: 0.7, rotate: -15 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.7, rotate: 15 }}
            transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <CurrentIcon size={13} />
          </motion.span>
        </AnimatePresence>
        {current.label}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop to close */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 9997 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                position: 'absolute',
                top: '40px',
                right: 0,
                zIndex: 9998,
                padding: '6px',
                borderRadius: '16px',
                border: '1px solid var(--border-mid)',
                background: 'var(--bg)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                minWidth: '130px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
              }}
            >
              {options.map((opt) => {
                const Icon = opt.Icon
                const active = mode === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onCycle(opt.id)
                      setOpen(false)
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: 'none',
                      background: active ? 'var(--text)' : 'transparent',
                      color: active ? 'var(--bg)' : 'var(--text-2)',
                      fontFamily: F_SANS,
                      fontSize: '13px',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 140ms, color 140ms',
                    }}
                  >
                    <Icon size={14} />
                    {opt.label}
                    {opt.id === 'system' && (
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '9px',
                        fontFamily: F_MONO,
                        letterSpacing: '0.08em',
                        opacity: 0.5,
                      }}>
                        OS
                      </span>
                    )}
                  </button>
                )
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function MobileMenu({ open, currentPage, onNavigate, onActivate, onClose, user, onSignIn, onSignOut, themeMode, onThemeCycle }) {
  const sections = useMemo(() => {
    const account = user
      ? [{ label: 'Profile', pageId: 'profile', description: user.email || 'Account details' }]
      : []
    return [
      { label: 'Navigate', items: CORE_NAV },
      { label: 'Tools', items: TOOL_NAV },
      ...(account.length ? [{ label: 'Account', items: account }] : []),
    ]
  }, [user])

  const themeOptions = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'system', label: 'Auto (OS)' },
  ]

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 360, damping: 32 }}
          style={{
            position: 'fixed',
            top: '78px',
            left: '14px',
            right: '14px',
            zIndex: 9998,
            padding: '14px',
            borderRadius: '24px',
            border: '1px solid var(--border-mid)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(18px) saturate(150%)',
            WebkitBackdropFilter: 'blur(18px) saturate(150%)',
          }}
        >
          {sections.map((section) => (
            <div key={section.label} style={{ marginBottom: '14px' }}>
              <div
                style={{
                  margin: '0 0 8px 4px',
                  color: 'var(--text-4)',
                  fontFamily: F_MONO,
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                {section.label}
              </div>
              <div style={{ display: 'grid', gap: '6px' }}>
                {section.items.map((item) => {
                  const active = isActivePage(currentPage, item.pageId)
                  return (
                    <a
                      key={item.pageId}
                      href={hrefFor(item.pageId)}
                      onClick={(event) => navigateTo(event, item, onNavigate, onActivate, onClose)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        padding: '13px 14px',
                        borderRadius: '14px',
                        border: '1px solid var(--border)',
                        background: active ? 'var(--text)' : 'transparent',
                        color: active ? 'var(--bg)' : 'var(--text)',
                        textDecoration: 'none',
                        fontFamily: F_SANS,
                      }}
                    >
                      <span style={{ fontSize: '15px', fontWeight: 750 }}>{item.label}</span>
                      {item.description ? (
                        <span style={{ color: active ? 'var(--bg)' : 'var(--text-3)', fontSize: '12px' }}>
                          {item.description}
                        </span>
                      ) : null}
                    </a>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Theme switcher row */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              margin: '0 0 8px 4px',
              color: 'var(--text-4)',
              fontFamily: F_MONO,
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>
              Appearance
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {themeOptions.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onThemeCycle(opt.id)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: themeMode === opt.id ? 'var(--text)' : 'transparent',
                    color: themeMode === opt.id ? 'var(--bg)' : 'var(--text-2)',
                    fontFamily: F_SANS,
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 180ms ease',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (user) {
                onNavigate?.('profile')
              } else {
                onSignIn?.()
              }
              onClose()
            }}
            style={{
              width: '100%',
              minHeight: '44px',
              borderRadius: '999px',
              border: '1px solid var(--border)',
              background: user ? 'var(--text)' : 'var(--text)',
              color: 'var(--bg)',
              fontFamily: F_SANS,
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {user ? 'My profile' : 'Sign In'}
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

const DynamicIslandNav = React.memo(({ onNavigate, currentPage, user, onSignIn, onSignOut }) => {
  const [activeHref, setActiveHref] = useState(currentPage || 'home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { mode: themeMode, setThemeMode: cycleTheme } = useTheme()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 820)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (currentPage) setActiveHref(currentPage)
  }, [currentPage])

  const desktopItems = CORE_NAV

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: '14px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          pointerEvents: 'none',
          width: 'min(calc(100vw - 24px), 920px)',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <motion.nav
          layout
          initial={{ y: -56, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 150, damping: 24 }}
          style={{
            pointerEvents: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: isMobile ? '54px' : '52px',
            minWidth: isMobile ? '0' : '720px',
            padding: isMobile ? '0 12px' : '0 16px',
            gap: isMobile ? '10px' : '8px',
            borderRadius: '999px',
            border: '1px solid var(--border-mid)',
            outline: '1px solid var(--border)',
            outlineOffset: '-3px',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(18px) saturate(160%)',
            WebkitBackdropFilter: 'blur(18px) saturate(160%)',
          }}
          aria-label="Primary navigation"
        >
          {isMobile ? (
            <>
              <span
                style={{
                  color: 'var(--text)',
                  fontFamily: F_SANS,
                  fontSize: '14px',
                  fontWeight: 850,
                  letterSpacing: 0,
                }}
              >
                CertifyROI
              </span>
              <div style={{ width: '1px', height: '18px', background: 'var(--border)' }} />
              <button
                type="button"
                onClick={() => (user ? onNavigate?.('profile') : onSignIn?.())}
                aria-label={user ? 'Open profile' : 'Sign in'}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '999px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <User size={15} />
              </button>
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                aria-expanded={menuOpen}
                aria-label="Open navigation"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '999px',
                  border: '1px solid var(--border)',
                  background: menuOpen ? 'var(--text)' : 'transparent',
                  color: menuOpen ? 'var(--bg)' : 'var(--text-2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {menuOpen ? <X size={15} /> : <Menu size={15} />}
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                {desktopItems.map((item) => (
                  <NavLink
                    key={item.pageId}
                    item={item}
                    active={isActivePage(activeHref, item.pageId)}
                    onNavigate={onNavigate}
                    onActivate={setActiveHref}
                  />
                ))}
              </div>
              <div style={{ width: '1px', height: '22px', background: 'var(--border)', margin: '0 6px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {TOOL_NAV.slice(1).map((item) => (
                  <NavLink
                    key={item.pageId}
                    item={item}
                    active={isActivePage(activeHref, item.pageId)}
                    onNavigate={onNavigate}
                    onActivate={setActiveHref}
                    variant="tool"
                  />
                ))}
              </div>
              <div style={{ width: '1px', height: '22px', background: 'var(--border)', margin: '0 6px' }} />
              {/* Theme Toggle — replaces broken Nordic/Ash badge */}
              <ThemeToggle mode={themeMode} onCycle={cycleTheme} />
              {user ? (
                <UserAccountMenu user={user} onNavigate={onNavigate} onSignOut={onSignOut} />
              ) : (
                <button
                  type="button"
                  onClick={() => onSignIn?.()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    height: '34px',
                    padding: '0 15px',
                    borderRadius: '999px',
                    border: '1px solid var(--border)',
                    background: 'var(--text)',
                    color: 'var(--bg)',
                    fontFamily: F_SANS,
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <User size={13} />
                  Sign In
                </button>
              )}
            </>
          )}
        </motion.nav>
      </div>

      <MobileMenu
        open={isMobile && menuOpen}
        currentPage={activeHref}
        onNavigate={onNavigate}
        onActivate={setActiveHref}
        onClose={() => setMenuOpen(false)}
        user={user}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
        themeMode={themeMode}
        onThemeCycle={cycleTheme}
      />
    </>
  )
})

export default DynamicIslandNav
