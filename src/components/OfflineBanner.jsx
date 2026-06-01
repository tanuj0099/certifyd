/**
 * OfflineBanner
 *
 * A full-screen overlay that renders when the browser reports no network
 * connection. Matches the Certify brand aesthetic (Nordic dark / Ash light
 * via CSS variables). Animates in/out with Framer Motion.
 *
 * Usage — drop into AppRoot, rendered above everything else:
 *   import OfflineBanner from './components/OfflineBanner.jsx'
 *   import { useNetworkStatus } from './hooks/useNetworkStatus.js'
 *
 *   const isOnline = useNetworkStatus()
 *   ...
 *   <AnimatePresence>{!isOnline && <OfflineBanner />}</AnimatePresence>
 */
import { motion } from 'framer-motion'

const FM = "'JetBrains Mono', 'IBM Plex Mono', monospace"
const FS = "'Inter', 'DM Sans', sans-serif"

// ── Animated signal bars icon ─────────────────────────────────────────────────
function SignalOffIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      {/* Three bars — progressively taller, all dimmed */}
      <rect x="4"  y="32" width="8" height="12" rx="2" fill="var(--text-4)" opacity="0.3" />
      <rect x="20" y="22" width="8" height="22" rx="2" fill="var(--text-4)" opacity="0.3" />
      <rect x="36" y="10" width="8" height="34" rx="2" fill="var(--text-4)" opacity="0.3" />

      {/* Diagonal slash — the "off" indicator */}
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

// ── Pulsing dot ───────────────────────────────────────────────────────────────
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
        // Subtle noise texture via repeating gradient — brand-consistent
        backgroundImage:
          'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 60%)',
      }}
    >
      {/*
        ── Outer card ──────────────────────────────────────────────────────────
        Matches the "glass" card aesthetic used throughout the app:
        transparent background, single hairline border, no shadow.
      */}
      <motion.div
        initial={{ y: 24, opacity: 0, scale: 0.96 }}
        animate={{ y: 0,  opacity: 1, scale: 1    }}
        exit={{    y: 16, opacity: 0, scale: 0.97  }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: 'clamp(28px, 6vw, 48px)',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          background: 'var(--bg-alt)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '0',
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
            margin: '0 0 14px',
            fontFamily: FS,
            fontSize: 'clamp(1.3rem, 4vw, 1.7rem)',
            fontWeight: '800',
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
            color: 'var(--text)',
          }}
        >
          You're offline
        </h2>

        {/* Body copy */}
        <p
          style={{
            margin: '0 0 28px',
            fontFamily: FS,
            fontSize: '14px',
            color: 'var(--text-3)',
            lineHeight: '1.75',
            maxWidth: '34ch',
          }}
        >
          Certify needs an internet connection to fetch the latest
          certification data and salary benchmarks.{' '}
          <span style={{ color: 'var(--text-2)', fontWeight: '600' }}>
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

      {/* Bottom brand mark — subtle, not distracting */}
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
        Certify · certifyroi.in
      </div>
    </motion.div>
  )
}
