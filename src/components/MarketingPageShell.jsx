import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Mail, MapPin, TrendingUp } from 'lucide-react'
import WaveBg from './WaveBg.jsx'
import { AppSection } from './SharedUI.jsx'
import SEOHead from './SEOHead.jsx'

const FH = "'EB Garamond','Cormorant Garamond',Georgia,serif"
const FB = "'Inter','DM Sans',sans-serif"
const FM = "'JetBrains Mono','IBM Plex Mono',monospace"
const MotionLink = motion.create(Link)

const T = { duration: 0.34, ease: [0.16, 1, 0.3, 1] }

export function PillButton({ children, href, onClick, type = 'button', wide = false, disabled = false }) {
  const Comp = href ? MotionLink : motion.button
  const props = href ? { to: href } : { type, onClick, disabled }

  return (
    <Comp
      {...props}
      whileTap={{ scale: 0.98 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        minHeight: '54px',
        padding: wide ? '0 28px' : '0 24px',
        borderRadius: '9999px',
        border: '1px solid var(--border-accent)',
        background: 'var(--accent)',
        color: 'var(--bg)',
        textDecoration: 'none',
        fontFamily: FB,
        fontSize: '12px',
        fontWeight: '700',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        boxShadow: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </Comp>
  )
}

export function GlassCard({ children, style }) {
  return (
    <div
      className="glass"
      style={{
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function SectionLabel({ children }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '18px',
        fontFamily: FM,
        fontSize: '11px',
        color: 'var(--text-4)',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
      }}
    >
      <div style={{ width: '28px', height: '1px', background: 'var(--border)' }} />
      {children}
      <div style={{ width: '28px', height: '1px', background: 'var(--border)' }} />
    </div>
  )
}

export function StatCard({ label, value, detail, accent = 'var(--accent)' }) {
  return (
    <GlassCard style={{ padding: '20px' }}>
      <div style={{ fontFamily: FM, fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: '10px' }}>
        {label}
      </div>
      <div style={{ fontFamily: FH, fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', fontWeight: '800', color: accent, marginBottom: '6px', lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.7' }}>
        {detail}
      </div>
    </GlassCard>
  )
}

export function MarketingFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', marginTop: '72px', padding: '34px 24px 24px', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px', marginBottom: '28px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '26px', height: '26px', background: 'var(--accent)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={13} color="var(--bg)" />
              </div>
              <span style={{ fontFamily: FH, fontWeight: '800', fontSize: '15px', color: 'var(--text)', letterSpacing: '-0.01em' }}>
                Certify<span style={{ color: 'var(--accent)' }}>ROI</span>
              </span>
            </div>
            <p style={{ fontFamily: FB, fontSize: '13px', lineHeight: '1.7', color: 'var(--text-4)', maxWidth: '260px', margin: 0 }}>
              Built to answer one question with India-calibrated data: will this cert pay for itself?
            </p>
          </div>

          <div>
            <div style={{ fontFamily: FM, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-4)', marginBottom: '12px' }}>Navigate</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Home', to: '/' },
                { label: 'Blog', to: '/blog' },
                { label: 'Tools', to: '/app' },
                { label: 'About', to: '/about' },
                { label: 'FAQ', to: '/faq' },
                { label: 'Contact', to: '/contact' },
              ].map((item) => (
                <Link key={item.label} to={item.to} style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-4)', textDecoration: 'none' }}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: FM, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-4)', marginBottom: '12px' }}>Resources</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link to="/blog" style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-4)', textDecoration: 'none' }}>Blog</Link>
              <Link to="/terms" style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-4)', textDecoration: 'none' }}>Terms</Link>
              <Link to="/privacy" style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-4)', textDecoration: 'none' }}>Privacy</Link>
            </div>
          </div>

          <div>
            <div style={{ fontFamily: FM, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-4)', marginBottom: '12px' }}>Contact</div>
            <a href="mailto:hello@certifyroi.in" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontFamily: FB, fontSize: '13px', color: 'var(--text-4)', textDecoration: 'none' }}>
              <Mail size={14} /> hello@certifyroi.in
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '10px', fontFamily: FB, fontSize: '13px', color: 'var(--text-4)' }}>
              <MapPin size={14} /> Bangalore, India
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          <p style={{ fontFamily: FB, fontSize: '12px', color: 'var(--text-4)', margin: 0 }}>
            Copyright 2026 Certify. Salary figures are medians, not guarantees.
          </p>
          <div className="mono-tag" style={{ fontFamily: FM, fontSize: '11px', color: 'var(--text-4)', margin: 0, opacity: 0.65 }}>
            Data: Q1 2026 - LinkedIn India - NASSCOM - Naukri - AmbitionBox
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function MarketingPageShell({ eyebrow, title, accent, subtitle, children, footer = true, maxWidth = '1240px', schema }) {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: 'var(--color-bg-marketing)', color: 'var(--text)' }}>
      <SEOHead 
        title={`${title} ${accent || ''} | Certify`} 
        description={subtitle || 'Certification ROI Calculator'} 
        schema={schema}
      />
      <WaveBg variant="landing" />
      <div style={{ position: 'relative', zIndex: 1, paddingTop: '112px' }}>
        <AppSection id={eyebrow.substring(0,2).toUpperCase()} title={eyebrow} noBorderTop bg="transparent">
          <div style={{ maxWidth: '880px', margin: '0 auto', width: '100%' }}>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={T}>
              <h1 style={{ fontFamily: FH, fontSize: 'clamp(2.7rem, 6vw, 4.5rem)', fontWeight: '400', letterSpacing: '-0.03em', lineHeight: 0.95, margin: '0 0 18px', maxWidth: '14ch' }}>
                {title}
                {accent ? (
                  <>
                    {' '}
                    <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>{accent}</span>
                  </>
                ) : null}
              </h1>
              {subtitle ? (
                <p style={{ fontFamily: FB, fontSize: 'clamp(15px, 1.7vw, 18px)', color: 'var(--text-3)', lineHeight: '1.7', maxWidth: '56ch', margin: '0 0 48px' }}>
                  {subtitle}
                </p>
              ) : null}
            </motion.div>

            <div style={{ width: '100%' }}>
              {children}
            </div>
          </div>
        </AppSection>

        {footer ? <MarketingFooter /> : null}
      </div>
    </div>
  )
}
