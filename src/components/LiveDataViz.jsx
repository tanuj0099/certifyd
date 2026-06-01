// 
// LiveDataViz.jsx - Market Intelligence Visualizers
// Salary Range Slider, Demand Gauge, Data Hydration Counter
// 
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const FM = "var(--font-mono)";
const FS = "var(--font-sans)";
const ACCENT = 'var(--accent)'

//  Salary Range Slider 
// Ultra-thin, non-interactive visual slider showing min/max
export function SalaryRangeSlider({
  min = 400000,
  max = 1200000,
  median,
  label = 'Compensation Range',
  currency = '₹',
}) {
  const actualMedian = median || Math.round((min + max) / 2)
  const range = max - min || 1
  const medianPct = ((actualMedian - min) / range) * 100

  function fmt(v) {
    if (v >= 100000) return currency + (v / 100000).toFixed(1) + 'L'
    if (v >= 1000) return currency + (v / 1000).toFixed(0) + 'K'
    return currency + v
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: '8px',
      }}>
        <span style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-3)',
          letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)' }}>
          FY 2026
        </span>
      </div>

      {/* Track */}
      <div style={{
        position: 'relative', width: '100%', height: '3px',
        background: 'var(--border-mid)', borderRadius: '2px',
        marginBottom: '10px',
      }}>
        {/* Range segment - gradient fill */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
            background: 'var(--text-2)',
            borderRadius: '2px',
            transformOrigin: 'left',
          }}
        />

        {/* Median marker */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 15 }}
          style={{
            position: 'absolute',
            left: `${medianPct}%`,
            top: '50%', transform: 'translate(-50%, -50%)',
            width: '9px', height: '9px', borderRadius: '50%',
            background: '#FFFFFF',
            border: `2px solid ${ACCENT}`,
            zIndex: 2,
          }}
        />
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: FM, fontSize: '12px', fontWeight: '700', color: 'var(--text-2)' }}>
          {fmt(min)}
        </span>
        <span style={{ fontFamily: FM, fontSize: '11px', color: ACCENT, fontWeight: '600' }}>
          MEDIAN {fmt(actualMedian)}
        </span>
        <span style={{ fontFamily: FM, fontSize: '12px', fontWeight: '700', color: 'var(--text-2)' }}>
          {fmt(max)}
        </span>
      </div>
    </div>
  )
}

//  Demand Gauge 
// Circular SVG progress with pulse animation
export function DemandGauge({
  value = 2400,
  maxValue = 5000,
  label = 'Active Opportunities',
  size = 96,
}) {
  const pct = Math.min(100, (value / maxValue) * 100)
  const R = 36
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * R
  const arcLen = circ * 0.75
  const filled = arcLen * (pct / 100)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={R} fill="none"
            stroke="var(--border-mid)" strokeWidth={5}
            strokeDasharray={`${arcLen} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(135 ${cx} ${cy})`}
          />
          {/* Active arc */}
          <motion.circle
            cx={cx} cy={cy} r={R} fill="none"
            stroke={ACCENT} strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={`${arcLen} ${circ}`}
            transform={`rotate(135 ${cx} ${cy})`}
            initial={{ strokeDashoffset: arcLen }}
            animate={{ strokeDashoffset: arcLen - filled }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        {/* Center value */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          paddingBottom: 6,
        }}>
          <HydrationCounter value={value} style={{
            fontFamily: FM, fontSize: '16px', fontWeight: '800',
            color: 'var(--text)', letterSpacing: '-0.03em',
          }} />
        </div>
      </div>

      <div>
        <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-3)',
          letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: ACCENT,
            }}
          />
          <span style={{ fontFamily: FM, fontSize: '10px', color: ACCENT, fontWeight: '600' }}>
            JUST UPDATED
          </span>
        </div>
      </div>
    </div>
  )
}

//  Hydration Counter 
// Counts up from 0 to value with easeOutCubic
export function HydrationCounter({ value, duration = 800, prefix = '', suffix = '', style = {} }) {
  const [displayed, setDisplayed] = useState(0)
  const numVal = typeof value === 'number' ? value : (parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0)

  useEffect(() => {
    const frames = Math.round(duration / (1000 / 60))
    let f = 0
    const id = setInterval(() => {
      f++
      const progress = 1 - Math.pow(1 - f / frames, 3)
      setDisplayed(numVal * progress)
      if (f >= frames) { setDisplayed(numVal); clearInterval(id) }
    }, 1000 / 60)
    return () => clearInterval(id)
  }, [numVal, duration])

  const formatted = displayed >= 1000
    ? Math.round(displayed).toLocaleString('en-IN')
    : (displayed % 1 === 0 ? Math.round(displayed) : displayed.toFixed(1))

  return (
    <span style={style}>
      {prefix}{formatted}{suffix}
    </span>
  )
}

//  Live Data Badge 
export function LiveBadge({ label = 'LIVE', updatedAt }) {
  const timeLabel = React.useMemo(() => {
    if (!updatedAt) return 'REAL-TIME'
    try {
      const d = new Date(updatedAt)
      const now = new Date()
      const diffH = Math.round((now - d) / (1000 * 60 * 60))
      if (diffH < 1) return 'JUST NOW'
      if (diffH < 24) return `${diffH}H AGO`
      return `${Math.round(diffH / 24)}D AGO`
    } catch { return 'VERIFIED' }
  }, [updatedAt])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 120, damping: 20 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '3px 10px', borderRadius: '4px',
        border: '1px solid var(--border)',
        fontFamily: FM, fontSize: '9px', letterSpacing: '0.1em',
        color: 'var(--text-3)',
      }}
    >
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.6, repeat: Infinity }}
        style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: ACCENT,
        }}
      />
      {label} // {timeLabel}
    </motion.div>
  )
}

//  Sparkline (thin SVG) 
export function Sparkline({ data = [], width = 120, height = 28, color = ACCENT }) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  )
}
