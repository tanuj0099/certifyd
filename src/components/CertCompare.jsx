import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, ChevronDown, Info, PlusCircle, Scale, TrendingUp, X } from 'lucide-react'
import { CERTIFICATIONS, CERT_DOMAINS } from '../tokens.js'
import { calculateAdvancedROI, ROI_DEFAULTS } from '../utils/roiMath.js'

const F_HEAD = 'var(--font-head)'
const F_MONO = 'var(--font-mono)'
const F_BODY = 'var(--font-body)'

const COLORS = ['var(--accent-primary)', 'var(--semantic-success)', 'var(--semantic-warning)', 'var(--semantic-danger)']

function demandColor(demand) {
  return demand === 'Very High' ? 'var(--semantic-success)'
       : demand === 'High'      ? 'var(--accent-secondary)'
       : demand === 'Medium'    ? 'var(--semantic-warning)'
       : 'var(--text-muted)'
}

function demandScore(demand) {
  return demand === 'Very High' ? 4 : demand === 'High' ? 3 : demand === 'Medium' ? 2 : 1
}

function CertSelector({ value, onChange, label, color, disabled }) {
  const [open, setOpen] = useState(false)
  const [domain, setDomain] = useState('all')
  const wrapRef = useRef(null)

  const selected = CERTIFICATIONS.find(cert => cert.name === value)
  const filtered = CERTIFICATIONS.filter(cert => domain === 'all' || cert.domain === domain)

  useEffect(() => {
    if (!open) return undefined
    function handleOutside(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  return (
    <div ref={wrapRef} style={{ position: 'relative', minWidth: 0 }}>
      <div style={{ fontFamily: F_MONO, fontSize: '9px', color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
        {label}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          padding: '12px 14px',
          background: selected ? color + '12' : 'var(--bg-surface)',
          border: '1px solid ' + (selected ? color + '22' : 'var(--border-subtle)'),
          borderRadius: '12px',
          color: selected ? color : 'var(--text-primary)',
          fontSize: '13px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: F_HEAD,
          fontWeight: selected ? '700' : '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          opacity: disabled ? 0.5 : 1,
          textAlign: 'left',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.name : 'Pick a certification'}
        </span>
        <ChevronDown size={14} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      <AnimatePresence>
        {open && !disabled ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 60,
              marginTop: '6px',
              borderRadius: '8px',
              background: 'var(--surface)',
              border: '1px solid ' + color + '33',
              overflow: 'hidden',
              boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', gap: '4px', padding: '8px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
              {[{ id: 'all', label: 'All' }, ...CERT_DOMAINS.slice(0, 6)].map(item => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setDomain(item.id)}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontFamily: F_BODY,
                    fontWeight: '600',
                    background: domain === item.id ? color + '14' : 'transparent',
                    border: '1px solid ' + (domain === item.id ? color + '35' : 'var(--border)'),
                    color: domain === item.id ? color : 'var(--text-4)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
              {filtered.map(cert => (
                <button
                  type="button"
                  key={cert.id}
                  onClick={() => {
                    onChange(cert.name)
                    setOpen(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: value === cert.name ? color + '12' : 'transparent',
                    border: 'none',
                    color: value === cert.name ? color : 'var(--text-2)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: F_BODY,
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cert.name}</span>
                  <span style={{ fontSize: '10px', color: demandColor(cert.demand), fontFamily: F_MONO, flexShrink: 0 }}>+{cert.avgHike}%</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function buildRadarRows(items) {
  const maxSpeed = 24
  const norm = (value, min, max) => Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))

  return [
    {
      axis: 'Hike',
      desc: 'Salary lift',
      scores: items.map(item => norm(item.cert.avgHike, 0, 80)),
      raw: items.map(item => '+' + item.cert.avgHike + '%'),
    },
    {
      axis: 'Demand',
      desc: 'Market pull',
      scores: items.map(item => norm(demandScore(item.cert.demand), 1, 4)),
      raw: items.map(item => item.cert.demand),
    },
    {
      axis: 'Speed',
      desc: 'Completion time',
      scores: items.map(item => norm(maxSpeed - item.cert.timeMonths, 0, maxSpeed)),
      raw: items.map(item => item.cert.timeMonths + ' mo'),
    },
    {
      axis: 'NPV ROI',
      desc: 'Inflation adjusted',
      scores: items.map(item => norm(item.roi.roiPct, -100, 500)),
      raw: items.map(item => item.roi.roiPct + '%'),
    },
    {
      axis: 'Net Gain',
      desc: '5-year value',
      scores: items.map(item => norm(parseFloat(item.roi.fiveYearNet), -2, 80)),
      raw: items.map(item => 'Rs.' + item.roi.fiveYearNet + 'L'),
    },
  ]
}

function RadarChartSVG({ rows, items }) {
  const [hovered, setHovered] = useState(null)
  const width = 520
  const height = 390
  const cx = width / 2
  const cy = height / 2 + 14
  const radius = 126
  const rings = [0.2, 0.4, 0.6, 0.8, 1]

  const polar = (index, r) => {
    const angle = (2 * Math.PI * index / rows.length) - Math.PI / 2
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }
  const pointsFor = scores => scores.map((score, index) => {
    const point = polar(index, radius * score / 100)
    return point.x + ',' + point.y
  }).join(' ')

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={'0 0 ' + width + ' ' + height} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <filter id="radarGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {rings.map(ring => (
          <polygon
            key={ring}
            points={rows.map((_, index) => {
              const point = polar(index, radius * ring)
              return point.x + ',' + point.y
            }).join(' ')}
            fill={ring === 1 ? 'rgba(99,102,241,0.025)' : 'none'}
            stroke={ring === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}
            strokeWidth={ring === 1 ? 1.2 : 0.8}
            strokeDasharray={ring === 1 ? 'none' : '3 5'}
          />
        ))}

        {rows.map((row, index) => {
          const point = polar(index, radius)
          const labelPoint = polar(index, radius + 34)
          const anchor = Math.abs(labelPoint.x - cx) < 12 ? 'middle' : labelPoint.x > cx ? 'start' : 'end'
          return (
            <g key={row.axis}>
              <line x1={cx} y1={cy} x2={point.x} y2={point.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <text x={labelPoint.x} y={labelPoint.y - 4} textAnchor={anchor} fontSize="10" fill="rgba(255,255,255,0.72)" style={{ fontFamily: 'var(--font-mono)' }} fontWeight="700">
                {row.axis}
              </text>
              <text x={labelPoint.x} y={labelPoint.y + 10} textAnchor={anchor} fontSize="9" fill="rgba(255,255,255,0.42)" style={{ fontFamily: 'var(--font-body)' }}>
                {row.desc}
              </text>
            </g>
          )
        })}

        {items.map((item, itemIndex) => {
          const scores = rows.map(row => row.scores[itemIndex])
          return (
            <g key={item.key}>
              <motion.polygon
                points={pointsFor(scores)}
                fill={item.color + '1f'}
                stroke={item.color}
                strokeWidth="2.2"
                strokeLinejoin="round"
                filter="url(#radarGlow)"
                initial={{ opacity: 0, scale: 0.96, originX: '50%', originY: '50%' }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: itemIndex * 0.08 }}
              />
              {scores.map((score, rowIndex) => {
                const point = polar(rowIndex, radius * score / 100)
                const active = hovered?.itemIndex === itemIndex && hovered?.rowIndex === rowIndex
                return (
                  <motion.circle
                    key={rowIndex}
                    cx={point.x}
                    cy={point.y}
                    r={active ? 6 : 4.5}
                    fill={item.color}
                    stroke="var(--bg)"
                    strokeWidth="2"
                    style={{ cursor: 'pointer' }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25, delay: 0.25 + itemIndex * 0.06 + rowIndex * 0.025 }}
                    onMouseEnter={() => setHovered({ itemIndex, rowIndex, x: point.x, y: point.y })}
                    onMouseLeave={() => setHovered(null)}
                  />
                )
              })}
            </g>
          )
        })}

        {hovered ? (() => {
          const item = items[hovered.itemIndex]
          const row = rows[hovered.rowIndex]
          const boxWidth = 138
          const x = hovered.x + boxWidth + 18 > width ? hovered.x - boxWidth - 14 : hovered.x + 14
          const y = hovered.y < 48 ? hovered.y + 14 : hovered.y - 42
          return (
            <g>
              <rect x={x} y={y} width={boxWidth} height="46" rx="7" fill="var(--surface)" stroke={item.color} strokeOpacity="0.55" />
              <text x={x + 9} y={y + 16} fontSize="9" fill={item.color} style={{ fontFamily: 'var(--font-mono)' }} fontWeight="700">
                {item.cert.name.split(' ').slice(0, 3).join(' ')}
              </text>
              <text x={x + 9} y={y + 32} fontSize="11" fill="white" style={{ fontFamily: 'var(--font-mono)' }} fontWeight="700">
                {row.axis}: {row.raw[hovered.itemIndex]}
              </text>
            </g>
          )
        })() : null}
      </svg>
    </div>
  )
}

export default function CertCompare({ salary = 8, prefilledCert = '' }) {
  const [numCerts, setNumCerts] = useState(prefilledCert ? 2 : 1)
  const [certNames, setCertNames] = useState(() => {
    const initial = [prefilledCert || 'AWS Solutions Architect Associate', '', '', '']
    return initial
  })

  const roiCalc = useCallback((cert, sal) => {
    if (!cert || !sal) return null
    return calculateAdvancedROI({
      salaryLPA: sal,
      certCostINR: cert.avgCost,
      hikePercent: cert.avgHike,
    })
  }, [])

  const selectedCerts = useMemo(() => {
    return certNames.slice(0, numCerts).map((name, index) => {
      const cert = CERTIFICATIONS.find(item => item.name === name)
      const roi = roiCalc(cert, salary)
      if (!cert || !roi) return null
      return { cert, roi, key: String.fromCharCode(65 + index), color: COLORS[index] }
    }).filter(Boolean)
  }, [certNames, numCerts, roiCalc, salary])

  const rows = selectedCerts.length > 0 ? buildRadarRows(selectedCerts) : []
  const winner = selectedCerts.length > 1
    ? selectedCerts.reduce((best, item) => parseFloat(item.roi.fiveYearNet) > parseFloat(best.roi.fiveYearNet) ? item : best, selectedCerts[0])
    : null

  const tableRows = selectedCerts.length > 0 ? [
    { label: 'Expected Hike', get: item => '+' + item.cert.avgHike + '%', score: item => item.cert.avgHike, highWins: true },
    { label: 'Cert Cost', get: item => 'Rs.' + (item.cert.avgCost / 100000).toFixed(1) + 'L', score: item => item.cert.avgCost, highWins: false },
    { label: 'Break-even', get: item => item.roi.breakEven + ' mo', score: item => item.roi.breakEven, highWins: false },
    { label: '5-Yr NPV', get: item => 'Rs.' + item.roi.fiveYearNet + 'L', score: item => parseFloat(item.roi.fiveYearNet), highWins: true },
    { label: 'NPV ROI %', get: item => item.roi.roiPct + '%', score: item => item.roi.roiPct, highWins: true },
    { label: 'Study Time', get: item => item.cert.timeMonths + ' mo', score: item => item.cert.timeMonths, highWins: false },
    { label: 'Market Demand', get: item => item.cert.demand, score: item => demandScore(item.cert.demand), highWins: true },
    { label: 'Annual Salary +', get: item => 'Rs.' + item.roi.annualGain + 'L', score: item => parseFloat(item.roi.annualGain), highWins: true },
  ] : []

  const updateCert = (index, name) => {
    setCertNames(previous => previous.map((cert, i) => i === index ? name : cert))
  }

  const clearCert = index => {
    setCertNames(previous => previous.map((cert, i) => i === index ? '' : cert))
  }

  return (
    <div>
      <div style={{ fontFamily: F_MONO, fontSize: '10px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '18px' }}>
        Compare up to 4 certifications
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
        {[0, 1, 2, 3].map(index => (
          <div key={index} style={{ position: 'relative' }}>
            <CertSelector
              value={certNames[index]}
              onChange={name => updateCert(index, name)}
              label={'Certification ' + String.fromCharCode(65 + index)}
              color={COLORS[index]}
              disabled={index >= numCerts}
            />
            {index < numCerts && certNames[index] ? (
              <button
                type="button"
                onClick={() => clearCert(index)}
                title="Clear certification"
                style={{ position: 'absolute', top: 0, right: 0, width: '22px', height: '22px', borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-4)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
              >
                <X size={12} />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: F_BODY }}>
          NPV uses {ROI_DEFAULTS.annualIncrementRate * 100}% annual raise and {ROI_DEFAULTS.discountRate * 100}% inflation discount over 5 years.
        </div>
        {numCerts < 4 ? (
          <button type="button" onClick={() => setNumCerts(count => count + 1)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontFamily: F_BODY, fontSize: '12px' }}>
            <PlusCircle size={14} /> Add certification
          </button>
        ) : null}
      </div>

      <AnimatePresence>
        {selectedCerts.length > 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            {winner ? (
              <div style={{ marginBottom: '20px', padding: '14px 18px', borderRadius: '8px', background: winner.color + '08', border: '1px solid ' + winner.color + '25', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <Award size={16} color={winner.color} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: winner.color, fontFamily: F_HEAD }}>
                  {winner.cert.name} wins on inflation-adjusted 5-year NPV
                </span>
              </div>
            ) : null}

            {selectedCerts.length >= 2 ? (
              <div style={{ marginBottom: '24px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--glass-border)', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, ' + selectedCerts.map(item => item.color).join(', ') + ')' }} />
                <div style={{ padding: '18px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontFamily: F_MONO, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>
                      Multi-axis comparison
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: F_BODY }}>
                      Pentagon view supports 2 to 4 selected certifications.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedCerts.map(item => (
                      <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 9px', borderRadius: '99px', background: item.color + '12', border: '1px solid ' + item.color + '30' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                        <span style={{ fontFamily: F_MONO, fontSize: '10px', color: item.color, fontWeight: '700', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.cert.name.split(' ').slice(0, 3).join(' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: '0 12px 8px' }}>
                  <RadarChartSVG rows={rows} items={selectedCerts} />
                </div>
              </div>
            ) : null}

            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: Math.max(520, 180 + selectedCerts.length * 132), display: 'grid', gridTemplateColumns: `1.35fr repeat(${selectedCerts.length}, 1fr)`, gap: '8px', marginBottom: '8px' }}>
                <div />
                {selectedCerts.map(item => (
                  <div key={item.key} style={{ fontFamily: F_MONO, fontSize: '10px', color: item.color, textAlign: 'center', padding: '6px', borderRadius: '8px', background: item.color + '07', border: '1px solid ' + item.color + '15', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.cert.name.split(' ').slice(0, 3).join(' ')}
                  </div>
                ))}
              </div>

              {tableRows.map(row => {
                const scores = selectedCerts.map(row.score)
                const winningValue = row.highWins ? Math.max(...scores) : Math.min(...scores)
                return (
                  <div key={row.label} style={{ minWidth: Math.max(520, 180 + selectedCerts.length * 132), display: 'grid', gridTemplateColumns: `1.35fr repeat(${selectedCerts.length}, 1fr)`, gap: '8px', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: 'var(--text-3)', fontFamily: F_BODY }}>
                      {row.label}
                    </div>
                    {selectedCerts.map(item => {
                      const score = row.score(item)
                      const isWinner = score === winningValue
                      return (
                        <div key={item.key} style={{ padding: '8px', borderRadius: '8px', textAlign: 'center', background: isWinner ? item.color + '10' : 'var(--surface)', border: '1px solid ' + (isWinner ? item.color + '22' : 'var(--border)'), fontFamily: F_MONO, fontSize: '12px', color: isWinner ? item.color : 'var(--text-2)', fontWeight: isWinner ? '700' : '500' }}>
                          {row.get(item)}{isWinner ? <TrendingUp size={10} style={{ marginLeft: '4px', verticalAlign: '-1px' }} /> : null}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Info size={12} color="var(--text-4)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontFamily: F_BODY, fontSize: '11px', color: 'var(--text-4)', lineHeight: '1.55' }}>
                Advanced ROI uses net present value: yearly certification salary delta is discounted by inflation, then certification cost is subtracted.
              </span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {selectedCerts.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-4)', fontSize: '13px', fontFamily: F_BODY }}>
          <Scale size={32} color="var(--text-4)" style={{ margin: '0 auto 14px', display: 'block', opacity: 0.4 }} />
          <div style={{ fontFamily: F_HEAD, fontWeight: '700', fontSize: '15px', color: 'var(--text-3)', marginBottom: '6px' }}>
            Pick certifications to compare
          </div>
          <div>Up to 4 certifications, NPV ROI, break-even, and pentagon comparison.</div>
        </motion.div>
      ) : null}
    </div>
  )
}
