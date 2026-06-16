'use client';

// 
// Layout.jsx - Shared layout for all pages
// 

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { } from 'react-router-dom';
import Link from 'next/link';
import { Menu, X, Home, Info, HelpCircle, Zap, FileText, Phone, Mail } from 'lucide-react'

const F_HEAD = "var(--font-head)";
const F_BODY = "var(--font-body)";
const F_MONO = "var(--font-mono)";

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'About', href: '/about', icon: Info },
  { label: 'Features', href: '/features', icon: Zap },
  { label: 'How It Works', href: '/how-it-works', icon: FileText },
  { label: 'Pricing', href: '/pricing', icon: Mail },
  { label: 'FAQ', href: '/faq', icon: HelpCircle },
  { label: 'Contact', href: '/contact', icon: Phone },
]

// 
// HEADER
// 
export function Header({ currentPage }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: '64px', zIndex: 9999,
        background: scrolled ? 'transparent' : 'transparent',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--border)',
        transition: 'all 0.3s var(--ease-out)',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          height: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 24px',
        }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                overflow: 'hidden', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <img
                  src="/logo.png"
                  alt="Certifyd Logo"
                  className="theme-logo"
                  style={{
                    height: '44px',
                    width: '44px',
                    objectFit: 'cover',
                    maxWidth: 'none',
                    transform: 'scale(1.45)'
                  }}
                />
              </div>
              <span style={{
                fontFamily: F_HEAD, fontWeight: '700', fontSize: '16px',
                color: 'var(--text)', letterSpacing: '-0.02em',
              }}>Certify</span>
            </motion.div>
          </Link>

          {/* Desktop Nav */}
          <nav className="desktop-nav" style={{ display: 'flex', gap: '8px' }}>
            {NAV_ITEMS.map((item, i) => {
              const isActive = currentPage === item.href || (currentPage === '/' && item.href === '/')
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{
                    textDecoration: 'none', padding: '8px 14px', borderRadius: '8px',
                    fontFamily: F_BODY, fontSize: '13px', fontWeight: isActive ? '600' : '500',
                    color: isActive ? 'var(--text)' : 'var(--text-2)',
                    transition: 'all 0.2s var(--ease-out)',
                    background: isActive ? 'transparent' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="mobile-menu-button"
            style={{
              display: 'none', background: 'transparent', border: 'none',
              cursor: 'pointer', padding: '8px', color: 'var(--text)',
            }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{
            position: 'fixed', top: '64px', left: 0, right: 0,
            background: 'var(--bg)', borderBottom: '1px solid var(--border)',
            zIndex: 9998, padding: '16px 24px',
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {NAV_ITEMS.map((item) => {
              const isActive = currentPage === item.href
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    textDecoration: 'none', padding: '12px 16px', borderRadius: '8px',
                    fontFamily: F_BODY, fontSize: '14px', fontWeight: isActive ? '600' : '500',
                    color: isActive ? 'var(--text)' : 'var(--text-2)',
                    background: isActive ? 'transparent' : 'transparent',
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </motion.div>
      )}
    </>
  )
}

// 
// FOOTER
// 
export function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'transparent',
      padding: '48px 24px 32px',
    }}>
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '32px', marginBottom: '32px',
      }}>
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '6px',
              overflow: 'hidden', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <img
                src="/logo.png"
                alt="Certifyd Logo"
                className="theme-logo"
                style={{
                  height: '38px',
                  width: '38px',
                  objectFit: 'cover',
                  maxWidth: 'none',
                  transform: 'scale(1.45)'
                }}
              />
            </div>
            <span style={{ fontFamily: F_HEAD, fontWeight: '700', fontSize: '14px', color: 'var(--text)' }}>Certify</span>
          </div>
          <p style={{ fontFamily: F_BODY, fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.6', margin: 0 }}>
            Bangalore's #1 Certification ROI Calculator. Make informed career decisions with real India data.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ fontFamily: F_HEAD, fontSize: '12px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Links</h4>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'About', href: '/about' },
              { label: 'Features', href: '/features' },
              { label: 'How It Works', href: '/how-it-works' },
              { label: 'Pricing', href: '/pricing' },
              { label: 'FAQ', href: '/faq' },
              { label: 'Contact', href: '/contact' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                style={{ fontFamily: F_BODY, fontSize: '13px', color: 'var(--text-2)', textDecoration: 'none' }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Legal */}
        <div>
          <h4 style={{ fontFamily: F_HEAD, fontSize: '12px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Legal</h4>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link href="/terms" style={{ fontFamily: F_BODY, fontSize: '13px', color: 'var(--text-2)', textDecoration: 'none' }}>Terms of Service</Link>
            <Link href="/privacy" style={{ fontFamily: F_BODY, fontSize: '13px', color: 'var(--text-2)', textDecoration: 'none' }}>Privacy Policy</Link>
          </nav>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ fontFamily: F_HEAD, fontSize: '12px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contact</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a href="mailto:hello@certifyd.in" style={{ fontFamily: F_BODY, fontSize: '13px', color: 'var(--text-2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} /> hello@certifyd.in
            </a>
            <span style={{ fontFamily: F_MONO, fontSize: '12px', color: 'var(--text-4)' }}>
              Built in Bangalore  2025-2026
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        maxWidth: '1200px', margin: '0 auto', paddingTop: '24px',
        borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '16px',
      }}>
        <p style={{ fontFamily: F_MONO, fontSize: '11px', color: 'var(--text-4)', margin: 0 }}>
          2026 Certify. All rights reserved.
        </p>
        <div className="mono-tag" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.05em', opacity: 0.8 }}>
          Data: Q1 2026  Naukri  LinkedIn India  NASSCOM  AmbitionBox
        </div>
      </div>
    </footer>
  )
}

// 
// PAGE WRAPPER
// 
export function PageWrapper({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ flex: 1, paddingTop: '64px' }}>
        {children}
      </div>
    </motion.div>
  )
}

// 
// LAYOUT (COMBINED)
// 
export default function Layout({ children, currentPage = '/' }) {
  return (
    <PageWrapper>
      <Header currentPage={currentPage} />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </PageWrapper>
  )
}
