'use client';

import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Menu, User, X, Home, BookOpen,
  LayoutDashboard, ChevronRight,
  Radio, BarChart2, Wrench, Briefcase,
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme.jsx'
import UserAccountMenu from './UserAccountMenu.jsx'
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], weight: '900' });

import { useJourneyStore } from '../store/useJourneyStore.js'

const F_SANS = "var(--font-sans)";
const F_MONO = "var(--font-mono)";

//  Nav definitions
// workspaceTab: sets the active tab in the workspace and smooth-scrolls to
// #workspace when on the home page. href: is the fallback page to push to
// when #workspace is not present in the DOM (any other page).
const ANON_NAV = [
  { label: 'Home',           pageId: 'home' },
  { label: 'Tools',          pageId: 'tools' },
  { label: 'ROI Calculator', pageId: 'tools/roi' },
  { label: 'Cert Radar',     pageId: 'tools/cert-radar' },
  { label: 'Market Pulse',   pageId: 'tools/market' },
  { label: 'Offer Analysis', pageId: 'offer-analysis' },
  { label: 'Blog',           pageId: 'blog' },
]

// Auth users see all core features alongside their Dashboard
const AUTH_NAV = [
  { label: 'Home',           pageId: 'home' },
  { label: 'Tools',          pageId: 'tools' },
  { label: 'ROI Calculator', pageId: 'tools/roi' },
  { label: 'Cert Radar',     pageId: 'tools/cert-radar' },
  { label: 'Market Pulse',   pageId: 'tools/market' },
  { label: 'Offer Analysis', pageId: 'offer-analysis' },
  { label: 'Dashboard',      pageId: 'dashboard' },
  { label: 'Blog',           pageId: 'blog' },
]

//  Mobile bottom tab bar config
// Home | Cert Radar | ROI | Tools hub | Sign In / Profile
const MOBILE_TABS_ANON = [
  { label: 'Home',       pageId: 'home',             Icon: Home },
  { label: 'Cert Radar', pageId: 'tools/cert-radar', Icon: Radio },
  { label: 'ROI Calc',   pageId: 'tools/roi',        Icon: BarChart2 },
  { label: 'Tools',      pageId: 'tools',            Icon: Wrench },
  { label: 'Sign In',    pageId: '__signin__',       Icon: User },
]
const MOBILE_TABS_AUTH = [
  { label: 'Home',       pageId: 'home',             Icon: Home },
  { label: 'Cert Radar', pageId: 'tools/cert-radar', Icon: Radio },
  { label: 'ROI Calc',   pageId: 'tools/roi',        Icon: BarChart2 },
  { label: 'Dashboard',  pageId: 'dashboard',        Icon: LayoutDashboard },
  { label: 'Profile',    pageId: 'profile',          Icon: User },
]

//  Helpers 
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

function isActivePage(currentPage, pageIdOrHref) {
  if (!pageIdOrHref) return false
  if (pageIdOrHref === 'home') return currentPage === 'home'
  
  // Strip leading slash from href to match currentPage format (e.g. 'tools/roi')
  const target = pageIdOrHref.startsWith('/') ? pageIdOrHref.slice(1) : pageIdOrHref;
  return currentPage === target
}

// pathname-aware workspace navigation:
//   '/'        → stay on page, smooth scroll to #workspace
//   anything else → go to the requested tool's page
function scrollToWorkspace(pathname, router, fallbackHref) {
  if (pathname === '/') {
    setTimeout(() => document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' }), 50)
  } else {
    if (fallbackHref) {
      router.push(fallbackHref)
    } else {
      router.push('/')
    }
  }
}

function doNavigate(event, item, onNavigate, onActivate, onClose, router, onSignIn, pathname) {
  event.preventDefault()
  if (item.pageId === '__signin__') { onSignIn?.(); onClose?.(); return }

  // Workspace tab items: update store + scroll-or-navigate home
  if (item.workspaceTab) {
    const s = useJourneyStore.getState()
    if (s.setActiveTab) s.setActiveTab(item.workspaceTab)
    scrollToWorkspace(pathname, router, item.href)
    onClose?.()
    return
  }

  if (item.href) {
    if (item.href.startsWith('#')) { window.location.hash = item.href.slice(1) }
    else { router.push(item.href) }
    onClose?.(); return
  }
  const route = item.pageId === 'home' ? '/' : `/${item.pageId}`
  router.push(route)
  onActivate?.(item.pageId)
  onClose?.()
}

//  Desktop NavLink
function NavLink({ item, active, onNavigate, onActivate, router, pathname }) {
  const F_SANS = "var(--font-sans)";
  // For workspaceTab items we render a button (no page navigation)
  const isWorkspace = !!item.workspaceTab
  const href = isWorkspace ? undefined : (item.pageId ? `/${item.pageId}` : item.href)

  const sharedStyle = {
    position: 'relative',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '34px', padding: '0 16px', borderRadius: '999px',
    color: 'var(--text)',
    opacity: active ? 1 : 0.65,
    textDecoration: 'none', fontFamily: F_SANS,
    fontSize: '13.5px', fontWeight: active ? 600 : 500, letterSpacing: '0.01em',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    background: 'none', border: 'none', cursor: 'pointer',
  }

  const hoverHandlers = {
    onMouseOver: (e) => { if (!active) e.currentTarget.style.opacity = '1'; },
    onMouseOut:  (e) => { if (!active) e.currentTarget.style.opacity = '0.65'; },
  }

  const inner = (
    <>
      <span style={{ position: 'relative', zIndex: 2 }}>{item.label}</span>
      {active && (
        <motion.div
          layoutId="desktop-active-pill"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '999px',
            background: 'color-mix(in srgb, var(--text) 6%, transparent)',
            backdropFilter: 'blur(12px)',
            border: '1px solid color-mix(in srgb, var(--text) 8%, transparent)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04), inset 0 1px 0 color-mix(in srgb, var(--bg) 20%, transparent)',
            zIndex: 0,
          }}
          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
        />
      )}
    </>
  )

  if (isWorkspace) {
    return (
      <button
        type="button"
        onClick={(e) => doNavigate(e, item, onNavigate, onActivate, undefined, router, undefined, pathname)}
        style={sharedStyle}
        {...hoverHandlers}
      >
        {inner}
      </button>
    )
  }

  return (
    <a
      href={href}
      onClick={(e) => doNavigate(e, item, onNavigate, onActivate, undefined, router, undefined, pathname)}
      style={sharedStyle}
      {...hoverHandlers}
    >
      {inner}
    </a>
  )
}


//  Theme icons 
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

//  Theme toggle 
function ThemeToggle({ mode, onCycle }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

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

  if (!mounted) {
    return (
      <div style={{ position: 'relative' }}>
        <button type="button" 
          style={{ display:'inline-flex', width:'34px', height:'34px', borderRadius:'50%', border:'1px solid var(--border)', background:'transparent' }} />
      </div>
    )
  }

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

//  Mobile hamburger menu (full-screen overlay for extra items)
function MobileMenu({ open, currentPage, onNavigate, onActivate, onClose, user, onSignIn, onSignUp, onSignOut, themeMode, onThemeCycle, navItems, pathname }) {
  const items = navItems || (user ? AUTH_NAV : ANON_NAV)
  const router = useRouter()

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
              const active = isActivePage(currentPage, item.pageId || item.href)

              return (
                <a key={item.pageId||item.label} href={hrefFor(item)}
                  onClick={(e) => doNavigate(e, item, onNavigate, onActivate, onClose, router, onSignIn, pathname)}
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

          {user ? (
            <button type="button"
              onClick={() => { router.push('/profile'); onClose() }}
              style={{ width:'100%', minHeight:'44px', borderRadius:'999px', border:'none', background:'var(--text)', color:'var(--bg)', fontFamily:F_SANS, fontSize:'14px', fontWeight:800, cursor:'pointer' }}>
              My profile
            </button>
          ) : (
            <button type="button"
              onClick={() => { onSignIn?.(); onClose() }}
              style={{ width:'100%', minHeight:'44px', borderRadius:'999px', border:'1px solid var(--border)', background:'transparent', color:'var(--text)', fontFamily:F_SANS, fontSize:'14px', fontWeight:800, cursor:'pointer' }}>
              Sign In
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

//  Mobile bottom tab bar (Spotify-style)
function MobileBottomBar({ currentPage, user, onSignIn, onNavigate, pathname }) {
  const router = useRouter()
  const tabs = user ? MOBILE_TABS_AUTH : MOBILE_TABS_ANON

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 28, delay: 0.2 }}
      style={{
        position: 'fixed',
        bottom: '20px', left: '16px', right: '16px',
        zIndex: 9999,
        background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
        border: '1px solid var(--border-mid)',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'space-around',
        padding: '6px 8px',
        height: '64px',
      }}
    >
      {tabs.map(tab => {
        const { Icon, label, pageId } = tab
        const active = isActivePage(currentPage, pageId || tab.href)
        return (
          <button
            key={pageId || tab.href || label}
            type="button"
            aria-label={label}
            onClick={(e) => {
              if (pageId === '__signin__') { onSignIn?.(); return }
              if (pageId === 'profile') { router.push('/profile'); return }
              if (tab.workspaceTab) {
                const s = useJourneyStore.getState()
                if (s.setActiveTab) s.setActiveTab(tab.workspaceTab)
                scrollToWorkspace(pathname, router, tab.href)
                return
              }
              doNavigate(
                { preventDefault: () => {} },
                tab, onNavigate, undefined, undefined, router, onSignIn, pathname
              )
            }}
            style={{
              position: 'relative',
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '4px',
              background: 'none', border: 'none',
              cursor: 'pointer',
              color: active ? 'var(--text)' : 'var(--text-4)',
              transition: 'color 160ms ease',
              padding: '6px 4px',
              minWidth: 0,
            }}
          >
            {active && (
              <motion.div
                layoutId="mobile-active-pill"
                style={{
                  position: 'absolute',
                  inset: '4px',
                  borderRadius: '16px',
                  background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                  zIndex: 0,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, color: active ? 'var(--accent)' : 'inherit' }}>
              <Icon
                size={active ? 22 : 20}
                strokeWidth={active ? 2.5 : 1.8}
                style={{ transition: 'all 160ms ease' }}
              />
            </div>
            <span style={{
              position: 'relative',
              zIndex: 1,
              fontFamily: F_SANS,
              fontSize: '10px',
              fontWeight: active ? 800 : 500,
              letterSpacing: '0.02em',
              lineHeight: 1,
              color: active ? 'var(--accent)' : 'inherit',
              marginTop: '2px'
            }}>
              {label}
            </span>
          </button>
        )
      })}
    </motion.div>
  )
}

//  Main DynamicIslandNav
const DynamicIslandNav = React.memo(({ onNavigate, currentPage, user, onSignIn, onSignUp, onSignOut }) => {
  const [activeHref, setActiveHref] = useState(currentPage || 'home')
  const [menuOpen, setMenuOpen] = useState(false)
  const { mode: themeMode, setThemeMode: cycleTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname() || '/'

  // Sync active page from prop OR from live URL path
  useEffect(() => {
    if (currentPage) {
      setActiveHref(currentPage)
    } else {
      const path = pathname.toLowerCase()
      if (path === '/' || path === '') setActiveHref('home')
      else if (path.startsWith('/tools/')) setActiveHref(path.slice(1))
      else setActiveHref(path.slice(1) || 'home')
    }
  }, [currentPage, pathname])

  const navItems = useMemo(() => (user ? AUTH_NAV : ANON_NAV), [user])

  return (
    <>
      {/*  Top Header — visible only on md+ via CSS (no JS, no SSR mismatch)  */}
      <header 
        className="hidden md:flex sticky top-0 z-50 w-full border-b backdrop-blur-md transition-colors duration-300"
        style={{ 
          backgroundColor: 'color-mix(in srgb, var(--bg) 85%, transparent)',
          borderColor: 'var(--border-mid)'
        }}
      >
        <div className="h-16 max-w-7xl mx-auto px-4 flex items-center justify-between w-full">
          {/* Far Left: Logo */}
          <div className="flex items-center flex-shrink-0">
            <button type="button" aria-label="Go to home"
              onClick={() => { try { router.push('/') } catch (e) { window.location.href = '/' } }}
              style={{ 
                background:'none', border:'none', padding:'0', cursor:'pointer', 
                display: 'flex', alignItems: 'center', gap: '8px',
                color:'var(--text)', transition: 'color 0.2s ease'
              }}>
              <img src="/logo.svg" alt="Certifyd Logo" style={{ height: '32px', width: 'auto' }} />
              <span className={`${playfair.className} text-2xl font-black tracking-tight`}>Certifyd.in</span>
            </button>
          </div>

          {/* Center: Main navigation links */}
          <div className="flex-1 flex justify-center px-8">
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              {navItems.map(item => (
                <NavLink key={item.pageId||item.label} item={item} active={isActivePage(activeHref, item.pageId || item.href)} onNavigate={onNavigate} onActivate={setActiveHref} router={router} pathname={pathname} />
              ))}
            </div>
          </div>

          {/* Far Right: Theme toggle + Sign In only */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <ThemeToggle mode={themeMode} onCycle={cycleTheme} />
            {user
              ? <UserAccountMenu user={user} onNavigate={onNavigate} onSignOut={onSignOut} />
              : (
                  <button type="button" onClick={() => onSignIn?.()}
                    style={{ 
                      display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'7px', 
                      height:'34px', padding:'0 16px', borderRadius:'999px', border:'1px solid var(--border)', 
                      background:'transparent', color:'var(--text)', 
                      fontFamily:F_SANS, fontSize:'13px', fontWeight:600, cursor:'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'var(--hover-bg)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <User size={14} strokeWidth={2.5} />Sign In
                  </button>
                )
            }
          </div>
        </div>
      </header>

      {/*  Mobile hamburger overlay — always rendered, visibility gated by `open`  */}
      <MobileMenu
        open={menuOpen}
        currentPage={activeHref}
        onNavigate={onNavigate}
        onActivate={setActiveHref}
        onClose={() => setMenuOpen(false)}
        user={user} onSignIn={onSignIn} onSignOut={onSignOut}
        themeMode={themeMode} onThemeCycle={cycleTheme}
        navItems={navItems}
        pathname={pathname}
      />

      {/*  Mobile bottom tab bar — visible only on <md via CSS  */}
      <div className="flex md:hidden">
        <MobileBottomBar
          currentPage={activeHref}
          user={user}
          onSignIn={onSignIn}
          onNavigate={onNavigate}
          pathname={pathname}
        />
      </div>
    </>
  )
})

export default DynamicIslandNav
