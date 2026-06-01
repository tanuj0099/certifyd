/**
 * ToolPageWrapper — Frameless edition
 *
 * Tools sit directly on the page background with zero wrapping container.
 * The heading area uses the same --bg surface; no card, no shadow, no rounded box.
 * The only visual separation is a single hairline border-top above the tool content.
 */
import { motion } from 'framer-motion'
import { MarketingFooter } from './MarketingPageShell.jsx'
import FeedbackWidget from './FeedbackWidget.jsx'
import SEOHead from './SEOHead.jsx'

const FM = "'JetBrains Mono','IBM Plex Mono',monospace"
const T  = { type: 'spring', stiffness: 120, damping: 22 }

export default function ToolPageWrapper({
  title,
  subtitle,
  description,
  children,
  eyebrow = 'TOOLS',
  footer  = true,
  showFeedback = true,
}) {
  return (
    /*
     * Outer shell: background and text color come entirely from CSS variables
     * so the component is theme-agnostic. No inline color values here.
     */
    <div style={{
      minHeight:  '100vh',
      background: 'var(--bg)',   // #222326 Nordic / #FFFFFF Ash
      color:      'var(--text)',
    }}>
      <SEOHead 
        title={`${title} | Certify`} 
        description={description || 'Analyze certification ROI, time to payback, and market demand.'} 
        schema={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [{
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://certifyroi.in/"
          },{
            "@type": "ListItem",
            "position": 2,
            "name": "Tools",
            "item": "https://certifyroi.in/app"
          },{
            "@type": "ListItem",
            "position": 3,
            "name": title
          }]
        }}
      />

      {/* ── Page heading — zero elevation, no card ─────────────────── */}
      <div className="page-top-pad" style={{ maxWidth: '100%', margin: '0', paddingLeft: '24px', paddingRight: '24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={T}
          style={{ marginBottom: '40px', maxWidth: '860px' }}
        >
          {/* Eyebrow */}
          <div style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '12px',
            marginBottom:   '20px',
            fontFamily:     FM,
            fontSize:       '11px',
            color:          'var(--text-4)',
            letterSpacing:  '0.18em',
            textTransform:  'uppercase',
          }}>
            <div style={{ width: '28px', height: '1px', background: 'var(--border)' }} />
            {eyebrow}
            <div style={{ width: '28px', height: '1px', background: 'var(--border)' }} />
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily:    'var(--font-head)',
            fontSize:      '36px',
            fontWeight:    '700',
            color:         'var(--text)',
            letterSpacing: 0,
            lineHeight:    1.05,
            marginBottom:  description ? '16px' : 0,
          }}>
            {title}
            {subtitle
              ? <span style={{ color: 'var(--text-2)' }}>{' — '}{subtitle}</span>
              : null}
          </h1>

          {/* Description */}
          {description
            ? <p style={{
                fontFamily: 'var(--font-body)',
                fontSize:   '15px',
                color:      'var(--text-2)',
                lineHeight: 1.7,
                maxWidth:   '56ch',
                margin:     0,
              }}>{description}</p>
            : null}
        </motion.div>
      </div>

      {/* ── Tool content — directly on background, hairline above ──── */}
      <div style={{ maxWidth: '100%', margin: '0', padding: '0 24px 80px' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...T, delay: 0.06 }}
        >
          {/*
           * tool-fabric: only a hairline border at the top.
           * No background, no shadow, no rounded corners.
           * Children render directly onto var(--bg).
           */}
          <div
            className="tool-fabric"
            style={{
              borderTop:  '1px solid var(--border)',
              paddingTop: '32px',
              background: 'transparent',
            }}
          >
            {children}
            {showFeedback && <FeedbackWidget source={title} />}
          </div>
        </motion.div>
      </div>

      {footer ? <MarketingFooter /> : null}
    </div>
  )
}
