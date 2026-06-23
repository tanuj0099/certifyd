import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { GraduationCap, Award, TrendingUp, Clock, DollarSign, CheckCircle, X, Loader2 } from 'lucide-react'
import { useJourneyStore } from '../store/useJourneyStore.js'

const PICTON = 'var(--linear-blue)'
const ORANGE = 'var(--linear-blue)'
const AMBER = 'var(--cool-grey)'
const INDIGO = 'var(--linear-blue)'
const SPRING = { type: 'spring', stiffness: 400, damping: 30 }

const SliderRow = ({ label, value, min, max, step, onChange, format, color }) => {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }}>{label}</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: color, fontWeight: '700' }}>{format(value)}</span>
      </div>
      <div style={{ position: 'relative', height: '20px', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: '4px', borderRadius: '2px', background: 'var(--border)' }} />
        <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: '4px', borderRadius: '2px', background: color, pointerEvents: 'none' }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ position: 'absolute', width: '100%', height: '4px', opacity: 0, cursor: 'pointer', zIndex: 2 }} />
        <div style={{ position: 'absolute', left: `calc(${pct}% - 10px)`, width: 20, height: 20, borderRadius: '50%', background: 'var(--bg)', border: `2px solid ${color}`, boxShadow: `0 0 0 4px ${color}20`, pointerEvents: 'none', transition: 'left 0.06s' }} />
      </div>
    </div>
  )
}

const StatBox = ({ label, value, sub, color }) => (
  <div style={{ padding: '14px', borderRadius: '10px', background: `${color}08`, border: `1px solid ${color}20`, textAlign: 'center' }}>
    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.5rem', color, fontWeight: '700', letterSpacing: '-0.03em', marginBottom: '3px' }}>{value}</div>
    <div style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'var(--font-sans)', marginBottom: sub ? '2px' : '0' }}>{label}</div>
    {sub && <div style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'JetBrains Mono, monospace', opacity: 0.7 }}>{sub}</div>}
  </div>
)

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '9px', padding: '10px 14px', boxShadow: 'none' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'var(--text-4)', marginBottom: '6px' }}>YEAR {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: p.color, fontWeight: '600', marginBottom: '2px' }}>
          {p.name}: ₹{p.value.toFixed(1)}L
        </div>
      ))}
    </div>
  )
}

const CollegeVsCorporate = () => {
  const { timeCommitment, careerGoal, setTimeCommitment, setCareerGoal } = useJourneyStore()
  const [currentSalary, setCurrentSalary] = useState(8)
  const [mbaFee, setMbaFee] = useState(18)
  const [certCost, setCertCost] = useState(1.5)
  
  const [mbaSalaryJump, setMbaSalaryJump] = useState(60)
  const [certSalaryJump, setCertSalaryJump] = useState(30)
  const [showDetails, setShowDetails] = useState(false)
  const [showSimulation, setShowSimulation] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)

  // Dynamically adjust defaults based on Context Parameters
  useEffect(() => {
    setMbaSalaryJump(careerGoal === 'Pivot Domain' ? 80 : (careerGoal === 'Break into Tech' ? 70 : 60))
    setCertSalaryJump(timeCommitment.includes('Low') ? 20 : (timeCommitment.includes('High') ? 40 : 30))
  }, [careerGoal, timeCommitment])

  const calc = useMemo(() => {
    // MBA path
    const mbaYearsLost = 2
    const mbaOpportunityCost = currentSalary * mbaYearsLost
    const mbaTotalCost = mbaFee + mbaOpportunityCost
    const mbaNewSalary = currentSalary * (1 + mbaSalaryJump / 100)
    const mbaAnnualGain = mbaNewSalary - currentSalary
    const mba5yrEarnings = mbaNewSalary * 5 - mbaTotalCost
    const mbaBreakEven = mbaTotalCost / mbaAnnualGain

    // Cert path (4 certs, ~6 months total)
    const certMonthsLost = 0.5
    const certOpportunityCost = currentSalary * certMonthsLost
    const certTotalCost = certCost + certOpportunityCost
    const certNewSalary = currentSalary * (1 + certSalaryJump / 100)
    const certAnnualGain = certNewSalary - currentSalary
    const cert5yrEarnings = certNewSalary * 5 - certTotalCost
    const certBreakEven = certAnnualGain > 0 ? (certTotalCost / certAnnualGain) * 12 : 0

    // Chart data - 7 years
    const chartData = Array.from({ length: 8 }, (_, i) => {
      const year = i
      // MBA: 2 years study (negative earnings), then higher salary
      const mbaNet = year <= mbaYearsLost
        ? -(mbaFee / mbaYearsLost) * year
        : (mbaNewSalary * (year - mbaYearsLost)) - mbaTotalCost
      // Certs: faster start
      const certNet = year === 0
        ? -certTotalCost
        : certNewSalary * year - certTotalCost
      return {
        year: `Y${year}`,
        MBA: parseFloat(mbaNet.toFixed(1)),
        Certs: parseFloat(certNet.toFixed(1)),
      }
    })

    const winner = cert5yrEarnings > mba5yrEarnings ? 'certs' : 'mba'

    return {
      mba: { totalCost: mbaTotalCost, newSalary: mbaNewSalary, net5yr: mba5yrEarnings, breakEven: mbaBreakEven, opportunityCost: mbaOpportunityCost },
      cert: { totalCost: certTotalCost, newSalary: certNewSalary, net5yr: cert5yrEarnings, breakEven: certBreakEven, opportunityCost: certOpportunityCost },
      chartData,
      winner,
      delta: Math.abs(cert5yrEarnings - mba5yrEarnings).toFixed(1),
    }
  }, [currentSalary, mbaFee, certCost, mbaSalaryJump, certSalaryJump])

  const pros = {
    mba: [
      'Brand signal from top IIM/ISB - still matters for consulting & banking',
      'Network & alumni access over entire career',
      'Opens doors to leadership tracks at MNCs',
      'Strong for role shifts (engineer  management)',
    ],
    certs: [
      'Earn while you learn - zero opportunity cost',
      'Break-even in months, not years',
      'Stacked over time - 4 certs beat 1 degree in visibility',
      'Each cert targets a specific skill gap - no fluff',
    ],
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>

        {/* Inputs */}
        <div style={{ background: 'transparent', border: 'none', borderRadius: '14px', padding: '22px', boxShadow: 'none' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: PICTON, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>YOUR NUMBERS</div>
          <SliderRow label="Current Salary (₹L/yr)" value={currentSalary} min={4} max={40} step={1} onChange={setCurrentSalary} format={v => `₹${v}L`} color={PICTON} />
          <SliderRow label="MBA Total Fee (₹L)" value={mbaFee} min={5} max={40} step={1} onChange={setMbaFee} format={v => `₹${v}L`} color={INDIGO} />
          <SliderRow label="4 Certs Total Cost (₹L)" value={certCost} min={0.2} max={8} step={0.1} onChange={setCertCost} format={v => `₹${v.toFixed(1)}L`} color={PICTON} />
          <SliderRow label="MBA Expected Salary Hike %" value={mbaSalaryJump} min={20} max={150} step={5} onChange={setMbaSalaryJump} format={v => `+${v}%`} color={INDIGO} />
          <SliderRow label="Certs Expected Salary Hike %" value={certSalaryJump} min={10} max={80} step={5} onChange={setCertSalaryJump} format={v => `+${v}%`} color={ORANGE} />
          
          {/* Context Parameters UI */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Time Commitment</div>
              <select value={timeCommitment} onChange={e => setTimeCommitment(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>
                <option value="Low (1-4 hrs/wk)">Low (1-4 hrs/wk)</option>
                <option value="Medium (5-10 hrs/wk)">Medium (5-10 hrs/wk)</option>
                <option value="High (15+ hrs/wk)">High (15+ hrs/wk)</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Career Goal</div>
              <select value={careerGoal} onChange={e => setCareerGoal(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>
                <option value="Salary Bump">Salary Bump</option>
                <option value="Pivot Domain">Pivot to New Domain</option>
                <option value="Break into Tech">Break into Tech</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Button OR Results */}
        {!showSimulation ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <button
              disabled={isSimulating}
              onClick={() => {
                setIsSimulating(true)
                setTimeout(() => {
                  setIsSimulating(false)
                  setShowSimulation(true)
                }, 1200)
              }}
              style={{ padding: '16px 32px', background: 'var(--text)', color: 'var(--bg)', borderRadius: '999px', fontSize: '15px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', border: 'none', cursor: isSimulating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: isSimulating ? 0.8 : 1 }}
            >
              {isSimulating ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Loader2 size={18} />
                  </motion.div>
                  Simulating...
                </>
              ) : (
                <>
                  <TrendingUp size={18} />
                  Run Simulation
                </>
              )}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Verdict */}
          <motion.div
            key={calc.winner}
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={SPRING} /* Removed glass class */
            style={{ padding: '18px', borderRadius: '14px', background: calc.winner === 'certs' ? `${ORANGE}0c` : `${INDIGO}0c`, border: `2px solid ${calc.winner === 'certs' ? ORANGE : INDIGO}33`, textAlign: 'center' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              {calc.winner === 'certs' ? <Award size={30} color={ORANGE} /> : <GraduationCap size={30} color={INDIGO} />}
            </div>
            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fontSize: '1.1rem', color: calc.winner === 'certs' ? ORANGE : INDIGO, marginBottom: '5px' }}>
              {calc.winner === 'certs' ? 'Certs Win This Scenario' : 'MBA Wins This Scenario'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }}>
              ₹{calc.delta}L better over 5 years
            </div>
          </motion.div>

          {/* Side by side stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}> {/* Removed glass class */}
            <div style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <GraduationCap size={13} color={INDIGO} />
                <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fontSize: '13px', color: INDIGO }}>MBA Path</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {[
                  { label: 'Total Cost', value: `₹${calc.mba.totalCost.toFixed(0)}L`, color: 'var(--cool-grey)' },
                  { label: 'New Salary', value: `₹${calc.mba.newSalary.toFixed(1)}L/yr`, color: INDIGO },
                  { label: '5-yr Net', value: `₹${calc.mba.net5yr.toFixed(1)}L`, color: ORANGE },
                  { label: 'Break-even', value: `${calc.mba.breakEven.toFixed(1)} yrs`, color: AMBER },
                  { label: 'Study Time', value: '2 years', color: 'var(--text-4)' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'var(--font-sans)' }}>{s.label}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: s.color, fontWeight: '600' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Award size={13} color={PICTON} />
                <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fontSize: '13px', color: PICTON }}>4 Certs Path</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {[
                  { label: 'Total Cost', value: `₹${calc.cert.totalCost.toFixed(1)}L`, color: 'var(--cool-grey)' },
                  { label: 'New Salary', value: `₹${calc.cert.newSalary.toFixed(1)}L/yr`, color: PICTON },
                  { label: '5-yr Net', value: `₹${calc.cert.net5yr.toFixed(1)}L`, color: ORANGE },
                  { label: 'Break-even', value: `${calc.cert.breakEven.toFixed(0)} months`, color: AMBER },
                  { label: 'Study Time', value: '4-8 months', color: 'var(--text-4)' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'var(--font-sans)' }}>{s.label}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: s.color, fontWeight: '600' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>
        )}
      </div>

      {showSimulation && (
        <>
          {/* Chart */}
          <div style={{ background: 'transparent', border: 'none', borderRadius: '14px', padding: '22px', marginBottom: '16px', boxShadow: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fontSize: '13px', color: 'var(--text)', letterSpacing: '-0.01em' }}>7-YEAR NET EARNINGS</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'var(--text-4)', marginTop: '2px' }}>Cumulative after all costs (₹L)</div>
          </div>
          <div style={{ display: 'flex', gap: '14px', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: 10, height: 2, background: INDIGO }} /><span style={{ color: 'var(--text-4)' }}>MBA</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: 10, height: 2, background: PICTON }} /><span style={{ color: 'var(--text-4)' }}>4 Certs</span></div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={calc.chartData} margin={{ top: 4, right: 4, bottom: 0, left: -14 }}>
            <defs>
              <linearGradient id="mbaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={INDIGO} stopOpacity={0.15} />
                <stop offset="95%" stopColor={INDIGO} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="certGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PICTON} stopOpacity={0.15} />
                <stop offset="95%" stopColor={PICTON} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="year" tick={{ fontSize: 9, fill: 'var(--text-4)', fontFamily: 'JetBrains Mono, monospace' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9, fill: 'var(--text-4)', fontFamily: 'JetBrains Mono, monospace' }} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="MBA" name="MBA" stroke={INDIGO} strokeWidth={2} fill="url(#mbaGrad)" dot={false} />
            <Area type="monotone" dataKey="Certs" name="4 Certs" stroke={PICTON} strokeWidth={2} fill="url(#certGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Pros/Cons toggle */}
      <button
        onClick={() => setShowDetails(v => !v)}
        style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-3)', fontSize: '13px', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.18s', marginBottom: '12px' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = PICTON + '44'; e.currentTarget.style.color = PICTON }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)' }}
      >
        {showDetails ? <X size={13} /> : <CheckCircle size={13} />}
        {showDetails ? 'Hide Details' : 'Show When Each Wins'}
      </button>

      <AnimatePresence>
        {showDetails && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              {[ /* Removed glass class */
                { title: 'Choose MBA when...', items: pros.mba, color: INDIGO },
                { title: 'Choose Certs when...', items: pros.certs, color: PICTON },
              ].map((col, ci) => (
                <div key={ci} style={{ background: 'transparent', border: `1px solid ${col.color}22`, borderRadius: '12px', padding: '18px' }}>
                  <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fontSize: '13px', color: col.color, marginBottom: '12px' }}>{col.title}</div>
                  {col.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '9px', alignItems: 'flex-start' }}>
                      <CheckCircle size={12} color={col.color} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: '1.55', fontFamily: 'var(--font-sans)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ padding: '14px 18px', borderRadius: '10px', background: 'transparent', border: '1px solid transparent', marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <TrendingUp size={16} color={AMBER} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '13px', color: 'var(--text-2)', fontFamily: 'var(--font-sans)', lineHeight: '1.65' }}>
                <strong style={{ color: AMBER }}>India reality check:</strong> An IIM-A/B/C MBA still commands a network premium that certs cannot replicate. But for everyone else - Tier 2/3 colleges, private universities, or online MBAs - the cert stack almost always wins on pure ROI within 5 years.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        </>
      )}
    </div>
  )
}

export default CollegeVsCorporate
