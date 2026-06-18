/**
 * ToolPageWrapper - Frameless edition
 *
 * Tools sit directly on the page background with zero wrapping container.
 * The heading area uses the same --bg surface; no card, no shadow, no rounded box.
 * The only visual separation is a single hairline border-top above the tool content.
 */
import { motion } from 'framer-motion'
import { MarketingFooter } from './MarketingPageShell.jsx'
import FeedbackWidget from './FeedbackWidget.jsx'
import SEOHead from './SEOHead.jsx'
import { Sparkles } from 'lucide-react'

const FM = "var(--font-mono)";

import { DotMatrixBackground } from './DotMatrixBackground.jsx'

const T = { type: 'spring', stiffness: 100, damping: 20 };

export default function ToolPageWrapper({
  title,
  subtitle,
  description,
  children,
  eyebrow = 'TOOLS',
  footer = true,
  showFeedback = true,
  hideHeader = false,
}) {
  return (
    /*
     * Outer shell: background and text color come entirely from CSS variables
     * so the component is theme-agnostic. No inline color values here.
     */
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',   // #222326 Nordic / #FFFFFF Ash
      color: 'var(--text)',
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
            "item": "https://certifyd.in/"
          }, {
            "@type": "ListItem",
            "position": 2,
            "name": "Tools",
            "item": "https://certifyd.in/app"
          }, {
            "@type": "ListItem",
            "position": 3,
            "name": title
          }]
        }}
      />

      {/*  Mind-Blowing 7-Layer Dot Matrix Header  */}
      {!hideHeader && (
        <DotMatrixBackground className="px-4 md:px-6 pt-2 pb-8" style={{ minHeight: '240px' }}>
          <div className="flex flex-col items-start max-w-5xl mx-0 pt-2">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
              
              {/* Title */}
              <h1 
                className="font-black leading-[1.05] tracking-tighter"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'clamp(48px, 7vw, 80px)',
                  background: 'linear-gradient(to bottom right, var(--text) 30%, var(--text-3))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '16px'
                }}
              >
                {title}
              </h1>

              {/* Description */}
              {description && (
                <p 
                  className="text-lg sm:text-xl font-medium leading-relaxed max-w-3xl"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--text-2)',
                  }}
                >
                  {description}
                </p>
              )}

            </motion.div>
          </div>
        </DotMatrixBackground>
      )}

      {/*  Tool content - directly on background, hairline above  */}
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
              borderTop: '1px solid var(--border)',
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
