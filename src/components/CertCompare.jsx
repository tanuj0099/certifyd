import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, ChevronDown, Scale, Info, Zap, DollarSign, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase.js'

//  Font tokens  CSS variables 
// NOTE: SVG text elements cannot use CSS variables in presentation attributes.
// All SVG <text> elements use style={{ fontFamily: 'var(--font-mono)' }} instead.
var F_HEAD = 'var(--font-head)'
var F_MONO = 'var(--font-mono)'
var F_BODY = 'var(--font-body)'

var COLORS = ['var(--linear-blue)', 'var(--linear-blue)', 'var(--cool-grey)', '#E11D48']
var COL_A = '#F4F5F8'       // Cert A — crisp white
var COL_B = '#60A5FA'       // Cert B — sky blue (distinct, accessible)

function demandColor(d) {
  return d === 'Very High' ? 'var(--linear-blue)' : d === 'High' ? 'var(--linear-blue)' : d === 'Medium' ? 'var(--cool-grey)' : '#94A3B8'
}
function demandScore(d) {
  return d === 'Very High' ? 4 : d === 'High' ? 3 : d === 'Medium' ? 2 : 1
}

//  Normalize raw Supabase row  consistent camelCase shape 
// certifications table schema (public.certifications):
//   id, name, provider, cost_inr, difficulty, time_commitment_months,
//   median_roi_percent, description, slug
function normalizeCert(row) {
  return {
    id:         row.id,
    name:       row.name || row.cert_name || '',
    // Salary uplift: median_roi_percent is the primary Supabase column
    avgHike:    Number(row.median_roi_percent ?? row.avg_hike ?? row.avgHike) || 0,
    // Certification cost: cost_inr is the primary Supabase column (stored in full INR, not lakhs)
    avgCost:    Number(row.cost_inr ?? row.avg_cost ?? row.avgCost) || 0,
    // Prep time: time_commitment_months is the primary Supabase column
    timeMonths: Number(row.time_commitment_months ?? row.time_months ?? row.timeMonths ?? row.prep_time_months) || 0,
    demand:     row.difficulty || row.demand || row.difficulty_level || 'Medium',
    domain:     row.domain_id   || row.domain      || row.domain_name || '',
    forWho:     row.description || row.for_who     || row.forWho       || '',
    tags:       Array.isArray(row.tags) ? row.tags : [],
    link:       row.link        || row.url          || '',
  }
}

//  Cert selector dropdown 
function CertSelector({ value, onChange, label, color, certifications, domains }) {
  var [open, setOpen] = useState(false)
  var [domain, setDomain] = useState('all')
  // FIX: ref for outside-click detection
  var wrapRef = useRef(null)

  var filtered = certifications.filter(function (c) {
    return domain === 'all' || c.domain === domain
  })
  var selected = certifications.find(function (c) { return c.name === value })

  // FIX: close dropdown on outside click.
  // Previously the dropdown stayed open when user clicked elsewhere - broke focus and created
  // confusing state where two dropdowns could be open simultaneously.
  useEffect(function () {
    if (!open) return
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return function () { document.removeEventListener('mousedown', handleOutside) }
  }, [open])

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: F_MONO, fontSize: '9px', color: color, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>
        {label}
      </div>

      <button
        onClick={function () { setOpen(function (v) { return !v }) }}
        style={{
          width: '100%', padding: '16px 14px',
          background: selected ? color + '0e' : 'transparent',
          border: '1px solid ' + (selected ? color + '44' : 'var(--border)'),
          borderRadius: '10px',
          color: selected ? color : 'var(--text-4)',
          fontSize: '13px', cursor: 'pointer',
          fontFamily: F_HEAD, fontWeight: selected ? '700' : '500',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
          transition: 'all 0.18s', textAlign: 'left',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.name : 'Pick a certification...'}
        </span>
        <ChevronDown
          size={13}
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              zIndex: 60, marginTop: '6px', borderRadius: '12px',
              background: 'var(--bg)',
              border: '1px solid ' + color + '44',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', gap: '4px', padding: '8px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
              {[{ id: 'all', label: 'All' }, ...domains.slice(0, 6)].map(function (d) {
                return (
                  <button key={d.id} onClick={function () { setDomain(d.id) }}
                    style={{
                      padding: '3px 9px', borderRadius: '20px', fontSize: '11px',
                      cursor: 'pointer', fontFamily: F_BODY, fontWeight: '600',
                      background: domain === d.id ? 'var(--indigo-dim)' : 'transparent',
                      border: '1px solid ' + (domain === d.id ? 'var(--border-accent)' : 'var(--border)'),
                      color: domain === d.id ? 'var(--indigo-light)' : 'var(--text-4)',
                      whiteSpace: 'nowrap', transition: 'all 0.15s',
                    }}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>

            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {filtered.map(function (cert) {
                return (
                  <button key={cert.id}
                    onClick={function () { onChange(cert.name); setOpen(false) }}
                    style={{
                      width: '100%', padding: '10px 14px',
                      background: value === cert.name ? color + '12' : 'transparent',
                      border: 'none',
                      color: value === cert.name ? color : 'var(--text-2)',
                      fontSize: '13px', cursor: 'pointer',
                      fontFamily: F_BODY, textAlign: 'left',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      gap: '8px', transition: 'background 0.12s',
                    }}
                    onMouseEnter={function (e) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={function (e) { if (value !== cert.name) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cert.name}
                    </span>
                    <span style={{ fontSize: '10px', color: demandColor(cert.demand), fontFamily: F_MONO, flexShrink: 0 }}>
                      +{cert.avgHike}%
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

//  Build radar data 
function buildRadarData(certA, certB, roiA, roiB) {
  var maxSpeed = 24

  function norm(val, min, max) {
    return Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100))
  }

  return [
    {
      axis: 'Hike %',
      A: norm(certA.avgHike, 0, 80),
      B: norm(certB.avgHike, 0, 80),
      rawA: '+' + certA.avgHike + '%',
      rawB: '+' + certB.avgHike + '%',
    },
    {
      axis: 'Demand',
      A: norm(demandScore(certA.demand), 0, 4),
      B: norm(demandScore(certB.demand), 0, 4),
      rawA: certA.demand,
      rawB: certB.demand,
    },
    {
      axis: 'Speed',
      A: norm(maxSpeed - certA.timeMonths, 0, maxSpeed),
      B: norm(maxSpeed - certB.timeMonths, 0, maxSpeed),
      rawA: certA.timeMonths + ' mo',
      rawB: certB.timeMonths + ' mo',
    },
    {
      axis: 'Cost Eff.',
      A: norm(roiA.roiPct, 0, 400),
      B: norm(roiB.roiPct, 0, 400),
      rawA: roiA.roiPct + '% ROI',
      rawB: roiB.roiPct + '% ROI',
    },
    {
      axis: 'Job Market',
      A: norm(demandScore(certA.demand) * 20 + certA.avgHike * 0.5, 0, 100),
      B: norm(demandScore(certB.demand) * 20 + certB.avgHike * 0.5, 0, 100),
      rawA: certA.demand + '  +' + certA.avgHike + '%',
      rawB: certB.demand + '  +' + certB.avgHike + '%',
    },
  ]
}

//  Pure SVG Radar Chart — glassmorphism overhaul, no glow
// Labels use a large LABEL_PUSH so axis names + raw values never overlap.
function RadarChartSVG({ data, nameA, nameB, animate }) {
  // Viewbox & geometry — generous padding so labels never clip
  var W = 560
  var H = 460
  var CX = W / 2
  var CY = H / 2 + 10
  var R  = 110          // inner web radius
  var LABEL_R  = R + 30    // axis-name ring (axis label)
  var RAW_A_R  = R + 50    // cert A value ring
  var RAW_B_R  = R + 68    // cert B value ring
  var RINGS = [0.25, 0.5, 0.75, 1.0]
  var N = data.length

  var [hovered, setHovered] = useState(null)

  function polar(i, r) {
    var angle = (2 * Math.PI * i / N) - Math.PI / 2
    var rSafe = isFinite(r) ? r : 0
    return { x: CX + rSafe * Math.cos(angle), y: CY + rSafe * Math.sin(angle) }
  }

  function toPoints(scores) {
    return scores.map(function (s, i) {
      var sSafe = isFinite(s) ? s : 0
      var p = polar(i, (sSafe / 100) * R)
      return p.x.toFixed(3) + ',' + p.y.toFixed(3)
    }).join(' ')
  }

  var scoresA   = data.map(function (d) { return d.A })
  var scoresB   = data.map(function (d) { return d.B })
  var pointsA   = toPoints(scoresA)
  var pointsB   = toPoints(scoresB)

  // Web rings
  var rings = RINGS.map(function (pct) {
    return data.map(function (_, i) {
      var p = polar(i, R * pct)
      return p.x.toFixed(3) + ',' + p.y.toFixed(3)
    }).join(' ')
  })

  var spokes  = data.map(function (_, i) { return polar(i, R) })
  var dotsA   = scoresA.map(function (s, i) { return { ...polar(i, (s / 100) * R), score: s, raw: data[i].rawA } })
  var dotsB   = scoresB.map(function (s, i) { return { ...polar(i, (s / 100) * R), score: s, raw: data[i].rawB } })

  // Label positions — pushed well outside the web, A and B on separate lines
  var labelNodes = data.map(function (d, i) {
    var angle   = (2 * Math.PI * i / N) - Math.PI / 2
    var dx      = Math.cos(angle)
    var dy      = Math.sin(angle)
    // textAnchor based on which side of center the label falls
    var anchor  = Math.abs(dx) < 0.2 ? 'middle' : dx > 0 ? 'start' : 'end'
    return {
      i, axis: d.axis, rawA: d.rawA, rawB: d.rawB, anchor,
      ax:  CX + LABEL_R  * dx,   ay:  CY + LABEL_R  * dy,
      rax: CX + RAW_A_R  * dx,   ray: CY + RAW_A_R  * dy,
      rbx: CX + RAW_B_R  * dx,   rby: CY + RAW_B_R  * dy,
    }
  })

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={'0 0 ' + W + ' ' + H} width="100%" style={{ overflow: 'visible', display: 'block' }}>

        {/* ── Web rings — theme-aware via opacity ── */}
        {rings.map(function (pts, ri) {
          var isOuter = ri === rings.length - 1
          return (
            <polygon
              key={ri}
              points={pts}
              fill="none"
              stroke="var(--text-3)"
              strokeOpacity={isOuter ? '0.30' : '0.12'}
              strokeWidth={isOuter ? '1.2' : '0.8'}
              strokeDasharray={isOuter ? 'none' : '3 5'}
            />
          )
        })}

        {/* ── Axis spokes — theme-aware ── */}
        {spokes.map(function (pt, i) {
          return <line key={i} x1={CX} y1={CY} x2={pt.x} y2={pt.y} stroke="var(--text-3)" strokeOpacity="0.15" strokeWidth="1" />
        })}

        {/* ── Polygon A — fill, then crisp solid stroke ── */}
        <motion.polygon
          points={pointsA}
          fill={COL_A}
          fillOpacity="0.07"
          stroke="none"
          initial={{ opacity: 0 }} animate={{ opacity: animate ? 1 : 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        />
        <motion.polygon
          points={pointsA}
          fill="none"
          stroke={COL_A}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeOpacity="0.85"
          initial={{ opacity: 0 }} animate={{ opacity: animate ? 1 : 0 }} transition={{ duration: 0.6, delay: 0.15 }}
        />

        {/* ── Polygon B — fill, then crisp solid stroke ── */}
        <motion.polygon
          points={pointsB}
          fill={COL_B}
          fillOpacity="0.07"
          stroke="none"
          initial={{ opacity: 0 }} animate={{ opacity: animate ? 1 : 0 }} transition={{ duration: 0.5, delay: 0.2 }}
        />
        <motion.polygon
          points={pointsB}
          fill="none"
          stroke={COL_B}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeOpacity="0.80"
          initial={{ opacity: 0 }} animate={{ opacity: animate ? 1 : 0 }} transition={{ duration: 0.6, delay: 0.25 }}
        />

        {/* ── Vertex dots — A (no filter/glow) ── */}
        {dotsA.map(function (dot, i) {
          return (
            <motion.circle key={'a' + i}
              cx={dot.x} cy={dot.y}
              r={hovered === 'A' + i ? 7 : 4.5}
              fill={COL_A}
              stroke="var(--bg)"
              strokeWidth="1.5"
              style={{ cursor: 'pointer' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: animate ? 1 : 0, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.05 }}
              onMouseEnter={function () { setHovered('A' + i) }}
              onMouseLeave={function () { setHovered(null) }}
            />
          )
        })}

        {/* ── Vertex dots — B (no filter/glow) ── */}
        {dotsB.map(function (dot, i) {
          return (
            <motion.circle key={'b' + i}
              cx={dot.x} cy={dot.y}
              r={hovered === 'B' + i ? 7 : 4.5}
              fill={COL_B}
              stroke="var(--bg)"
              strokeWidth="1.5"
              style={{ cursor: 'pointer' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: animate ? 1 : 0, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.45 + i * 0.05 }}
              onMouseEnter={function () { setHovered('B' + i) }}
              onMouseLeave={function () { setHovered(null) }}
            />
          )
        })}

        {/* ── Hover tooltip ── */}
        {hovered && (
          (function () {
            var isA  = hovered.startsWith('A')
            var idx  = parseInt(hovered.slice(1))
            var dots = isA ? dotsA : dotsB
            var dot  = dots[idx]
            var raw  = isA ? data[idx].rawA : data[idx].rawB
            var col  = isA ? COL_A : COL_B
            var name = isA ? nameA : nameB
            var TW   = 130
            var TX   = dot.x + 14
            var TY   = dot.y - 34
            if (TX + TW > W) TX = dot.x - TW - 14
            if (TY < 10)     TY = dot.y + 14
            return (
              <g>
                <rect
                  x={TX} y={TY} width={TW} height={44} rx="8"
                  fill="var(--card)"
                  stroke={col}
                  strokeWidth="1"
                  strokeOpacity="0.5"
                />
                <text x={TX + 10} y={TY + 15} fontSize="9" fill={col} style={{ fontFamily: 'var(--font-mono)' }} fontWeight="700">
                  {name.split(' ').slice(0, 3).join(' ')}
                </text>
                <text x={TX + 10} y={TY + 31} fontSize="12" fill="var(--text)" style={{ fontFamily: 'var(--font-mono)' }} fontWeight="700">
                  {raw}
                </text>
              </g>
            )
          })()
        )}

        {/* ── Axis labels + raw values — wide spacing, never overlapping ── */}
        {labelNodes.map(function (lb) {
          return (
            <g key={lb.i}>
              {/* Axis name */}
              <text
                x={lb.ax} y={lb.ay}
                textAnchor={lb.anchor}
                dominantBaseline="middle"
                fontSize="9.5"
                style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}
                fill="var(--text-3)"
              >
                {lb.axis}
              </text>
              {/* Cert A raw value — line above axis label area */}
              <text
                x={lb.rax} y={lb.ray}
                textAnchor={lb.anchor}
                dominantBaseline="middle"
                fontSize="8.5"
                style={{ fontFamily: 'var(--font-mono)' }}
                fontWeight="700"
                fill={COL_A}
                fillOpacity="0.85"
              >
                {lb.rawA}
              </text>
              {/* Cert B raw value — separate line further out */}
              <text
                x={lb.rbx} y={lb.rby}
                textAnchor={lb.anchor}
                dominantBaseline="middle"
                fontSize="8.5"
                style={{ fontFamily: 'var(--font-mono)' }}
                fontWeight="700"
                fill={COL_B}
                fillOpacity="0.80"
              >
                {lb.rawB}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// 
// MAIN COMPONENT
// 

function CertCompare({ salary, prefilledCert }) {
  //  Database State 
  const [certificationsData, setCertificationsData] = useState([]);
  const [domainsData, setDomainsData] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);

  //  The "Once and For All" Alias Fix 
  const CERTIFICATIONS = certificationsData;
  const certifications = certificationsData;
  const CERT_DOMAINS = domainsData;
  const certDomains = domainsData;

  //  Fetch from Supabase on mount 
  useEffect(() => {
    async function fetchDatabase() {
      try {
        const [certsResponse, domainsResponse] = await Promise.all([
          supabase.from('certifications').select('*'),
          supabase.from('domains').select('*')
        ]);

        if (certsResponse.data) {
          // Normalize all rows to camelCase with defaults so no field is ever undefined
          setCertificationsData(certsResponse.data.map(normalizeCert));
        }
        if (domainsResponse.data) {
          // Domains table can have varied shapes - normalize to { id, label }
          const normalized = domainsResponse.data.map(function(d) {
            return {
              id:    d.id    || d.domain_id || d.slug || String(d.name || d.domain_name || d.label || ''),
              label: d.domain_name || d.label || d.name      || d.id   || 'Unknown',
            }
          })
          setDomainsData(normalized);
        }
      } catch (error) {
        console.error("CertCompare: Failed to fetch Supabase data:", error);
      } finally {
        setDbLoading(false);
      }
    }
    fetchDatabase();
  }, []);

  //  Loading Fallback 

  const actualSalary = salary > 0 ? salary : null
  prefilledCert = prefilledCert || ''

  var [certA, setCertA] = useState(prefilledCert || '')
  var [certB, setCertB] = useState('')

  var dataA = CERTIFICATIONS.find(function (c) { return c.name === certA })
  var dataB = CERTIFICATIONS.find(function (c) { return c.name === certB })

  var roiCalc = useCallback(function (cert, sal) {
    if (!cert || !sal) return null
    var annualGain = sal * 100000 * cert.avgHike / 100
    var breakEven = annualGain > 0 ? Math.ceil(cert.avgCost / (annualGain / 12)) : 0
    var fiveYearNet = ((annualGain * 5 - cert.avgCost) / 100000).toFixed(1)
    var roiPct = cert.avgCost > 0 ? Math.round((annualGain * 5 - cert.avgCost) / cert.avgCost * 100) : 0
    var annualGainL = (annualGain / 100000).toFixed(1)
    return { breakEven: breakEven, fiveYearNet: fiveYearNet, roiPct: roiPct, annualGain: annualGainL }
  }, [])

  var roiA = roiCalc(dataA, actualSalary)
  var roiB = roiCalc(dataB, actualSalary)

  var bothReady = dataA && dataB && roiA && roiB
  var radarData = bothReady ? buildRadarData(dataA, dataB, roiA, roiB) : []

  var winner = bothReady
    ? (parseFloat(roiA.fiveYearNet) > parseFloat(roiB.fiveYearNet) ? 'A' : 'B')
    : null

  const INR_FMT = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
  var TABLE_ROWS = bothReady ? [
    { label: 'Expected Hike',   vA: dataA.avgHike > 0 ? '+' + dataA.avgHike + '%' : '--', vB: dataB.avgHike > 0 ? '+' + dataB.avgHike + '%' : '--', win: dataA.avgHike > dataB.avgHike ? 'A' : 'B', winIcon: <TrendingUp size={10} /> },
    { label: 'Cert Cost',       vA: dataA.avgCost > 0 ? INR_FMT.format(dataA.avgCost) : '--', vB: dataB.avgCost > 0 ? INR_FMT.format(dataB.avgCost) : '--', win: (dataA.avgCost || Infinity) < (dataB.avgCost || Infinity) ? 'A' : 'B', winIcon: <DollarSign size={10} /> },
    { label: 'Study Time',      vA: dataA.timeMonths > 0 ? dataA.timeMonths + ' mo' : '--', vB: dataB.timeMonths > 0 ? dataB.timeMonths + ' mo' : '--', win: dataA.timeMonths < dataB.timeMonths ? 'A' : 'B', winIcon: <Zap size={10} /> },
    { label: '5-Yr Net Gain',   vA: parseFloat(roiA.fiveYearNet) > 0 ? '₹' + roiA.fiveYearNet + 'L' : '--', vB: parseFloat(roiB.fiveYearNet) > 0 ? '₹' + roiB.fiveYearNet + 'L' : '--', win: parseFloat(roiA.fiveYearNet) > parseFloat(roiB.fiveYearNet) ? 'A' : 'B', winIcon: <TrendingUp size={10} /> },
    { label: '5-Yr ROI %',      vA: roiA.roiPct > 0 ? roiA.roiPct + '%' : '--', vB: roiB.roiPct > 0 ? roiB.roiPct + '%' : '--', win: roiA.roiPct > roiB.roiPct ? 'A' : 'B', winIcon: <TrendingUp size={10} /> },
    { label: 'Break-even',      vA: roiA.breakEven > 0 ? roiA.breakEven + ' mo' : '--', vB: roiB.breakEven > 0 ? roiB.breakEven + ' mo' : '--', win: roiA.breakEven < roiB.breakEven ? 'A' : 'B', winIcon: <Zap size={10} /> },
    { label: 'Market Demand',   vA: dataA.demand || '--', vB: dataB.demand || '--', win: demandScore(dataA.demand) >= demandScore(dataB.demand) ? 'A' : 'B', winIcon: <TrendingUp size={10} /> },
    { label: 'Annual Salary +', vA: parseFloat(roiA.annualGain) > 0 ? '₹' + roiA.annualGain + 'L' : '--', vB: parseFloat(roiB.annualGain) > 0 ? '₹' + roiB.annualGain + 'L' : '--', win: parseFloat(roiA.annualGain) > parseFloat(roiB.annualGain) ? 'A' : 'B', winIcon: <DollarSign size={10} /> },
  ] : []

  if (dbLoading) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'var(--text-4)',
              animation: 'pdot 1.2s ease-in-out infinite',
              animationDelay: i * 0.18 + 's',
            }} />
          ))}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-4)', letterSpacing: '0.14em', marginTop: '12px' }}>
          LOADING CERTIFICATIONS...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontFamily: F_MONO, fontSize: '10px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '18px' }}>
        COMPARE TWO CERTIFICATIONS  SIDE BY SIDE
      </div>

      {/* Cert selectors */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <CertSelector value={certA} onChange={setCertA} label="Certification A" color={COL_A} certifications={CERTIFICATIONS} domains={CERT_DOMAINS} />
        <div style={{ display: 'flex', alignItems: 'center', fontFamily: F_MONO, fontSize: '13px', color: 'var(--text-4)', paddingTop: '22px', flexShrink: 0 }}>
          VS
        </div>
        <CertSelector value={certB} onChange={setCertB} label="Certification B" color={COL_B} certifications={CERTIFICATIONS} domains={CERT_DOMAINS} />
      </div>

      <AnimatePresence>
        {/* ── Empty state: strict guard when either cert or salary is missing ── */}
        {!bothReady && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            style={{
              width: '100%',
              minHeight: '320px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: '20px',
              padding: '40px 32px',
              textAlign: 'center',
              gap: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
            }}
          >
            {/* Icon */}
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '4px',
            }}>
              <Scale size={24} color="rgba(255,255,255,0.30)" />
            </div>
            {/* Heading */}
            <div style={{ fontFamily: F_HEAD, fontSize: '16px', fontWeight: '700', color: 'rgba(255,255,255,0.70)', letterSpacing: '-0.02em' }}>
              Multi-Axis Comparison
            </div>
            {/* Body */}
            <div style={{ fontFamily: F_BODY, fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.6', maxWidth: '32ch' }}>
              Select two certifications and enter your current salary to unlock the multi-axis comparison.
            </div>
            {/* Checklist chips */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
              {[
                { label: 'Cert A', done: !!dataA },
                { label: 'Cert B', done: !!dataB },
                { label: 'Salary', done: !!actualSalary },
              ].map(function (item) {
                return (
                  <span key={item.label} style={{
                    padding: '4px 12px', borderRadius: '100px', fontSize: '11px',
                    fontFamily: F_MONO, fontWeight: '700', letterSpacing: '0.06em',
                    background: item.done ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.06)',
                    border: '1px solid ' + (item.done ? 'rgba(96,165,250,0.35)' : 'rgba(255,255,255,0.10)'),
                    color: item.done ? '#60A5FA' : 'rgba(255,255,255,0.30)',
                  }}>
                    {item.done ? '✓ ' : ''}{item.label}
                  </span>
                )
              })}
            </div>
          </motion.div>
        )}

        {bothReady ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

            {/* Winner banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }}
              style={{
                marginBottom: '20px', padding: '14px 18px', borderRadius: '12px',
                background: winner === 'A' ? 'transparent' : 'transparent',
                border: '1px solid ' + (winner === 'A' ? 'transparent' : 'transparent'),
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Award size={16} color={winner === 'A' ? COL_A : COL_B} />
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: winner === 'A' ? COL_A : COL_B, fontFamily: F_HEAD }}>
                    {winner === 'A' ? dataA.name : dataB.name} wins on 5-year ROI
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-4)', fontFamily: F_BODY, marginLeft: '8px' }}>
                    +₹{Math.abs(parseFloat(roiA.fiveYearNet) - parseFloat(roiB.fiveYearNet)).toFixed(1)}L more over 5 years
                  </span>
                </div>
              </div>
              {/* Confidence breakdown chips */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { label: Math.abs(dataA.timeMonths - dataB.timeMonths) > 0 ? `${Math.abs(dataA.timeMonths - dataB.timeMonths)} mo faster` : 'Faster', ok: (winner === 'A' ? dataA : dataB).timeMonths < (winner === 'A' ? dataB : dataA).timeMonths },
                  { label: Math.abs(dataA.avgCost - dataB.avgCost) > 0 ? `₹${Math.abs(dataA.avgCost - dataB.avgCost).toLocaleString('en-IN')} less` : 'Cheaper', ok: (winner === 'A' ? dataA : dataB).avgCost < (winner === 'A' ? dataB : dataA).avgCost },
                  { label: Math.abs(dataA.avgHike - dataB.avgHike) > 0 ? `${Math.abs(dataA.avgHike - dataB.avgHike)}% higher hike` : 'Higher hike', ok: (winner === 'A' ? dataA : dataB).avgHike > (winner === 'A' ? dataB : dataA).avgHike },
                  { label: 'Higher demand', ok: demandScore((winner === 'A' ? dataA : dataB).demand) > demandScore((winner === 'A' ? dataB : dataA).demand) },
                ].map(function (chip, i) {
                  var col = winner === 'A' ? COL_A : COL_B
                  return chip.ok ? (
                    <span key={i} style={{ padding: '3px 9px', borderRadius: '99px', fontSize: '10px', fontFamily: F_MONO, background: col + '15', border: '1px solid ' + col + '30', color: col }}>
                      {chip.label}
                    </span>
                  ) : null
                })}
              </div>
            </motion.div>

            {/* Radar chart — Glassmorphism container */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
              style={{
                marginBottom: '24px',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.10)',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              {/* Chart header */}
              <div style={{ padding: '18px 22px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontFamily: F_MONO, fontSize: '9px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '3px' }}>
                    MULTI-AXIS COMPARISON
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: F_BODY }}>
                    5 dimensions · hover dots to inspect
                  </div>
                </div>

                {/* Legend pills — A=white, B=blue */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[{ name: dataA.name, color: COL_A }, { name: dataB.name, color: COL_B }].map(function (item, i) {
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '100px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                        <span style={{ fontFamily: F_MONO, fontSize: '10px', color: item.color, fontWeight: '700', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name.split(' ').slice(0, 3).join(' ')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* SVG chart area */}
              <div style={{ padding: '0 16px 16px' }}>
                <RadarChartSVG data={radarData} nameA={dataA.name} nameB={dataB.name} animate={true} />
              </div>
            </motion.div>

            {/* Comparison table */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: '8px', marginBottom: '8px' }}>
                <div />
                <div style={{ fontFamily: F_MONO, fontSize: '10px', color: COL_A, textAlign: 'center', padding: '6px', borderRadius: '8px', background: 'transparent', border: '1px solid transparent', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {dataA.name.split(' ').slice(0, 2).join(' ')}
                </div>
                <div style={{ fontFamily: F_MONO, fontSize: '10px', color: COL_B, textAlign: 'center', padding: '6px', borderRadius: '8px', background: 'transparent', border: '1px solid transparent', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {dataB.name.split(' ').slice(0, 2).join(' ')}
                </div>
              </div>

              {TABLE_ROWS.map(function (row, i) {
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: 0.22 + i * 0.04 }}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: '8px', marginBottom: '6px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: 'var(--text-3)', fontFamily: F_BODY }}>
                      {row.label}
                    </div>
                    <div style={{ padding: '8px', borderRadius: '8px', textAlign: 'center', background: row.win === 'A' ? 'transparent' : 'transparent', border: '1px solid ' + (row.win === 'A' ? 'transparent' : 'var(--border)'), fontFamily: F_MONO, fontSize: '12px', color: row.win === 'A' ? COL_A : 'var(--text-3)', fontWeight: row.win === 'A' ? '700' : '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      {row.vA}{row.win === 'A' ? <span style={{ color: COL_A, display: 'inline-flex' }}>{row.winIcon}</span> : null}
                    </div>
                    <div style={{ padding: '8px', borderRadius: '8px', textAlign: 'center', background: row.win === 'B' ? 'transparent' : 'transparent', border: '1px solid ' + (row.win === 'B' ? 'transparent' : 'var(--border)'), fontFamily: F_MONO, fontSize: '12px', color: row.win === 'B' ? COL_B : 'var(--text-3)', fontWeight: row.win === 'B' ? '700' : '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      {row.vB}{row.win === 'B' ? <span style={{ color: COL_B, display: 'inline-flex' }}>{row.winIcon}</span> : null}
                    </div>
                  </motion.div>
                )
              })}

              {/* FIX: DataNote added - comparison table showed calculated numbers with no source attribution.
                  Users need to know where avgHike, avgCost, and timeMonths come from to trust the comparison. */}
              <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-mid)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Info size={11} color="var(--text-4)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontFamily: F_BODY, fontSize: '11px', color: 'var(--text-4)', lineHeight: '1.55' }}>
                  Data: NASSCOM 2026  Naukri salary insights  AmbitionBox post-cert reports  cert provider pricing. All figures are India medians. Individual results vary.
                </span>
              </div>
            </motion.div>

            {/* Best for tags */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}
              style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}
            >
              {[{ cert: dataA, color: COL_A }, { cert: dataB, color: COL_B }].map(function (item, i) {
                var tags = Array.isArray(item.cert.tags) ? item.cert.tags : []
                var domain = item.cert.domain_name || item.cert.domain || item.cert.provider || null
                return (
                  <div key={i} style={{ padding: '14px', borderRadius: '10px', background: item.color + '07', border: '1px solid ' + item.color + '20' }}>
                    <div style={{ fontFamily: F_MONO, fontSize: '9px', color: item.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '7px' }}>Best for</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: F_BODY, lineHeight: '1.55', marginBottom: '9px' }}>
                      {item.cert.forWho || item.cert.description || 'Professionals seeking career growth in ' + (domain || 'tech')}
                    </div>
                    {tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {tags.map(function (tag, j) {
                          return (
                            <span key={j} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '5px', background: item.color + '12', color: item.color, fontFamily: F_MONO, border: '1px solid ' + item.color + '22' }}>
                              {tag}
                            </span>
                          )
                        })}
                      </div>
                    )}
                    {tags.length === 0 && domain && (
                      <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '5px', background: item.color + '12', color: item.color, fontFamily: F_MONO, border: '1px solid ' + item.color + '22' }}>
                        {domain}
                      </span>
                    )}
                  </div>
                )
              })}
            </motion.div>

          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Empty state - FIX:  emoji  Scale icon from lucide-react */}
      {!bothReady ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
          style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-4)', fontSize: '13px', fontFamily: F_BODY }}
        >
          <Scale size={32} color="var(--text-4)" style={{ margin: '0 auto 14px', display: 'block', opacity: 0.4 }} />
          <div style={{ fontFamily: F_HEAD, fontWeight: '700', fontSize: '15px', color: 'var(--text-3)', marginBottom: '6px' }}>
            Select a certification and enter your salary to see the comparison
          </div>
          <div>Radar chart  Break-even  5-year gain - side by side</div>
        </motion.div>
      ) : null}
    </div>
  )
}

export default CertCompare