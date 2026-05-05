import { motion } from 'framer-motion'
import { MarketingFooter } from './MarketingPageShell.jsx'

const F_HEAD = "var(--font-head)"
const F_BODY = "var(--font-body)"
const F_MONO = "'JetBrains Mono','IBM Plex Mono',monospace"
const T = { type: 'spring', stiffness: 100, damping: 20 }

export default function ToolPageWrapper({
  title,
  subtitle,
  description,
  children,
  eyebrow = 'TOOLS',
  footer = true,
}) {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '108px 24px 0' }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={T}
            style={{ marginBottom: '32px', maxWidth: '900px' }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '18px', fontFamily: F_MONO, fontSize: '11px', color: 'var(--text-4)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              <div style={{ width: '28px', height: '1px', background: 'var(--border)' }} />
              {eyebrow}
              <div style={{ width: '28px', height: '1px', background: 'var(--border)' }} />
            </div>
            <h1 style={{
              fontFamily: F_HEAD,
              fontSize: 'clamp(2.0rem, 4vw, 2.8rem)',
              fontWeight: '700',
              color: 'var(--text)',
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              marginBottom: '16px',
            }}>
              {title}
              {subtitle ? <><span style={{ color: 'var(--text-2)' }}>{' — '}{subtitle}</span></> : null}
            </h1>
            {description ? (
              <p style={{
                fontFamily: F_BODY,
                fontSize: '15px',
                color: 'var(--text-2)',
                lineHeight: 1.7,
                maxWidth: '56ch',
                margin: 0,
              }}>
                {description}
              </p>
            ) : null}
          </motion.div>
        </div>

        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px 0' }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={T}
          >
            <div className="tool-fabric" style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
              {children}
            </div>
          </motion.div>
        </div>

        {footer ? <MarketingFooter /> : null}
      </div>
    </div>
  )
}
