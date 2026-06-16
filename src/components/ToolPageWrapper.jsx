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

const DotMatrixLayer = ({ size, space, opacity, duration, reverse, color }) => (
  <motion.div
    animate={{ 
      backgroundPosition: reverse ? [`0px 0px`, `-${space}px -${space}px`] : [`0px 0px`, `${space}px ${space}px`] 
    }}
    transition={{ repeat: Infinity, duration: duration, ease: "linear" }}
    style={{
      position: 'absolute',
      inset: '-100px', 
      opacity: opacity,
      backgroundImage: `radial-gradient(${color} ${size}px, transparent ${size}px)`,
      backgroundSize: `${space}px ${space}px`,
      pointerEvents: 'none'
    }}
  />
);

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
        <div className="relative w-full overflow-hidden px-4 md:px-6 pt-2 pb-8" style={{ minHeight: '240px' }}>
          
          {/* Background Matrix */}
          <div 
            className="absolute inset-0 z-0" 
            style={{ 
              maskImage: 'linear-gradient(to bottom, black 10%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 10%, transparent 100%)'
            }}
          >
            <DotMatrixLayer size={1} space={12} opacity={0.15} duration={20} color="var(--accent)" />
            <DotMatrixLayer size={1.5} space={24} opacity={0.12} duration={30} reverse color="var(--accent)" />
            <DotMatrixLayer size={2} space={48} opacity={0.1} duration={40} color="var(--text)" />
            <DotMatrixLayer size={2.5} space={96} opacity={0.08} duration={50} reverse color="var(--text)" />
            <DotMatrixLayer size={3} space={140} opacity={0.06} duration={60} color="var(--accent)" />
            <DotMatrixLayer size={4} space={200} opacity={0.04} duration={70} reverse color="var(--text)" />
            <DotMatrixLayer size={6} space={300} opacity={0.02} duration={80} color="var(--accent)" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-start max-w-5xl mx-0 pt-2">
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
        </div>
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
