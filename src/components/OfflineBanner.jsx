/**
 * OfflineBanner
 *
 * A full-screen overlay that renders when the browser reports no network
 * connection. Matches the Certify brand aesthetic (Nordic dark / Ash light
 * via CSS variables). Animates in/out with Framer Motion.
 *
 * Usage - drop into AppRoot, rendered above everything else:
 *   import OfflineBanner from './components/OfflineBanner.jsx'
 *   import { useNetworkStatus } from './hooks/useNetworkStatus.js'
 *
 *   const isOnline = useNetworkStatus()
 *   ...
 *   <AnimatePresence>{!isOnline && <OfflineBanner />}</AnimatePresence>
 */
import { motion } from 'framer-motion'

const FM = "var(--font-mono)";
const FS = "var(--font-sans)";

//  Animated signal bars icon 
function SignalOffIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      {/* Three bars - progressively taller, all dimmed */}
      <rect x="4"  y="32" width="8" height="12" rx="2" fill="var(--text-4)" opacity="0.3" />
      <rect x="20" y="22" width="8" height="22" rx="2" fill="var(--text-4)" opacity="0.3" />
      <rect x="36" y="10" width="8" height="34" rx="2" fill="var(--text-4)" opacity="0.3" />

      {/* Diagonal slash - the "off" indicator */}
      <line
        x1="6"  y1="6"
        x2="42" y2="42"
        stroke="var(--err, #D94848)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

//  Pulsing dot 
function PulsingDot() {
  return (
    <motion.div
      animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'var(--err, #D94848)',
        flexShrink: 0,
      }}
    />
  )
}

export default function OfflineBanner() {
  return (
    <motion.div
      key="offline-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--bg)',
        // Subtle noise texture via repeating gradient - brand-consistent
        backgroundImage:
          'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 60%)',
      }}
    >
      {/*
         Outer card 
        Matches the "glass" card aesthetic used throughout the app:
        transparent background, single hairline border, no shadow.
      */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1    }}
        exit={{ opacity: 0, scale: 0.95  }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '0',
          padding: '24px'
        }}
      >
        {/* Icon */}
        <div style={{ marginBottom: '24px' }}>
          <SignalOffIcon />
        </div>

        {/* Status pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            borderRadius: '999px',
            border: '1px solid rgba(217,72,72,0.25)',
            background: 'rgba(217,72,72,0.07)',
            marginBottom: '20px',
          }}
        >
          <PulsingDot />
          <span
            style={{
              fontFamily: FM,
              fontSize: '10px',
              color: 'var(--err, #D94848)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: '700',
            }}
          >
            No connection
          </span>
        </div>

        {/* Headline */}
        <h2
          style={{
            margin: '0 0 24px',
            fontFamily: FS,
            fontSize: 'clamp(3rem, 8vw, 5rem)',
            fontWeight: '900',
            letterSpacing: '-0.04em',
            lineHeight: 1,
            color: 'var(--text)',
          }}
        >
          You're offline
        </h2>

        {/* Body copy */}
        <p
          style={{
            margin: '0 0 40px',
            fontFamily: FS,
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: 'var(--text-3)',
            lineHeight: '1.6',
            maxWidth: '600px',
          }}
        >
          Certify needs an internet connection to fetch the latest
          certification data and salary benchmarks.{' '}
          <span style={{ color: 'var(--text-2)', fontWeight: '600', display: 'block', marginTop: '12px' }}>
            Please reconnect to continue your journey.
          </span>
        </p>

        {/* Retry hint */}
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            background: 'transparent',
            fontFamily: FM,
            fontSize: '11px',
            color: 'var(--text-4)',
            letterSpacing: '0.08em',
            lineHeight: '1.6',
          }}
        >
          The page will automatically reload once your connection is restored.
        </div>
      </motion.div>

      {/* Bottom brand mark - subtle, not distracting */}
      <div
        style={{
          marginTop: '28px',
          fontFamily: FM,
          fontSize: '11px',
          color: 'var(--text-4)',
          letterSpacing: '0.12em',
          opacity: 0.5,
        }}
      >
        Certify  certifyd.in
      </div>
    </motion.div>
  )
}
