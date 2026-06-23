import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, CheckCircle, Clock, Target, RotateCcw } from 'lucide-react'

const PICTON  = 'var(--linear-blue)'
const ORANGE = 'var(--linear-blue)'
const AMBER   = 'var(--cool-grey)'
const SPRING  = { type: 'spring', stiffness: 400, damping: 30 }

const CERT_MODULES = {
  'AWS Solutions Architect': ['Cloud Foundations', 'IAM & Security', 'Compute (EC2)', 'Storage (S3)', 'Networking (VPC)', 'Databases (RDS)', 'High Availability', 'Monitoring', 'Cost Optimisation', 'Practice Exam x2'],
  'Google Data Analytics':   ['Foundations of Data', 'Ask Questions', 'Prepare Data', 'Process Data', 'Analyse Data', 'Visualise Data', 'Data Analysis R', 'Capstone Project'],
  'PMP Certification':       ['Project Initiation', 'Planning Processes', 'Scope Management', 'Schedule Management', 'Cost Management', 'Quality Management', 'Risk Management', 'Stakeholder Management', 'Agile Approaches', 'Practice Exam x3'],
  'Scrum Master':            ['Scrum Theory', 'Scrum Values', 'Scrum Team', 'Sprint Planning', 'Daily Scrum', 'Sprint Review', 'Retrospectives', 'Practice Assessment x2'],
  default: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5', 'Module 6', 'Module 7', 'Module 8'],
}

const getDayKey = (date = new Date()) => date.toISOString().split('T')[0]

const BurnRate = ({ certName = 'Your Certification', breakEvenMonths = 6, activeCert }) => {
  const displayCertName = activeCert?.name || certName
  const storageKey = `croi_burnrate_${displayCertName.replace(/\s/g, '_').toLowerCase()}`

  const [data, setData] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null')
      if (saved) return saved
    } catch {}
    return { completed: [], startDate: getDayKey(), lastStudyDate: null, streak: 0, totalSessions: 0 }
  })

  const [justChecked, setJustChecked] = useState(false)
  const [showReset,   setShowReset]   = useState(false)

  const modules = CERT_MODULES[displayCertName] || CERT_MODULES.default
  const totalModules = modules.length

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(data))
  }, [data, storageKey])

  const stats = useMemo(() => {
    const today         = getDayKey()
    const completedCount = data.completed.length
    const pct           = Math.round((completedCount / totalModules) * 100)
    const remainingCount = totalModules - completedCount

    const startDate     = new Date(data.startDate)
    const daysPassed    = Math.max(1, Math.floor((Date.now() - startDate) / 86400000))
    const avgPerDay     = completedCount / daysPassed
    const daysToFinish  = avgPerDay > 0 ? Math.ceil(remainingCount / avgPerDay) : remainingCount * 7
    const estFinishDate = new Date(Date.now() + daysToFinish * 86400000)

    const isStudiedToday = data.lastStudyDate === today

    // Streak calculation
    const yesterday = getDayKey(new Date(Date.now() - 86400000))
    const streakAlive = data.lastStudyDate === today || data.lastStudyDate === yesterday

    return { completedCount, pct, remainingCount, daysToFinish, estFinishDate, isStudiedToday, streakAlive, avgPerDay: avgPerDay.toFixed(2) }
  }, [data, totalModules])

  const toggleModule = (mod) => {
    setData(prev => {
      const today     = getDayKey()
      const wasIn     = prev.completed.includes(mod)
      const completed = wasIn ? prev.completed.filter(m => m !== mod) : [...prev.completed, mod]

      let newStreak = prev.streak
      if (!wasIn) {
        const yesterday = getDayKey(new Date(Date.now() - 86400000))
        if (prev.lastStudyDate === yesterday) newStreak = prev.streak + 1
        else if (prev.lastStudyDate !== today) newStreak = 1
      }

      return { ...prev, completed, lastStudyDate: wasIn ? prev.lastStudyDate : today, streak: newStreak, totalSessions: wasIn ? prev.totalSessions : prev.totalSessions + 1 }
    })
    if (!data.completed.includes(mod)) {
      setJustChecked(true)
      setTimeout(() => setJustChecked(false), 1200)
    }
  }

  const reset = () => {
    const fresh = { completed: [], startDate: getDayKey(), lastStudyDate: null, streak: 0, totalSessions: 0 }
    setData(fresh)
    setShowReset(false)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '9px', background: AMBER + '14', border: '1px solid ' + AMBER + '28', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={15} color={AMBER} />
          </div>
          <div>
            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fontSize: '14px', color: 'var(--text)' }}>STUDY TRACKER</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'var(--text-4)' }}>{displayCertName}</div>
          </div>
        </div>
        <button onClick={() => setShowReset(v => !v)} style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: '4px', transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--cool-grey)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}>
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <AnimatePresence>
        {showReset && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={SPRING}
            style={{ padding: '12px 16px', borderRadius: '10px', background: 'transparent', border: '1px solid transparent', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', fontFamily: 'var(--font-sans)' }}>Reset all progress?</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={reset} style={{ padding: '5px 12px', borderRadius: '7px', background: 'transparent', border: '1px solid transparent', color: 'var(--cool-grey)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: '600' }}>Reset</button>
              <button onClick={() => setShowReset(false)} style={{ padding: '5px 12px', borderRadius: '7px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-3)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {[
          { icon: Flame,       color: AMBER,   label: 'Streak',    value: data.streak + (stats.streakAlive ? '' : ' (paused)'), sub: 'days' },
          { icon: CheckCircle, color: ORANGE, label: 'Done',      value: stats.completedCount + '/' + totalModules, sub: 'modules' },
          { icon: Target,      color: PICTON,  label: 'Progress',  value: stats.pct + '%', sub: 'complete' },
          { icon: Clock,       color: 'var(--accent)', label: 'ETA',     value: stats.completedCount === 0 ? '--' : stats.daysToFinish > 365 ? '1yr+' : stats.daysToFinish + 'd', sub: 'remaining' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '11px 10px', borderRadius: '10px', background: `${s.color}08`, border: `1px solid ${s.color}20`, textAlign: 'center' }}>
            <s.icon size={13} color={s.color} style={{ display: 'block', margin: '0 auto 5px' }} />
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', color: s.color, fontWeight: '700', letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'var(--font-sans)', marginTop: '1px' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border)', overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: stats.pct + '%' }} transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            style={{ height: '100%', borderRadius: '3px', background: `transparent` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'var(--text-4)' }}>Started {data.startDate}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: stats.pct === 100 ? ORANGE : 'var(--text-4)' }}>
            {stats.pct === 100 ? 'Complete' : stats.pct === 0 ? 'Not started' : 'Est. ' + stats.estFinishDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      {/* Modules checklist */}
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
        MODULES - CLICK TO MARK DONE
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {modules.map((mod, i) => {
          const done = data.completed.includes(mod)
          return (
            <motion.button
              key={mod}
              onClick={() => toggleModule(mod)}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: done ? `${ORANGE}08` : 'transparent', border: `1px solid ${done ? ORANGE + '28' : 'var(--border)'}`, transition: 'all 0.18s', textAlign: 'left' }}
            >
              <div style={{ width: 20, height: 20, borderRadius: '6px', flexShrink: 0, border: `2px solid ${done ? ORANGE : 'var(--border)'}`, background: done ? `${ORANGE}14` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s' }}>
                {done && <CheckCircle size={11} color={ORANGE} />}
              </div>
              <span style={{ fontSize: '13px', color: done ? 'var(--text-3)' : 'var(--text)', fontFamily: 'var(--font-sans)', textDecoration: done ? 'line-through' : 'none', flex: 1, transition: 'all 0.18s' }}>{mod}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'var(--text-4)' }}>M{i + 1}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Break-even reminder */}
      <div style={{ marginTop: '16px', padding: '12px 14px', borderRadius: '10px', background: 'var(--indigo-dim)', border: '1px solid var(--border-accent)', display: 'flex', gap: '9px', alignItems: 'flex-start' }}>
        <Target size={14} color="var(--indigo-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '13px', color: 'var(--text-2)', fontFamily: 'var(--font-sans)', lineHeight: '1.6' }}>
          Complete this cert and break even in <strong style={{ color: 'var(--indigo-light)', fontFamily: 'JetBrains Mono, monospace' }}>{breakEvenMonths} months</strong> - that's the average rent for a 1BHK in Bangalore recovered.
        </div>
      </div>

      <AnimatePresence>
        {justChecked && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={SPRING}
            style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 200, padding: '12px 18px', borderRadius: '12px', background: ORANGE, color: 'white', fontSize: '13px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: `0 4px 20px ${ORANGE}44` }}>
            <CheckCircle size={15} /> Module done. Keep going.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BurnRate
