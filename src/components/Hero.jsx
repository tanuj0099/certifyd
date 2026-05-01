import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Zap, AlertTriangle, CheckCircle, RefreshCw,
  TrendingUp, MapPin, User, Star, ArrowRight,
  Info, ShieldCheck, Clock, Wifi, Building2
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid
} from 'recharts'
import { useROICalc, useGuestCounter } from '../hooks/hooks.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { analyzeROI } from '../services/aiService.jsx'
import { fetchCertifications, fetchDomains } from '../services/dataService.jsx'
import AILoadingState from './AILoadingState.jsx'
import HikeVerifier from './HikeVerifier.jsx'
import PitchBoss from './PitchBoss.jsx'
import ShareROICard from './ShareROICard.jsx'
import { useJourneyStore } from '../store/useJourneyStore.js'

const GUEST_FREE_LIMIT = parseInt(import.meta.env.VITE_GUEST_FREE_LIMIT || '3', 10)

// ── Font constants ────────────────────────────────────────
const FH = "'Bricolage Grotesque',sans-serif"
const FM = "'JetBrains Mono',monospace"
const FB = "'Inter',sans-serif"

const TT = { duration: 0.28, ease: [0.4, 0, 0.2, 1] }

const PICTON  = '#51B1E7'
const EMERALD = '#10B981'
const AMBER   = '#F59E0B'
const INDIGO  = '#6366F1'
const VIOLET  = '#818CF8'

function dc(d) {
  if (d === 'Very High') return EMERALD
  if (d === 'High')      return PICTON
  if (d === 'Medium')    return AMBER
  return '#94A3B8'
}

// ── Feature 1: Affordability band ─────────────────────────
function getAffordabilityBand(certCostL, salaryL, isStudent) {
  const baseline = isStudent ? 4.8 : salaryL
  if (baseline <= 0 || certCostL <= 0) return null
  const ratio = certCostL / baseline
  if (ratio <= 0.10) return { label: 'Good value', color: EMERALD, tip: 'Under 10% of salary — well within budget' }
  if (ratio <= 0.25) return { label: 'Risky',      color: AMBER,   tip: '10–25% of salary — tight but manageable' }
  return { label: 'Premium stretch', color: INDIGO, tip: 'Over 25% of salary — significant commitment' }
}

// ── Feature 3: Payback confidence ─────────────────────────
function getPaybackConfidence(demand, hikePercent) {
  if ((demand === 'Very High' || demand === 'High') && hikePercent >= 25)
    return { label: 'High confidence', color: EMERALD }
  if (demand === 'Medium' || (hikePercent >= 15 && hikePercent < 25))
    return { label: 'Medium confidence', color: AMBER }
  return { label: 'Low confidence', color: '#94A3B8' }
}

// ── Feature 3b: Payback range (replaces exact month) ───────
function getPaybackRange(months, demand, hikePercent) {
  if (!months || months <= 0) return '--'
  const conf = getPaybackConfidence(demand, hikePercent)
  const spread = conf.label === 'High confidence' ? 0.15
               : conf.label === 'Medium confidence' ? 0.25 : 0.35
  const lo = Math.max(1, Math.round(months * (1 - spread)))
  const hi = Math.round(months * (1 + spread))
  return lo + '–' + hi + ' mo'
}

// ── Feature 5: Per-cert readiness ─────────────────────────
function getCertReadiness(forWho = '') {
  const lower = forWho.toLowerCase()
  const beginnerSignals  = ['fresher', 'entry', 'beginner', 'career switch', 'anyone entering', 'fresh', 'no experience']
  const foundationSignals = ['senior', '2+ yr', '3+ yr', '3+ yrs', '2+ yrs', 'years', '5+ yr', 'experienced', 'mid-level']
  if (beginnerSignals.some(s => lower.includes(s)))   return { label: 'Beginner ready',   color: EMERALD }
  if (foundationSignals.some(s => lower.includes(s))) return { label: 'Needs foundation', color: VIOLET }
  return { label: 'Intermediate', color: AMBER }
}

// ── Feature 2: Not-ideal-for note ─────────────────────────
function getNotIdealNote(cert) {
  if (!cert) return null
  const lower = (cert.forWho || '').toLowerCase()
  const notes = []
  if (cert.demand === 'Low') notes.push('low market demand in India right now')
  if (cert.avgHike < 18)    notes.push('modest average salary impact (<18%)')
  if (lower.includes('senior') && !lower.includes('fresher'))
    notes.push('not suited for freshers or career switchers without related experience')
  return notes.length > 0 ? notes[0] : null
}

// ── Share ROI URL ─────────────────────────────────────
function ShareURLButton({ certName, salary, certCost, hikePercent, mode }) {
  const [copied, setCopied] = useState(false)
  if (!certName) return null

  const handleCopy = () => {
    const base   = window.location.origin + '/app'
    const params = new URLSearchParams({
      cert:  certName,
      sal:   salary,
      cost:  certCost,
      hike:  hikePercent,
      mode:  mode || 'professional',
      tab:   'calculator',
    })
    const url = base + '?' + params.toString()
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }).catch(() => {
      // Fallback: select text
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <motion.button
      onClick={handleCopy}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.97 }}
      style={{
        padding: '8px 14px', borderRadius: '9px', cursor: 'pointer',
        background: copied ? 'rgba(16,185,129,0.1)' : 'var(--surface)',
        border: '1px solid ' + (copied ? 'rgba(16,185,129,0.3)' : 'var(--border)'),
        color: copied ? EMERALD : 'var(--text-3)',
        fontSize: '12px', fontFamily: FB, fontWeight: '600',
        display: 'flex', alignItems: 'center', gap: '5px',
        transition: 'all 0.2s',
      }}
    >
      {copied ? <CheckCircle size={12} /> : <ArrowRight size={12} />}
      {copied ? 'Link copied!' : 'Share My ROI'}
    </motion.button>
  )
}

// ── Student stepping-stone path ────────────────────────
function getStudentPathSteps(domain, certName, firstSalary) {
  const domainSteps = {
    finance: [
      { label: 'Build Models', detail: '3-statement model and valuation case', time: '3-4 wk', color: VIOLET },
      { label: 'Mock Cases', detail: 'Equity research and FP&A case practice', time: '3-4 wk', color: PICTON },
    ],
    data: [
      { label: 'Build Dashboards', detail: '2 SQL + BI projects with public datasets', time: '1-2 mo', color: VIOLET },
      { label: 'Case Practice', detail: 'Analytics take-home problems and metric trees', time: '3-4 wk', color: PICTON },
    ],
    marketing: [
      { label: 'Campaign Proof', detail: 'Run or simulate 2 performance campaigns', time: '3-4 wk', color: VIOLET },
      { label: 'Portfolio Review', detail: 'Landing page, ads, and analytics teardown', time: '2-3 wk', color: PICTON },
    ],
    management: [
      { label: 'Project Proof', detail: 'Create agile plan, risk register, and roadmap', time: '3-4 wk', color: VIOLET },
      { label: 'Interview Drills', detail: 'Stakeholder and delivery scenario practice', time: '3-4 wk', color: PICTON },
    ],
    hr: [
      { label: 'People Ops Kit', detail: 'Hiring funnel, JD scorecard, and HR dashboard', time: '3-4 wk', color: VIOLET },
      { label: 'Case Practice', detail: 'Talent, engagement, and policy scenarios', time: '2-3 wk', color: PICTON },
    ],
    tech: [
      { label: 'Build Lab Proof', detail: '2 deployable projects with architecture notes', time: '1-2 mo', color: VIOLET },
      { label: 'Interview Drills', detail: 'System, troubleshooting, and role-based practice', time: '3-4 wk', color: PICTON },
    ],
  }
  const middle = domainSteps[domain] || domainSteps.tech
  return [
    { num: '01', label: 'Get Certified', detail: certName.split(' ').slice(0, 3).join(' '), time: '2-4 mo', color: INDIGO },
    { num: '02', ...middle[0] },
    { num: '03', ...middle[1] },
    { num: '04', label: 'First Offer', detail: 'Rs.' + firstSalary.toFixed(1) + 'L target package', time: '', color: EMERALD },
  ]
}

function StudentPath({ certName, certCost, domain, firstSalary }) {
  if (!certName) return null
  const steps = getStudentPathSteps(domain || 'tech', certName, firstSalary || 4.8)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="glass"
      style={{ marginBottom: '16px', padding: '18px', borderRadius: '13px' }}
    >
      <div style={{ fontFamily: FM, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Star size={9} color={VIOLET} />
        Your path to Rs.{(firstSalary || 4.8).toFixed(1)}L+
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '28px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step.color + '18', border: '1px solid ' + step.color + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FM, fontSize: '9px', color: step.color, fontWeight: '700' }}>
                {step.num}
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: '1px', flex: 1, minHeight: '18px', background: 'linear-gradient(' + step.color + '50, ' + steps[i+1].color + '30)', marginTop: '2px', marginBottom: '2px' }} />
              )}
            </div>

            <div style={{ paddingBottom: i < steps.length - 1 ? '14px' : '0', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontFamily: FH, fontWeight: '800', fontSize: '13px', color: step.color, letterSpacing: '-0.01em' }}>{step.label}</span>
                {step.time && (
                  <span style={{ fontFamily: FM, fontSize: '9px', color: 'var(--text-4)', padding: '2px 7px', borderRadius: '99px', background: step.color + '10', border: '1px solid ' + step.color + '20' }}>{step.time}</span>
                )}
              </div>
              <div style={{ fontFamily: FB, fontSize: '12px', color: i === steps.length - 1 ? EMERALD : 'var(--text-3)', fontWeight: i === steps.length - 1 ? '700' : '400' }}>
                {step.detail}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '14px', padding: '9px 12px', borderRadius: '8px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '11px', color: 'var(--text-4)', fontFamily: FB, lineHeight: '1.6' }}>
        Total investment: Rs.{certCost}L / Timeline: 4-7 months / Target: verified entry roles in {domain || 'your domain'}
      </div>
    </motion.div>
  )
}

function Slider({ label, value, min = 0, max = 100, step = 1, onChange, prefix = '', suffix = '', color = INDIGO, note, formatDisplay, disabled = false }) {
  const trackRef        = useRef(null)
  const [drag,  setDrag]  = useState(false)
  const [hover, setHover] = useState(false)
  const prefersReduced  = useReducedMotion()

  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))

  const snap = useCallback(function(raw) {
    var stepped = Math.round((raw - min) / step) * step + min
    var clamped = Math.max(min, Math.min(max, stepped))
    return parseFloat(clamped.toFixed(10))
  }, [min, max, step])

  const fromX = useCallback(function(clientX) {
    var el = trackRef.current
    if (!el) return value
    var rect = el.getBoundingClientRect()
    var x    = Math.max(0, Math.min(clientX - rect.left, rect.width))
    return snap(min + (x / rect.width) * (max - min))
  }, [min, max, snap, value])

  const onMouseDown = useCallback(function(e) {
    if (disabled) return
    e.preventDefault()
    setDrag(true)
    onChange(fromX(e.clientX))
    function onMove(e) { onChange(fromX(e.clientX)) }
    function onUp()   { setDrag(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }, [disabled, fromX, onChange])

  const onTouchStart = useCallback(function(e) {
    if (disabled) return
    e.preventDefault()
    setDrag(true)
    onChange(fromX(e.touches[0].clientX))
    function onMove(e) { e.preventDefault(); onChange(fromX(e.touches[0].clientX)) }
    function onEnd()   { setDrag(false); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd) }
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend',  onEnd)
  }, [disabled, fromX, onChange])

  const onKeyDown = useCallback(function(e) {
    if (disabled) return
    var map = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step }
    if (map[e.key] !== undefined) { e.preventDefault(); onChange(snap(value + map[e.key])) }
    if (e.key === 'Home') { e.preventDefault(); onChange(min) }
    if (e.key === 'End')  { e.preventDefault(); onChange(max) }
  }, [disabled, step, snap, value, min, max, onChange])

  var display = formatDisplay
    ? formatDisplay(value)
    : (prefix + (typeof value === 'number' ? value.toLocaleString('en-IN') : value) + suffix)

  // Respect prefers-reduced-motion for thumb animations
  var thumbScale  = prefersReduced ? 1 : (drag ? 1.22 : hover ? 1.08 : 1)
  var thumbShadow = drag
    ? ('0 0 0 10px ' + color + '15, 0 4px 16px rgba(0,0,0,0.35)')
    : ('0 0 0 4px '  + color + '22, 0 2px 8px rgba(0,0,0,0.25)')

  return (
    <div style={{ marginBottom: '22px', opacity: disabled ? 0.45 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <label style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: FM, textTransform: 'uppercase', letterSpacing: '0.08em', userSelect: 'none' }}>
          {label}
        </label>
        <motion.div
          key={display}
          initial={prefersReduced ? false : { opacity: 0.5, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          style={{ fontFamily: FM, fontSize: '17px', fontWeight: '700', color, letterSpacing: '-0.02em' }}
        >
          {display}
        </motion.div>
      </div>

      <div
        ref={trackRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onKeyDown={onKeyDown}
        onMouseEnter={function() { setHover(true)  }}
        onMouseLeave={function() { setHover(false) }}
        tabIndex={disabled ? -1 : 0}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        aria-disabled={disabled}
        style={{
          position: 'relative', height: '44px',
          display: 'flex', alignItems: 'center',
          cursor:   disabled ? 'not-allowed' : drag ? 'grabbing' : 'pointer',
          outline:  'none', touchAction: 'none',
          userSelect: 'none', WebkitUserSelect: 'none',
        }}
      >
        <div style={{ position: 'absolute', left: 0, right: 0, height: '5px', borderRadius: '3px', background: 'var(--glass-border)', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', left: 0, width: pct + '%', height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg,' + color + '55,' + color + ')', transition: drag ? 'none' : 'width 0.06s linear', pointerEvents: 'none' }} />
        </div>
        <div style={{
          position: 'absolute', left: pct + '%',
          transform: 'translateX(-50%) scale(' + thumbScale + ')',
          width: '24px', height: '24px', borderRadius: '50%',
          backgroundImage: 'linear-gradient(145deg,' + color + ',' + color + 'cc)',
          boxShadow: thumbShadow,
          cursor: disabled ? 'not-allowed' : drag ? 'grabbing' : 'grab',
          zIndex: 3, pointerEvents: 'none',
          transition: prefersReduced
            ? 'none'
            : drag
              ? 'transform 0.1s, box-shadow 0.1s'
              : 'left 0.06s linear, transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5px' }}>
            {[0, 1].map(function(r) {
              return (
                <div key={r} style={{ display: 'flex', gap: '2.5px' }}>
                  {[0, 1].map(function(c) {
                    return <div key={c} style={{ width: '2px', height: '2px', borderRadius: '50%', background: 'rgba(255,255,255,0.75)' }} />
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {note ? (
        <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px', fontFamily: FB, lineHeight: '1.5', paddingLeft: '2px' }}>
          {note}
        </div>
      ) : null}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// INLINE DATA SOURCE NOTE
// ─────────────────────────────────────────────────────────
function DataNote({ children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '6px',
      padding: '7px 10px', borderRadius: '7px',
      background: 'rgba(100,116,139,0.06)',
      border: '1px solid rgba(100,116,139,0.12)',
      marginTop: '4px',
    }}>
      <Info size={10} color="var(--text-4)" style={{ flexShrink: 0, marginTop: '1px' }} />
      <span style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.03em', lineHeight: '1.5' }}>
        {children}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// CERT LEADERBOARD
// ─────────────────────────────────────────────────────────
function Leadboard({ domainList, sorted, preferred, showAll, setShowAll, activeCertName, onPick, mappedDomain, isPrefilled, domains }) {
  const isSinglePrefilled = isPrefilled && preferred.length > 0

  const seen      = new Set()
  const finalList = []

  if (isSinglePrefilled) {
    preferred.forEach(c => { finalList.push(c) })
  } else {
    ;[...preferred, ...domainList, ...sorted].forEach(function(c) {
      if (!seen.has(c.id) && finalList.length < (showAll ? 999 : 10)) {
        seen.add(c.id)
        finalList.push(c)
      }
    })
  }

  const hasMoreDomain = !showAll && domainList.length > 10

  return (
    <div style={{ marginBottom: '20px' }}>
      {!isSinglePrefilled && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {mappedDomain
              ? (domains.find(function(d) { return d.id === mappedDomain })?.label || mappedDomain) + ' · Top Picks'
              : 'Highest Demand Certs'}
          </div>
          {mappedDomain && (
            <button
              onClick={function() { setShowAll(function(v) { return !v }) }}
              style={{ fontFamily: FM, fontSize: '9px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase', padding: 0 }}
            >
              {showAll ? 'Show Less ▴' : 'Show All ▾'}
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {finalList.map(function(cert, i) {
          const active      = activeCertName === cert.name
          const isPrefill   = preferred.some(function(p) { return p.id === cert.id })
          const demColor    = dc(cert.demand)
          const readiness   = getCertReadiness(cert.forWho)

          return (
            <motion.button
              key={cert.id}
              onClick={function() { onPick(cert) }}
              whileHover={{ scale: 1.01, x: 2 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '11px',
                background: active ? (isPrefill ? 'var(--accent-light, #4A8C6A)12' : 'var(--accent-light, #4A8C6A)08') : 'var(--surface)',
                border: '1px solid ' + (active ? 'var(--accent-light, #4A8C6A)' : 'var(--border)'),
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                textAlign: 'left', transition: 'all 0.18s',
              }}
            >
              <div style={{ width: 26, height: 26, borderRadius: '7px', flexShrink: 0, background: active ? 'var(--surface-high)' : 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isPrefill
                  ? <Star size={11} color="var(--gold)" fill="var(--gold)" />
                  : <span style={{ fontFamily: FM, fontSize: '10px', fontWeight: '700', color: active ? PICTON : 'var(--text-4)' }}>#{i + 1}</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FH, fontWeight: '700', fontSize: '13px', color: active ? (isPrefill ? EMERALD : PICTON) : 'var(--text)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                  {cert.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: FB, fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                    {cert.forWho}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '1px 6px', borderRadius: '9999px', background: readiness.color + '12', border: '1px solid ' + readiness.color + '25', flexShrink: 0 }}>
                    <ShieldCheck size={8} color={readiness.color} />
                    <span style={{ fontFamily: FM, fontSize: '8px', color: readiness.color, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{readiness.label}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                <span style={{ fontFamily: FM, fontSize: '11px', fontWeight: '700', color: EMERALD }}>+{cert.avgHike}%</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: demColor }} />
                  <span style={{ fontFamily: FM, fontSize: '9px', color: 'var(--text-4)' }}>{cert.timeMonths}mo</span>
                </div>
              </div>
              <motion.div animate={{ x: active ? 2 : 0 }} transition={{ duration: 0.15 }}>
                <ArrowRight size={12} color={active ? (isPrefill ? EMERALD : PICTON) : 'var(--text-4)'} />
              </motion.div>
            </motion.button>
          )
        })}
      </div>

      {hasMoreDomain && (
        <button
          onClick={function() { setShowAll(true) }}
          style={{ width: '100%', marginTop: '8px', padding: '8px', borderRadius: '8px', background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text-4)', fontFamily: FM, fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
        >
          + {domainList.length - 10} more in this domain
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// PICK MESSAGE
// ─────────────────────────────────────────────────────────
function PickMessage({ certName, prefilledCert, firstName }) {
  if (!certName) return null
  const prefersReduced = useReducedMotion()

  const isPrimary = prefilledCert &&
    (certName.toLowerCase().includes(prefilledCert.toLowerCase()) ||
     prefilledCert.toLowerCase().includes(certName.toLowerCase()))

  const springTransition = prefersReduced
    ? { duration: 0 }
    : { type: 'spring', stiffness: 420, damping: 28 }

  if (isPrimary) {
    return (
      <motion.div
        key="great"
        initial={{ opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        exit={{   opacity: 0, y: -6 }}
        transition={springTransition}
        style={{ marginBottom: '16px', padding: '13px 16px', borderRadius: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.28)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}
      >
        <motion.div
          animate={prefersReduced ? {} : { rotate: [0, -10, 10, -6, 6, 0] }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ flexShrink: 0, marginTop: '1px' }}
        >
          <CheckCircle size={16} color={EMERALD} />
        </motion.div>
        <div>
          <div style={{ fontFamily: FH, fontWeight: '800', fontSize: '14px', color: EMERALD, letterSpacing: '-0.01em', marginBottom: '3px' }}>
            {firstName ? 'Great choice, ' + firstName + '.' : 'Strong move.'}
          </div>
          <div style={{ fontFamily: FB, fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.6 }}>
            This is exactly what our data points to for your profile. Run the numbers below.
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      key="interesting"
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      exit={{   opacity: 0, y: -6 }}
      transition={springTransition}
      style={{ marginBottom: '16px', padding: '13px 16px', borderRadius: '12px', background: 'rgba(81,177,231,0.07)', border: '1px solid rgba(81,177,231,0.25)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}
    >
      <Info size={16} color={PICTON} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div>
        <div style={{ fontFamily: FH, fontWeight: '800', fontSize: '14px', color: PICTON, letterSpacing: '-0.01em', marginBottom: '3px' }}>
          Interesting choice.
        </div>
        <div style={{ fontFamily: FB, fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.6 }}>
          Here's the honest ROI for {certName.split(' ').slice(0, 3).join(' ')}. No sugarcoating.
        </div>
      </div>
    </motion.div>
  )
}

// ── Payback range bar (confidence interval visual) ───────
function PaybackRangeBar({ lo, hi, mid, color }) {
  // Render a horizontal timeline: lo ─────[mid]───── hi
  // The center "most likely" zone is highlighted
  const spread = hi - lo
  if (!spread || spread <= 0) return null
  const leftPct  = 0
  const midLeft  = ((mid - 0.5 - lo) / spread) * 100
  const midRight = ((mid + 0.5 - lo) / spread) * 100

  return (
    <div style={{ marginTop: '10px', padding: '0 4px' }}>
      <div style={{ position: 'relative', height: '6px', borderRadius: '99px', background: color + '1A', overflow: 'hidden' }}>
        {/* Highlighted center zone */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: Math.max(0, midLeft) + '%',
          width: Math.min(100, midRight - midLeft) + '%',
          background: color,
          borderRadius: '99px',
          opacity: 0.85,
        }} />
        {/* Full range track */}
        <div style={{ position: 'absolute', top: '2px', bottom: '2px', left: '2px', right: '2px', borderRadius: '99px', background: color + '30' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: color + 'AA' }}>{lo} mo</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: color, fontWeight: '700' }}>~{mid} mo</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: color + 'AA' }}>{hi} mo</span>
      </div>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────
function StatCard({ label, value, sub, color, delay = 0, badge, rangeData }) {
  const prefersReduced = useReducedMotion()
  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...TT, delay: prefersReduced ? 0 : delay }}
      style={{
        padding: '16px',
        borderRadius: '20px',
        background: color + '10',
        border: '1px solid ' + color + '20',
        textAlign: 'center',
        boxShadow: '0 4px 20px -5px ' + color + '20',
      }}
    >
      <div className="micro-label" style={{ color: 'var(--text-4)', marginBottom: '5px' }}>{label}</div>
      <div className="tabular-nums" style={{ fontSize: 'clamp(0.9rem,2vw,1.4rem)', fontWeight: '800', color, letterSpacing: '-0.03em' }}>{value}</div>
      {sub && <div style={{ fontSize: '10px', color: 'var(--text-4)', marginTop: '4px', fontFamily: FB, lineHeight: '1.4' }}>{sub}</div>}
      {badge && (
        <div style={{ marginTop: '7px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '9999px', background: badge.color + '15', border: '1px solid ' + badge.color + '30' }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: badge.color }} />
          <span style={{ fontFamily: FM, fontSize: '9px', color: badge.color, letterSpacing: '0.06em' }}>{badge.label}</span>
        </div>
      )}
      {rangeData && <PaybackRangeBar lo={rangeData.lo} hi={rangeData.hi} mid={rangeData.mid} color={color} />}
    </motion.div>
  )
}

// ── Chart tooltip ─────────────────────────────────────────
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass" style={{ borderRadius: '10px', padding: '10px 14px' }}>
      <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', marginBottom: '5px' }}>{label}</div>
      {payload.map(function(p, i) {
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color }} />
            <span style={{ fontFamily: FM, fontSize: '12px', color: 'var(--text-2)' }}>
              {p.name}: {p.value >= 0 ? '+' : ''}₹{p.value}K
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// AI RESULT PANEL
// ─────────────────────────────────────────────────────────
function AIResult({ result, certName, onReset }) {
  const prefersReduced = useReducedMotion()
  var vc = result.verdict?.toLowerCase().includes('strong')   ? EMERALD
         : result.verdict?.toLowerCase().includes('moderate') ? AMBER
         : '#EF4444'

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={TT}
      className="glass"
      style={{ marginTop: '14px', borderRadius: '24px', overflow: 'hidden' }}
    >
      <div style={{ padding: '14px 16px', background: vc + '0d', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div>
          <div className="micro-label" style={{ color: 'var(--text-4)', marginBottom: '5px' }}>ROI ASSESSMENT</div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: vc, fontFamily: FH, lineHeight: '1.4' }}>
            {result.verdict}
          </div>
        </div>
        <button onClick={onReset} style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
          <RefreshCw size={13} />
        </button>
      </div>

      {(result.breakEven || result.projection) && (
        <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '10px' }}>
          {result.breakEven && (
            <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: FM, fontSize: '9px', color: AMBER, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>BREAK-EVEN</div>
              <div style={{ fontSize: '12px', color: 'var(--text-2)', fontFamily: FB, lineHeight: '1.6' }}>{result.breakEven}</div>
            </div>
          )}
          {result.projection && (
            <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: FM, fontSize: '9px', color: EMERALD, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>5-YR PROJECTION</div>
              <div style={{ fontSize: '12px', color: 'var(--text-2)', fontFamily: FB, lineHeight: '1.6' }}>{result.projection}</div>
            </div>
          )}
        </div>
      )}

      {result.demand?.length > 0 && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ fontFamily: FM, fontSize: '9px', color: VIOLET, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '7px' }}>MARKET DEMAND</div>
          {result.demand.map(function(d, i) {
            return (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '5px' }}>
                <span style={{ color: VIOLET, fontFamily: FM, fontSize: '11px', flexShrink: 0 }}>◆</span>
                <span style={{ fontSize: '12px', color: 'var(--text-2)', fontFamily: FB, lineHeight: '1.5' }}>{d}</span>
              </div>
            )
          })}
        </div>
      )}

      {result.risks?.length > 0 && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ fontFamily: FM, fontSize: '9px', color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '7px' }}>RISKS</div>
          {result.risks.map(function(r, i) {
            return (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '5px' }}>
                <AlertTriangle size={11} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-2)', fontFamily: FB, lineHeight: '1.5' }}>{r}</span>
              </div>
            )
          })}
        </div>
      )}

      {result.bottomLine && (
        <div style={{ margin: '0 16px 12px', padding: '10px 13px', borderRadius: '9px', background: vc + '0d', border: '1px solid ' + vc + '22' }}>
          <div style={{ fontFamily: FM, fontSize: '9px', color: vc, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>BOTTOM LINE</div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: vc, fontFamily: FH }}>{result.bottomLine}</div>
        </div>
      )}

      <div style={{ margin: '0 16px 16px', padding: '9px 12px', borderRadius: '8px', background: 'rgba(100,116,139,0.06)', border: '1px solid rgba(100,116,139,0.12)', display: 'flex', gap: '7px', alignItems: 'flex-start' }}>
        <Info size={11} color="var(--text-4)" style={{ flexShrink: 0, marginTop: '1px' }} />
        <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', lineHeight: '1.6', letterSpacing: '0.02em' }}>
          These are estimates based on market medians — not guarantees. Results vary with company tier, negotiation, and market conditions. Source: LinkedIn India · Naukri · NASSCOM · Q1 2026.
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────
// MAIN HERO COMPONENT
// ─────────────────────────────────────────────────────────
function Hero({ mode, prefilledCert, resumeName, resumeCity, resumeDomain }) {
  // ── Props with fallbacks ────────────────────────────────
  mode          = mode          || 'professional'
  prefilledCert = prefilledCert || ''
  resumeName    = resumeName    || ''
  resumeCity    = resumeCity    || ''
  resumeDomain  = resumeDomain  || ''

  const isStudent      = mode === 'student'
  const prefersReduced = useReducedMotion()

  // ── Store: slider values (replaces useLocalStorage calls) ─
  const salary      = useJourneyStore(s => s.salary)
  const certCost    = useJourneyStore(s => s.certCost)
  const hikePercent = useJourneyStore(s => s.hikePercent)
  const expectedFirstSalary = useJourneyStore(s => s.expectedFirstSalary || 4.8)
  const setSalary      = useJourneyStore(s => s.setSalary)
  const setCertCost    = useJourneyStore(s => s.setCertCost)
  const setHikePercent = useJourneyStore(s => s.setHikePercent)
  const setExpectedFirstSalary = useJourneyStore(s => s.setExpectedFirstSalary)

  // ── Store: selected cert ────────────────────────────────
  const storeSelectedCert = useJourneyStore(s => s.selectedCert)
  const storeCertName     = useJourneyStore(s => s.certName)
  const storeSetSelected  = useJourneyStore(s => s.setSelectedCert)
  const storeClearCert    = useJourneyStore(s => s.clearCert)

  // ── Local UI state (transient — not persisted) ──────────
  const [aiResult,     setAiResult]     = useState(null)
  const [aiLoading,    setAiLoading]    = useState(false)
  const [aiError,      setAiError]      = useState(null)
  const [showVerifier, setShowVerifier] = useState(false)
  const [cooldown,     setCooldown]     = useState(0)
  const [showAll,      setShowAll]      = useState(false)
  const [certifications, setCertifications] = useState([])
  const [domains, setDomains] = useState([])

  // Derive from store
  const certName     = storeCertName     || prefilledCert
  const selectedCert = storeSelectedCert || null

  const { user } = useAuth()
  const guest    = useGuestCounter(GUEST_FREE_LIMIT)

  const firstName   = resumeName ? resumeName.split(' ')[0] : ''
  const displayCity = resumeCity

  // ── Cooldown timer ──────────────────────────────────────
  useEffect(function() {
    if (cooldown <= 0) return
    var t = setTimeout(function() { setCooldown(function(v) { return v - 1 }) }, 1000)
    return function() { clearTimeout(t) }
  }, [cooldown])

  useEffect(function() {
    const controller = new AbortController()
    Promise.all([
      fetchCertifications({ limit: 200, signal: controller.signal }),
      fetchDomains({ signal: controller.signal }),
    ]).then(function([certs, domainRows]) {
      setCertifications(certs)
      setDomains(domainRows)
    }).catch(function() {
      setCertifications([])
      setDomains([])
    })
    return function() { controller.abort() }
  }, [])

  // ── Sync prefilledCert from Resume AI ──────────────────
  useEffect(function() {
    if (!prefilledCert) return
    setAiResult(null)
    setAiError(null)
    var found = certifications.find(function(c) {
      return c.name.toLowerCase().includes(prefilledCert.toLowerCase()) ||
             prefilledCert.toLowerCase().includes(c.name.toLowerCase())
    })
    if (found) {
      storeSetSelected(found)
      // storeSetSelected auto-syncs certCost + hikePercent
    }
  }, [prefilledCert, certifications])

  // ── Student mode: zero salary ───────────────────────────
  useEffect(function() {
    if (isStudent) setSalary(0)
  }, [isStudent])

  const roi = useROICalc({ currentSalary: isStudent ? expectedFirstSalary : salary, certCost, hikePercent: isStudent ? 0 : hikePercent })

  // ── Pick cert from leaderboard ──────────────────────────
  const pickCert = useCallback(function(cert) {
    storeSetSelected(cert)
    setAiResult(null)
    setAiError(null)
  }, [storeSetSelected])

  // ── AI analysis ─────────────────────────────────────────
  const analyse = useCallback(async function() {
    if (!certName.trim())        { setAiError('Select a certification first'); return }
    if (!user && guest.exceeded) { setAiError('Free limit reached — sign in for unlimited'); return }
    if (cooldown > 0) return
    setAiLoading(true)
    setAiResult(null)
    setAiError(null)
    try {
      var r = await analyzeROI({ certName, currentSalary: salary, certCost, hikePercent, isStudent })
      setAiResult(r)
      if (!user) guest.increment()
      setCooldown(10)
    } catch(e) {
      setAiError(e.message || 'Analysis failed')
    }
    setAiLoading(false)
  }, [certName, salary, certCost, hikePercent, isStudent, user, guest, cooldown])

  var canAnalyse = certName && (user || !guest.exceeded) && cooldown === 0

  // ── Domain + cert lists ─────────────────────────────────
  const demandScore = function(d) {
    return d === 'Very High' ? 4 : d === 'High' ? 3 : d === 'Medium' ? 2 : 1
  }
  const domainAliases = {
    tech: 'tech', data: 'data', management: 'management', business: 'business',
    finance: 'finance', marketing: 'marketing', product: 'product',
    design: 'design', hr: 'hr', cybersecurity: 'cybersecurity',
    medical: 'medical', law: 'law', architecture: 'architecture',
    engineering: 'engineering', government: 'government', mba: 'mba',
  }
  const mappedDomain    = domainAliases[resumeDomain] || null
  const domainMatchList = mappedDomain ? CERTIFICATIONS.filter(function(c) { return c.domain === mappedDomain }) : []
  const sortedByDem     = [...CERTIFICATIONS].sort(function(a, b) { return demandScore(b.demand) - demandScore(a.demand) || b.avgHike - a.avgHike })
  const preferredCerts  = prefilledCert
    ? CERTIFICATIONS.filter(function(c) { return c.name.toLowerCase().includes(prefilledCert.toLowerCase()) || prefilledCert.toLowerCase().includes(c.name.toLowerCase()) })
    : []

  // ── Reduced-motion transition helper ───────────────────
  const T = prefersReduced ? { duration: 0 } : TT

  return (
    <div style={{ position: 'relative' }}>

      {/* ── Personalisation banner ─────────────────────── */}
      {(firstName || displayCity || prefilledCert) ? (
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={T}
          style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}
        >
          {firstName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={13} color={VIOLET} />
              <span style={{ fontSize: '13px', color: 'var(--text)', fontFamily: FH, fontWeight: '700' }}>{firstName}</span>
            </div>
          ) : null}
          {displayCity ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={11} color={PICTON} />
              <span style={{ fontSize: '12px', color: PICTON, fontFamily: FM }}>{displayCity}</span>
            </div>
          ) : null}
          {prefilledCert ? (
            <span style={{ marginLeft: 'auto', fontSize: '10px', color: VIOLET, fontFamily: FM, padding: '2px 7px', borderRadius: '4px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              Auto-mapped from resume
            </span>
          ) : null}
        </motion.div>
      ) : null}

      {/* ── Guest counter ──────────────────────────────── */}
      {!user ? (
        <div style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '9px', background: guest.exceeded ? 'rgba(239,68,68,0.07)' : 'rgba(99,102,241,0.06)', border: '1px solid ' + (guest.exceeded ? 'rgba(239,68,68,0.25)' : 'rgba(99,102,241,0.18)'), display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: guest.exceeded ? '#EF4444' : VIOLET, fontFamily: FB }}>
            {guest.exceeded ? 'Free AI analyses used — sign in to continue' : guest.remaining + ' free AI analyses left'}
          </span>
        </div>
      ) : null}

      {/* ── Cert leaderboard ───────────────────────────── */}
      {!prefilledCert && (
        <Leadboard
          domainList={domainMatchList} sorted={sortedByDem} preferred={preferredCerts}
          showAll={showAll} setShowAll={setShowAll}
          activeCertName={certName} onPick={pickCert} mappedDomain={mappedDomain} isPrefilled={!!prefilledCert}
        />
      )}

      {/* ── Great / Interesting choice message ─────────── */}
      <AnimatePresence mode="wait">
        {certName ? (
          <PickMessage key={certName} certName={certName} prefilledCert={prefilledCert} firstName={firstName} />
        ) : null}
      </AnimatePresence>

      {/* ── Selected cert detail strip ─────────────────── */}
      <AnimatePresence>
        {selectedCert ? (() => {
          const stripReadiness = getCertReadiness(selectedCert.forWho)
          const notIdealNote   = getNotIdealNote(selectedCert)
          return (
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={T}
              style={{ marginBottom: '18px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)', overflow: 'hidden' }}
            >
              <div style={{ padding: '11px 14px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', borderBottom: notIdealNote ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontFamily: FH, fontWeight: '700', fontSize: '12px', color: VIOLET }}>{selectedCert.name}</span>
                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: dc(selectedCert.demand) + '18', color: dc(selectedCert.demand), fontFamily: FM }}>{selectedCert.demand}</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '9999px', background: stripReadiness.color + '13', border: '1px solid ' + stripReadiness.color + '28' }}>
                  <ShieldCheck size={9} color={stripReadiness.color} />
                  <span style={{ fontFamily: FM, fontSize: '9px', color: stripReadiness.color, letterSpacing: '0.06em' }}>{stripReadiness.label}</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: FB }}>{selectedCert.forWho}</span>
                <a href={selectedCert.link} target="_blank" rel="noopener noreferrer"
                  style={{ marginLeft: 'auto', fontSize: '11px', color: VIOLET, fontFamily: FM, textDecoration: 'none', letterSpacing: '0.05em' }}>
                  Official Site
                </a>
              </div>
              {notIdealNote && (
                <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px', background: AMBER + '08' }}>
                  <AlertTriangle size={11} color={AMBER} style={{ flexShrink: 0 }} />
                  <span style={{ fontFamily: FM, fontSize: '10px', color: AMBER, letterSpacing: '0.03em', lineHeight: '1.5' }}>
                    Not ideal if: {notIdealNote}
                  </span>
                </div>
              )}
            </motion.div>
          )
        })() : null}
      </AnimatePresence>

      {/* ── Sliders ─────────────────────────────────────── */}
      <div className="glass" style={{ marginBottom: '20px', padding: '20px 18px', borderRadius: '13px' }}>

        {isStudent ? (
          <div style={{ marginBottom: '18px', padding: '11px 13px', borderRadius: '9px', background: 'rgba(74,140,106,0.07)', border: '1px solid rgba(74,140,106,0.2)' }}>
            <div style={{ fontSize: '11px', color: '#4A8C6A', fontFamily: FM, marginBottom: '3px' }}>BREAKING IN</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: FB }}>Target: first offer. Projected ROI based on time-to-hire, not salary hike.</div>
          </div>
        ) : (
          <>
            <Slider
              label="Current Salary"
              value={salary}
              min={2} max={40} step={0.5}
              onChange={setSalary}
              prefix="₹" suffix="L/yr"
              color={PICTON}
              note={displayCity || ''}
            />
            <DataNote>
              Salary benchmarks: Naukri salary insights + LinkedIn India · Median values · {displayCity || 'India'} · Q1 2026
            </DataNote>
          </>
        )}

        <div style={{ marginTop: isStudent ? '0' : '16px' }}>
          <Slider
            label="Cert Cost"
            value={certCost}
            min={0} max={6} step={0.1}
            onChange={setCertCost}
            prefix="₹" suffix="L"
            color={INDIGO}
          />
          {(() => {
            const band = getAffordabilityBand(certCost, salary, isStudent)
            if (!band) return null
            return (
              <motion.div
                key={band.label}
                initial={prefersReduced ? false : { opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '9999px', background: band.color + '13', border: '1px solid ' + band.color + '28' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: band.color }} />
                  <span style={{ fontFamily: FM, fontSize: '10px', color: band.color, fontWeight: '700', letterSpacing: '0.06em' }}>{band.label}</span>
                </div>
                <span style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.02em' }}>{band.tip}</span>
              </motion.div>
            )
          })()}
        </div>

        {!isStudent ? (
          <>
            <Slider
              label="Expected Hike"
              value={hikePercent}
              min={5} max={80} step={5}
              onChange={setHikePercent}
              suffix="%"
              color={EMERALD}
            />
            <DataNote>
              Hike benchmarks: AmbitionBox post-cert salary data + NASSCOM 2026 · India median: 25–40% · Individual results vary by company tier and negotiation
            </DataNote>
          </>
        ) : null}
      </div>

      {/* ── Stat cards ─────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={salary + '-' + certCost + '-' + hikePercent + '-' + mode}
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.18 }}
        >
          {isStudent ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px', marginBottom: '12px' }}>
              <StatCard label="Target Offer"  value="₹4.8L+"               color={VIOLET} delay={0}    />
              <StatCard label="Investment"    value={'₹' + certCost + 'L'} color={AMBER}  delay={0.05} />
            </div>
          ) : (
            <>
              {/* ── Financial Hero Metrics ──────────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px', marginBottom: '12px' }}>
                <div className="glass" style={{ padding: '24px 16px', textAlign: 'center', borderColor: 'var(--border-accent)', background: EMERALD + '08' }}>
                  <div className="micro-label" style={{ color: 'var(--text-4)', marginBottom: '8px' }}>5-Yr Net Gain</div>
                  <div className="text-financial-hero" style={{ color: EMERALD }}>
                    ₹{roi.fiveYearGainL}L
                  </div>
                </div>
                <div className="glass" style={{ padding: '24px 16px', textAlign: 'center', borderColor: roi.roiPercent > 200 ? 'var(--border-accent)' : 'var(--border)', background: roi.roiPercent > 200 ? EMERALD + '08' : VIOLET + '08' }}>
                  <div className="micro-label" style={{ color: 'var(--text-4)', marginBottom: '8px' }}>Projected ROI</div>
                  <div className="text-financial-hero" style={{ color: roi.roiPercent > 200 ? EMERALD : VIOLET }}>
                    {roi.roiPercent}%
                  </div>
                </div>
              </div>

              {/* ── Secondary Dash Stats ────────────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                <StatCard label="New Salary"    value={'₹' + roi.newSalaryL + 'L/yr'}         color={PICTON}  delay={0}    />
                <StatCard label="Monthly +"     value={'₹' + roi.monthlyGainK + 'K'}           color={VIOLET}  delay={0.05} />
                <StatCard
                  label="Payback Window"
                  value={
                    selectedCert
                      ? getPaybackRange(roi.breakEvenMonths, selectedCert.demand, hikePercent)
                      : (roi.breakEvenMonths > 0 ? roi.breakEvenMonths + ' mo' : '--')
                  }
                  sub={roi.anchor}
                  color={AMBER}
                  delay={0.1}
                  badge={selectedCert ? getPaybackConfidence(selectedCert.demand, hikePercent) : null}
                  rangeData={selectedCert && roi.breakEvenMonths > 0 ? (() => {
                    const conf   = getPaybackConfidence(selectedCert.demand, hikePercent)
                    const spread = conf.label === 'High confidence' ? 0.15 : conf.label === 'Medium confidence' ? 0.25 : 0.35
                    return {
                      lo:  Math.max(1, Math.round(roi.breakEvenMonths * (1 - spread))),
                      hi:  Math.round(roi.breakEvenMonths * (1 + spread)),
                      mid: roi.breakEvenMonths,
                    }
                  })() : null}
                />
              </div>
            </>
          )}

          {!isStudent && (
            <DataNote>
              All figures are estimates based on market medians. Break-even assumes you negotiate the full hike on your next job switch. 5-year gain = cumulative salary uplift minus cert cost.
            </DataNote>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Student path graphic ───────────────────────── */}
      <AnimatePresence>
        {isStudent && certName ? (
          <StudentPath key={certName} certName={certName} certCost={certCost} />
        ) : null}
      </AnimatePresence>

      {/* ── Chart ──────────────────────────────────────── */}
      {!isStudent && roi.chartData && roi.chartData.length > 0 ? (
        <div className="glass" style={{ marginBottom: '20px', marginTop: '16px', padding: '16px', borderRadius: '13px' }}>
          <div style={{ fontFamily: FM, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>CUMULATIVE GAIN — 24 MONTHS</div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={roi.chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--text-4)', fontFamily: FM }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--text-4)', fontFamily: FM }} axisLine={false} tickLine={false} tickFormatter={function(v) { return '₹' + v + 'K' }} />
              <Tooltip content={ChartTip} />
              <ReferenceLine y={0} stroke="rgba(99,102,241,0.08)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="action"   name="With Cert" stroke={EMERALD} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: EMERALD }} />
              <Line type="monotone" dataKey="inaction" name="Inaction"  stroke="#475569" strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {/* ── AI analyse button ──────────────────────────── */}
      <div style={{ marginBottom: '16px' }}>
        {aiError ? (
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={T}
            style={{ marginBottom: '10px', padding: '9px 12px', borderRadius: '9px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '12px', color: '#EF4444', fontFamily: FB }}
          >
            {aiError}
          </motion.div>
        ) : null}

        <AnimatePresence mode="wait">
          {!aiResult && !aiLoading ? (
            <motion.div
              key="btn"
              initial={prefersReduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.15 }}
            >
              <motion.button
                onClick={analyse}
                disabled={!canAnalyse}
                whileHover={canAnalyse && !prefersReduced ? { y: -3, scale: 1.02 } : {}}
                whileTap={canAnalyse && !prefersReduced ? { scale: 0.97 } : {}}
                style={{
                  width: '100%', padding: '14px 22px',
                  borderRadius: '9999px',
                  background: cooldown > 0 ? 'var(--surface)' : 'linear-gradient(135deg,' + INDIGO + ',#4338CA)',
                  border: cooldown > 0 ? '1px solid var(--border)' : 'none',
                  color: cooldown > 0 ? 'var(--text-4)' : 'white',
                  fontSize: '14px', fontWeight: '700',
                  cursor: canAnalyse ? 'pointer' : 'not-allowed',
                  fontFamily: FH, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: !certName ? 0.45 : 1, letterSpacing: '-0.01em', transition: 'all 0.3s',
                  boxShadow: canAnalyse ? '0 10px 25px -5px rgba(99, 102, 241, 0.4)' : 'none',
                }}
              >
                {cooldown > 0 ? (
                  <span>Cooling down {cooldown}s</span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={15} />
                    Get AI ROI Assessment
                  </span>
                )}
              </motion.button>
            </motion.div>
          ) : null}

          {aiLoading ? (
            <motion.div
              key="loading"
              initial={prefersReduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.15 }}
            >
              <AILoadingState certName={certName} />
            </motion.div>
          ) : null}

          {aiResult ? (
            <motion.div
              key="result"
              initial={prefersReduced ? false : { opacity: 0, y: 8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -4, filter: 'blur(4px)' }}
              transition={prefersReduced ? { duration: 0 } : { type: 'spring', duration: 0.45, bounce: 0 }}
            >
              <AIResult result={aiResult} certName={certName} onReset={function() { setAiResult(null) }} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* ── Tools row ──────────────────────────────────── */}
      {certName ? (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <button
            onClick={function() { setShowVerifier(function(v) { return !v }) }}
            style={{ padding: '8px 14px', borderRadius: '9px', background: showVerifier ? 'rgba(16,185,129,0.1)' : 'var(--surface)', border: '1px solid ' + (showVerifier ? 'rgba(16,185,129,0.25)' : 'var(--border)'), color: showVerifier ? EMERALD : 'var(--text-3)', fontSize: '12px', cursor: 'pointer', fontFamily: FB, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.18s' }}
          >
            <CheckCircle size={12} /> Verify My Hike
          </button>
          <ShareURLButton certName={certName} salary={salary} certCost={certCost} hikePercent={hikePercent} mode={mode} />
        </div>
      ) : null}

      {/* ── Verify hike panel ──────────────────────────── */}
      <AnimatePresence>
        {showVerifier && certName ? (
          <motion.div
            key="hv"
            initial={prefersReduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={T}
          >
            <HikeVerifier certName={certName} projectedHike={hikePercent} onClose={function() { setShowVerifier(false) }} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── Pitch Boss + Share card ─────────────────────── */}
      {certName ? (
        <div>
          <PitchBoss certName={certName} salary={salary} certCost={certCost} hikePercent={hikePercent} name={resumeName} mode={mode} />
          {!isStudent ? (
            <ShareROICard certName={certName} domain={selectedCert ? selectedCert.domain : ''} demand={selectedCert ? selectedCert.demand : 'High'} name={resumeName} />
          ) : null}
        </div>
      ) : null}

    </div>
  )
}

export default Hero

