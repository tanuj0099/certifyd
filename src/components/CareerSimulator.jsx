import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, ChevronDown, Route } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { CERTIFICATIONS, CERT_DOMAINS } from '../tokens.js'

const FH = "var(--font-head)";
const FM = "var(--font-mono)";
const FB = "var(--font-body)";
const COLORS = ['var(--linear-blue)', 'var(--linear-blue)', 'var(--cool-grey)', 'var(--cool-grey)']

function CertPicker({ value, onChange, exclude, index }) {
  const [open, setOpen] = useState(false)
  const [domain, setDomain] = useState('all')
  const selected = CERTIFICATIONS.find(function (c) { return c.name === value })
  const filtered = CERTIFICATIONS.filter(function (c) {
    return (domain === 'all' || c.domain === domain) && !exclude.includes(c.name)
  })
  const color = COLORS[index] || 'var(--linear-blue)'
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={function () { setOpen(function (v) { return !v }) }}
        style={{ width: '100%', padding: '13px 14px', background: selected ? color + '0e' : 'transparent', border: '1px solid ' + (selected ? color + '44' : 'var(--border)'), borderRadius: '10px', color: selected ? color : 'var(--text-4)', fontSize: '13px', cursor: 'pointer', fontFamily: FH, fontWeight: selected ? '700' : '500', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.18s', minHeight: '48px' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.name : 'Add cert ' + (index + 1) + '...'}
        </span>
        {selected ? <span style={{ fontFamily: FM, fontSize: '11px', color: color, flexShrink: 0 }}>+{selected.avgHike}%  {selected.timeMonths}mo</span> : null}
        <ChevronDown size={12} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 60, marginTop: '6px', borderRadius: '12px', background: 'transparent', border: '1px solid ' + color + '33', overflow: 'hidden', boxShadow: 'none' }}>
            <div style={{ display: 'flex', gap: '4px', padding: '8px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
              {CERT_DOMAINS.slice(0, 6).map(function (d) {
                return (
                  <button key={d.id} onClick={function () { setDomain(d.id) }}
                    style={{ padding: '6px 9px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', background: domain === d.id ? 'var(--indigo-dim)' : 'transparent', border: '1px solid ' + (domain === d.id ? 'var(--border-accent)' : 'var(--border)'), color: domain === d.id ? 'var(--indigo-light)' : 'var(--text-4)', fontFamily: FB, transition: 'all 0.15s', minHeight: '36px' }}>
                    {d.label}
                  </button>
                )
              })}
            </div>
            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {filtered.map(function (cert) {
                return (
                  <button key={cert.id} onClick={function () { onChange(cert.name); setOpen(false) }}
                    style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: 'var(--text-2)', fontSize: '13px', cursor: 'pointer', fontFamily: FB, textAlign: 'left', display: 'flex', justifyContent: 'space-between', transition: 'background 0.12s' }}
                    onMouseEnter={function (e) { e.currentTarget.style.background = 'transparent' }}
                    onMouseLeave={function (e) { e.currentTarget.style.background = 'transparent' }}>
                    <span>{cert.name}</span>
                    <span style={{ fontFamily: FM, fontSize: '11px', color: color, flexShrink: 0 }}>+{cert.avgHike}%</span>
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

function ChartTip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px' }}>
      <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', marginBottom: '5px' }}>{label}</div>
      {payload.map(function (p, i) {
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color }} />
            <span style={{ fontFamily: FM, fontSize: '12px', color: 'var(--text-2)' }}>Rs.{p.value}L/yr</span>
          </div>
        )
      })}
    </div>
  )
}

function CareerSimulator({ initialSalary }) {
  initialSalary = initialSalary || 8
  const [salary, setSalary] = useState(initialSalary)
  const [certs, setCerts] = useState(['', '', ''])

  const selectedCerts = certs.map(function (n) {
    return CERTIFICATIONS.find(function (c) { return c.name === n })
  }).filter(Boolean)

  const buildTrajectory = useCallback(function () {
    if (selectedCerts.length === 0) return []
    var points = []
    var currentSalary = salary
    var month = 0
    points.push({ month: 0, label: 'Now', salary: currentSalary })
    selectedCerts.forEach(function (cert, i) {
      var duration = cert.timeMonths
      var hikeAmt = currentSalary * (cert.avgHike / 100)
      month += duration
      currentSalary = currentSalary + hikeAmt
      points.push({
        month: month,
        label: 'M' + month,
        salary: parseFloat(currentSalary.toFixed(1)),
        event: cert.name.split(' ')[0] + ' +' + cert.avgHike + '%',
        color: COLORS[i],
      })
    })
    points.push({ month: month + 6, label: 'M' + (month + 6), salary: parseFloat(currentSalary.toFixed(1)) })
    return points
  }, [salary, selectedCerts])

  var trajectory = buildTrajectory()
  var finalSalary = trajectory.length > 0 ? trajectory[trajectory.length - 1].salary : salary
  var totalGain = parseFloat((finalSalary - salary).toFixed(1))
  var totalMonths = selectedCerts.reduce(function (s, c) { return s + c.timeMonths }, 0)
  var totalCost = selectedCerts.reduce(function (s, c) { return s + c.avgCost / 100000 }, 0).toFixed(1)
  var milestones = trajectory.filter(function (p) { return p.event })

  return (
    <div>
      <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '18px' }}>
        CAREER PATH SIMULATOR - MULTI-CERT TRAJECTORY
      </div>

      <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '12px', background: 'transparent', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: FM, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Starting Salary</label>
          <span style={{ fontFamily: FM, fontSize: '16px', fontWeight: '700', color: 'var(--linear-blue)' }}>Rs.{salary}L/yr</span>
        </div>
        <input type="range" min={2} max={40} step={0.5} value={salary}
          onChange={function (e) { setSalary(parseFloat(e.target.value)) }}
          className="slider" style={{ accentColor: 'var(--linear-blue)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Build Your Cert Path (up to 3)</div>
        {certs.map(function (cert, i) {
          return (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ fontFamily: FM, fontSize: '11px', color: COLORS[i], width: '20px', flexShrink: 0, textAlign: 'center', fontWeight: '700' }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <CertPicker
                  value={cert}
                  onChange={function (v) { setCerts(function (prev) { var n = prev.slice(); n[i] = v; return n }) }}
                  exclude={certs.filter(function (_, j) { return j !== i })}
                  index={i}
                />
              </div>
              {cert ? (
                <button onClick={function () { setCerts(function (prev) { var n = prev.slice(); n[i] = ''; return n }) }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
                  <X size={14} />
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      {selectedCerts.length > 0 && trajectory.length > 0 ? (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: '8px', marginBottom: '16px' }}>
              {[
                { label: 'Final Salary', value: 'Rs.' + finalSalary + 'L/yr', color: 'var(--linear-blue)' },
                { label: 'Total Gain', value: '+Rs.' + totalGain + 'L/yr', color: 'var(--linear-blue)' },
                { label: 'Total Time', value: totalMonths + ' months', color: 'var(--cool-grey)' },
                { label: 'Total Cost', value: 'Rs.' + totalCost + 'L', color: 'var(--cool-grey)' },
              ].map(function (s, i) {
                return (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                    style={{ padding: '12px', borderRadius: '10px', background: s.color + '08', border: '1px solid ' + s.color + '22', textAlign: 'center' }}>
                    <div style={{ fontFamily: FM, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>{s.label}</div>
                    <div style={{ fontFamily: FM, fontSize: 'clamp(0.85rem,2vw,1.1rem)', fontWeight: '700', color: s.color }}>{s.value}</div>
                  </motion.div>
                )
              })}
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', background: 'transparent', border: 'none', marginBottom: '14px' }}>
              <div style={{ fontFamily: FM, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                SALARY TRAJECTORY - {totalMonths} MONTHS
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trajectory} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                  <defs>
                    <linearGradient id="salGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--linear-blue)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--linear-blue)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="transparent" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-4)', fontFamily: FM }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-4)', fontFamily: FM }} axisLine={false} tickLine={false} tickFormatter={function (v) { return 'Rs.' + v + 'L' }} domain={['dataMin - 1', 'dataMax + 2']} />
                  <Tooltip content={ChartTip} />
                  <Area type="monotone" dataKey="salary" stroke="var(--linear-blue)" strokeWidth={2.5} fill="url(#salGrad)" dot={false} activeDot={{ r: 5, fill: 'var(--linear-blue)' }} />
                  {milestones.map(function (m, i) {
                    return <ReferenceLine key={i} x={m.label} stroke={m.color || COLORS[i]} strokeDasharray="4 3" strokeWidth={1.5} />
                  })}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {milestones.map(function (m, i) {
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '9px', background: COLORS[i] + '08', border: '1px solid ' + COLORS[i] + '22' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i], flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-2)', fontFamily: FB, flex: 1 }}>{m.event}</span>
                    <span style={{ fontFamily: FM, fontSize: '13px', color: COLORS[i], fontWeight: '700' }}>Rs.{m.salary}L</span>
                  </div>
                )
              })}
              <div style={{ padding: '12px 14px', borderRadius: '9px', background: 'transparent', border: '1px solid transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-2)', fontFamily: FB, fontWeight: '600' }}>Net gain over 5 years (after cert costs)</span>
                <span style={{ fontFamily: FM, fontSize: '15px', color: 'var(--linear-blue)', fontWeight: '700' }}>
                  +Rs.{(totalGain * 5 - parseFloat(totalCost)).toFixed(1)}L
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-4)', fontFamily: FB }}>
          <Route size={32} color="var(--text-4)" style={{ margin: '0 auto 14px', display: 'block', opacity: 0.4 }} />
          <div style={{ fontFamily: FH, fontWeight: '700', fontSize: '15px', color: 'var(--text-3)', marginBottom: '6px' }}>Build your career path</div>
          <div style={{ fontSize: '13px' }}>Pick up to 3 certs to see your salary trajectory over time</div>
        </div>
      )}
    </div>
  )
}

export default CareerSimulator