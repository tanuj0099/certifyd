import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Menu, User, X, Home, BookOpen,
  LayoutDashboard, ChevronRight,
  Radio, BarChart2, Wrench,
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme.jsx'
import UserAccountMenu from './UserAccountMenu.jsx'
import { useNavigate, useLocation } from 'react-router-dom'
import { useJourneyStore } from '../store/useJourneyStore.js'

const F_SANS = "'Inter', 'DM Sans', sans-serif"
const F_MONO = "'JetBrains Mono', 'IBM Plex Mono', monospace"

// ── Nav definitions ─────────────────────────────────────────
const ANON_NAV = [
  { label: 'Home',           pageId: 'home' },
  { label: 'Tools',          pageId: 'tools' },
  { label: 'ROI Calculator', pageId: 'app', isRoi: true },
  { label: 'Cert Radar',     pageId: 'tools/cert-radar' },
  { label: 'Market Pulse',   pageId: 'tools/market' },
  { label: 'Offer Analysis', pageId: 'offer-analysis' },
  { label: 'Blog',           pageId: 'blog' },
]

// Auth users see all core features alongside their Dashboard
const AUTH_NAV = [
  { label: 'Home',           pageId: 'home' },
  { label: 'Tools',          pageId: 'tools' },
  { label: 'ROI Calculator', pageId: 'app', isRoi: true },
  { label: 'Cert Radar',     pageId: 'tools/cert-radar' },
  { label: 'Market Pulse',   pageId: 'tools/market' },
  { label: 'Offer Analysis', pageId: 'offer-analysis' },
  { label: 'Dashboard',      pageId: 'dashboard' },
  { label: 'Blog',           pageId: 'blog' },
]

// ── Mobile bottom tab bar config ───────────────────────────
// Home | Cert Radar | ROI | Tools hub | Sign In / Profile
// Tools hub (/tools) contains: Market Pulse, Offer Analysis, Resume Analyzer,
// Cert Compare, CKA Roadmap etc. — all tool pages in one place.
const MOBILE_TABS_ANON = [
  { label: 'Home',      pageId: 'home',             Icon: Home },
  { label: 'Cert Radar',pageId: 'tools/cert-radar', Icon: Radio },
  { label: 'ROI',       pageId: 'app',              Icon: BarChart2, isRoi: true },
  { label: 'Tools',     pageId: 'tools',            Icon: Wrench },
  { label: 'Sign In',   pageId: '__signin__',        Icon: User },
]
const MOBILE_TABS_AUTH = [
  { label: 'Home',      pageId: 'home',      Icon: Home },
  { label: 'Blog',      pageId: 'blog',      Icon: BookOpen },
  { label: 'Dashboard', pageId: 'dashboard', Icon: LayoutDashboard },
  { label: 'Profile',   pageId: 'profile',   Icon: User },
]

// ── Helpers ────────────────────────────────────────────────
function hrefFor(itemOrPageId) {
  if (!itemOrPageId) return '/'
  if (typeof itemOrPageId === 'string') {
    const pageId = itemOrPageId
    return pageId === 'home' ? '/' : `/${pageId}`
  }
  if (itemOrPageId.href) return itemOrPageId.href
  const pageId = itemOrPageId.pageId || 'home'
  return pageId === 'home' ? '/' : `/${pageId}`
}

function isActivePage(currentPage, pageId) {
  if (pageId === 'home') return currentPage === 'home'
  if (pageId === 'app') return currentPage === 'app'
  return currentPage === pageId
}

function doNavigate(event, item, onNavigate, onActivate, onClose, navigate, onSignIn) {
  event.preventDefault()
  if (item.label === 'ROI Calculator') {
    const s = useJourneyStore.getState();
    if (s.resetMode) s.resetMode();
    if (s.setActiveTab) s.setActiveTab('resume');
  }
  if (item.pageId === '__signin__') { onSignIn?.(); onClose?.(); return }
  if (item.isRoi) { navigate('/app'); onActivate?.('app'); onClose?.(); return }
  if (item.href) {
    if (item.href.startsWith('#')) { window.location.hash = item.href.slice(1) }
    else { navigate(item.href) }
    onClose?.(); return
  }
  const route = item.pageId === 'home' ? '/' : `/${item.pageId}`
  navigate(route)
  onActivate?.(item.pageId)
  onClose?.()
}

// ── Desktop NavLink ────────────────────────────────────────
function NavLink({ item, active, onNavigate, onActivate, navigate }) {
  const href = item.href ?? hrefFor(item)
  return (
    <a
      href={href}
      onClick={(e) => doNavigate(e, item, onNavigate, onActivate, undefined, navigate)}
      style={{
        position: 'relative',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '34px', padding: '0 8px', borderRadius: '999px',
        border: '1px solid transparent',
        background: active ? 'var(--text)' : 'transparent',
        color: active ? 'var(--bg)' : 'var(--text-2)',
        textDecoration: 'none', fontFamily: F_SANS,
        fontSize: '12px', fontWeight: 500, letterSpacing: '0.025em',
        whiteSpace: 'nowrap',
        transition: 'background 180ms ease, color 180ms ease',
      }}
    >
      {item.label}
      {active && (
        <motion.span
          layoutId="desktop-active-dot"
          style={{
            position: 'absolute', bottom: '4px', left: '50%',
            width: '18px', height: '1px',
            transform: 'translateX(-50%)',
            background: 'var(--bg)',
          }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        />
      )}
    </a>
  )
}

// ── Theme icons ────────────────────────────────────────────
function SunIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {[0,45,90,135,180,225,270,315].map((deg,i)=>(
        <motion.line key={deg} x1="8" y1="8"
          x2={8+5.5*Math.cos(deg*Math.PI/180)} y2={8+5.5*Math.sin(deg*Math.PI/180)}
          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
          initial={{opacity:0,scaleY:0}} animate={{opacity:1,scaleY:1}}
          transition={{delay:i*0.04,duration:0.28}} style={{transformOrigin:'8px 8px'}}
        />
      ))}
      <motion.circle cx="8" cy="8" r="2.8" stroke="currentColor" strokeWidth="1.3" fill="none"
        initial={{scale:0}} animate={{scale:1}} transition={{duration:0.32}} style={{transformOrigin:'8px 8px'}}
      />
    </svg>
  )
}
function MoonIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <motion.path d="M11.5 8.5C11.5 11.538 9.038 14 6 14C4.46 14 3.07 13.37 2.07 12.36C2.69 12.51 3.34 12.59 4 12.59C7.64 12.59 10.59 9.64 10.59 6C10.59 5.34 10.51 4.69 10.36 4.07C11.08 5 11.5 6.2 11.5 7.5V8.5Z"
        stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"
        initial={{pathLength:0,opacity:0}} animate={{pathLength:1,opacity:1}} transition={{duration:0.45}}
      />
    </svg>
  )
}
function SystemIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <motion.path d="M8 2.5 A5.5 5.5 0 0 0 8 13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
        initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:0.4}}
      />
      <motion.path d="M8 2.5 A5.5 5.5 0 0 1 8 13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2"
        initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:0.4,delay:0.1}}
      />
      <motion.circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.2" fill="none"
        initial={{scale:0}} animate={{scale:1}} transition={{delay:0.3,type:'spring',stiffness:400,damping:20}} style={{transformOrigin:'8px 8px'}}
      />
    </svg>
  )
}

// ── Theme toggle ───────────────────────────────────────────
function ThemeToggle({ mode, onCycle }) {
  const handleCycle = () => {
    if (mode === 'dark') onCycle('light')
    else if (mode === 'light') onCycle('system')
    else onCycle('dark')
  }
  
  const options = [
    { id: 'light',  label: 'Light',    Icon: SunIcon },
    { id: 'dark',   label: 'Dark',     Icon: MoonIcon },
    { id: 'system', label: 'Auto',     Icon: SystemIcon },
  ]
  const current = options.find(o => o.id === mode) || options[2]
  const CurrentIcon = current.Icon
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" aria-label={`Theme: ${current.label}`} onClick={handleCycle}
        style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'34px', height:'34px', borderRadius:'50%', border:'1px solid var(--border)', background:'transparent', color:'var(--text-2)', cursor:'pointer', transition:'all 180ms ease' }}>
        <AnimatePresence mode="wait">
          <motion.span key={current.id} initial={{opacity:0,scale:0.7,rotate:-15}} animate={{opacity:1,scale:1,rotate:0}} exit={{opacity:0,scale:0.7,rotate:15}} transition={{duration:0.22}} style={{display:'flex',alignItems:'center'}}>
            <CurrentIcon size={14} />
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  )
}

// ── Mobile hamburger menu (full-screen overlay for extra items) ─
function MobileMenu({ open, currentPage, onNavigate, onActivate, onClose, user, onSignIn, onSignOut, themeMode, onThemeCycle, navItems }) {
  const items = navItems || (user ? AUTH_NAV : ANON_NAV)
  const navigate = useNavigate()

  const themeOptions = [
    { id: 'light',  label: 'Light' },
    { id: 'dark',   label: 'Dark' },
    { id: 'system', label: 'Auto (OS)' },
  ]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity:0, y:-10, scale:0.98 }}
          animate={{ opacity:1, y:0, scale:1 }}
          exit={{ opacity:0, y:-8, scale:0.98 }}
          transition={{ type:'spring', stiffness:360, damping:32 }}
          style={{ position:'fixed', top:'78px', left:'14px', right:'14px', zIndex:9998, padding:'14px', borderRadius:'24px', border:'1px solid var(--border-mid)', background:'var(--bg)', backdropFilter:'blur(18px) saturate(150%)', WebkitBackdropFilter:'blur(18px) saturate(150%)' }}
        >
          <div style={{ margin:'0 0 8px 4px', color:'var(--text-4)', fontFamily:F_MONO, fontSize:'10px', letterSpacing:'0.12em', textTransform:'uppercase' }}>Navigate</div>
          <div style={{ display:'grid', gap:'5px', marginBottom:'16px' }}>
            {items.map(item => {
              const active = isActivePage(currentPage, item.pageId)
              return (
                <a key={item.pageId||item.label} href={hrefFor(item)}
                  onClick={(e) => doNavigate(e, item, onNavigate, onActivate, onClose, navigate, onSignIn)}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'14px', padding:'12px 14px', borderRadius:'12px', border:'1px solid var(--border)', background: active ? 'var(--text)':'transparent', color: active ? 'var(--bg)':'var(--text)', textDecoration:'none', fontFamily:F_SANS }}>
                  <span style={{ fontSize:'15px', fontWeight:750 }}>{item.label}</span>
                  <ChevronRight size={14} color={active ? 'var(--bg)' : 'var(--text-4)'} />
                </a>
              )
            })}
          </div>

          <div style={{ marginBottom:'12px' }}>
            <div style={{ margin:'0 0 8px 4px', color:'var(--text-4)', fontFamily:F_MONO, fontSize:'10px', letterSpacing:'0.12em', textTransform:'uppercase' }}>Appearance</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px' }}>
              {themeOptions.map(opt => (
                <button key={opt.id} type="button" onClick={() => onThemeCycle(opt.id)}
                  style={{ padding:'10px 8px', borderRadius:'12px', border:'1px solid var(--border)', background: themeMode===opt.id ? 'var(--text)':'transparent', color: themeMode===opt.id ? 'var(--bg)':'var(--text-2)', fontFamily:F_SANS, fontSize:'12px', fontWeight:700, cursor:'pointer', textAlign:'center', transition:'all 180ms ease' }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button type="button"
            onClick={() => { if (user) { navigate('/profile'); onClose() } else { onSignIn?.(); onClose() } }}
            style={{ width:'100%', minHeight:'44px', borderRadius:'999px', border:'none', background:'var(--text)', color:'var(--bg)', fontFamily:F_SANS, fontSize:'14px', fontWeight:800, cursor:'pointer' }}>
            {user ? 'My profile' : 'Sign In'}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Mobile bottom tab bar (Spotify-style) ──────────────────
function MobileBottomBar({ currentPage, user, onSignIn, onNavigate }) {
  const navigate = useNavigate()
  const tabs = user ? MOBILE_TABS_AUTH : MOBILE_TABS_ANON

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 28, delay: 0.2 }}
      style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 9999,
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'space-around',
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: 'calc(56px + env(safe-area-inset-bottom))',
      }}
    >
      {tabs.map(tab => {
        const { Icon, label, pageId } = tab
        const active = isActivePage(currentPage, pageId)
        return (
          <button
            key={pageId}
            type="button"
            aria-label={label}
            onClick={(e) => {
              if (pageId === '__signin__') { onSignIn?.(); return }
              if (pageId === 'profile') { navigate('/profile'); return }
              doNavigate(
                { preventDefault: () => {} },
                tab, onNavigate, undefined, undefined, navigate, onSignIn
              )
            }}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '4px',
              background: 'none', border: 'none',
              cursor: 'pointer',
              color: active ? 'var(--text)' : 'var(--text-4)',
              transition: 'color 160ms ease',
              padding: '0 4px',
              minWidth: 0,
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon
                size={active ? 22 : 20}
                strokeWidth={active ? 2.2 : 1.6}
                style={{ transition: 'all 160ms ease' }}
              />
              {active && (
                <motion.div
                  layoutId="bottom-tab-indicator"
                  style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: '50%', transform: 'translateX(-50%)',
                    width: '16px', height: '2px',
                    borderRadius: '999px',
                    background: 'var(--text)',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                />
              )}
            </div>
            <span style={{
              fontFamily: F_SANS,
              fontSize: '9px',
              fontWeight: active ? 800 : 500,
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}>
              {label}
            </span>
          </button>
        )
      })}
    </motion.div>
  )
}

// ── Main DynamicIslandNav ──────────────────────────────────
const DynamicIslandNav = React.memo(({ onNavigate, currentPage, user, onSignIn, onSignOut }) => {
  const [activeHref, setActiveHref] = useState(currentPage || 'home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { mode: themeMode, setThemeMode: cycleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 820)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Sync active page from prop OR from live URL path
  useEffect(() => {
    if (currentPage) {
      setActiveHref(currentPage)
    } else {
      const path = (location.pathname || '').toLowerCase()
      if (path === '/' || path === '') setActiveHref('home')
      else if (path.startsWith('/tools/')) setActiveHref(path.slice(1))
      else setActiveHref(path.slice(1) || 'home')
    }
  }, [currentPage, location.pathname])

  const navItems = useMemo(() => (user ? AUTH_NAV : ANON_NAV), [user])

  return (
    <>
      {/* ── Top capsule — DESKTOP ONLY ─────────────────────────────── */}
      {!isMobile && (
        <div style={{ position:'fixed', top:'14px', left:'50%', transform:'translateX(-50%)', zIndex:9999, pointerEvents:'none', display:'flex', justifyContent:'center' }}>
          <motion.nav
            layout
            initial={{ y:-56, opacity:0, scale:0.96 }}
            animate={{ y:0, opacity:1, scale:1 }}
            transition={{ type:'spring', stiffness:150, damping:24 }}
            className="transition-all duration-300 ease-in-out flex items-center justify-between"
            style={{
              pointerEvents: 'auto',
              width: 'auto',
              maxWidth: '100%',
              padding: '10px 24px',
              borderRadius: '999px',
              border: '1px solid var(--border-mid)',
              outline: '1px solid var(--border)',
              outlineOffset: '-3px',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(18px) saturate(160%)',
              WebkitBackdropFilter: 'blur(18px) saturate(160%)',
              boxSizing: 'border-box',
              overflow: 'visible',
              whiteSpace: 'nowrap'
            }}
            aria-label="Primary navigation"
          >
            <button type="button" aria-label="Go to home"
              onClick={() => { try { navigate(user ? '/dashboard' : '/') } catch (e) { window.location.href = user ? '/dashboard' : '/' } }}
              style={{ background:'none', border:'none', padding:'0 10px 0 0', cursor:'pointer', color:'var(--text)', fontFamily:F_SANS, fontSize:'13px', fontWeight:800, letterSpacing:'-0.01em', flexShrink:0 }}>
              CertifyROI
            </button>
            <div style={{ width:'1px', height:'18px', background:'var(--border)', flexShrink:0 }} />
            <div style={{ display:'flex', alignItems:'center', gap:'16px', padding: '0 16px' }}>
              {navItems.map(item => (
                <NavLink key={item.pageId||item.label} item={item} active={isActivePage(activeHref, item.pageId)} onNavigate={onNavigate} onActivate={setActiveHref} navigate={navigate} />
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'4px', marginLeft:'4px' }}>
              <div style={{ width:'1px', height:'22px', background:'var(--border)' }} />
              <ThemeToggle mode={themeMode} onCycle={cycleTheme} />
              {user
                ? <UserAccountMenu user={user} onNavigate={onNavigate} onSignOut={onSignOut} />
                : <button type="button" onClick={() => onSignIn?.()}
                    style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'7px', height:'34px', padding:'0 15px', borderRadius:'999px', border:'1px solid var(--border)', background:'var(--text)', color:'var(--bg)', fontFamily:F_SANS, fontSize:'12px', fontWeight:800, cursor:'pointer' }}>
                    <User size={13} />Sign In
                  </button>
              }
            </div>
          </motion.nav>
        </div>
      )}

      {/* ── Mobile hamburger overlay ─────────────────── */}
      <MobileMenu
        open={isMobile && menuOpen}
        currentPage={activeHref}
        onNavigate={onNavigate}
        onActivate={setActiveHref}
        onClose={() => setMenuOpen(false)}
        user={user} onSignIn={onSignIn} onSignOut={onSignOut}
        themeMode={themeMode} onThemeCycle={cycleTheme}
        navItems={navItems}
      />

      {/* ── Mobile bottom tab bar ─────────────────────── */}
      {isMobile && (
        <MobileBottomBar
          currentPage={activeHref}
          user={user}
          onSignIn={onSignIn}
          onNavigate={onNavigate}
        />
      )}
    </>
  )
})

export default DynamicIslandNav
