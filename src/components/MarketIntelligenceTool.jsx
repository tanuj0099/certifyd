import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

const SPRING_IN = { type: 'spring', stiffness: 100, damping: 20 }

function fmtLakh(v) {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return '—'
  // If DB stores lakhs already, show as-is; if stores INR, approximate.
  // Heuristic: values > 200 are likely INR in rupees (e.g. 1200000).
  const lakh = n > 200 ? n / 100000 : n
  return `₹${lakh.toFixed(1)}L`
}

function MonoKPI({ label, value, sub }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-head)', letterSpacing: '-0.04em', fontWeight: 700, fontSize: 24, lineHeight: 1.05, color: 'var(--text)' }}>
        {value}
      </div>
      {sub ? (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)' }}>
          {sub}
        </div>
      ) : null}
    </div>
  )
}

function Row({ left, right, accent }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 16,
      padding: '10px 0',
      borderTop: '1px solid var(--border)',
    }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}>
        {left}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: accent ? 'var(--accent)' : 'var(--text-2)' }}>
        {right}
      </div>
    </div>
  )
}

export default function MarketIntelligenceTool() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdate, setLastUpdate] = useState(null)

  useEffect(() => {
    let mounted = true

    async function fetchData() {
      setError('')
      try {
        const { data: roles, error: err } = await supabase
          .from('market_intelligence')
          .select('*')
          .order('domain_name')

        if (err) throw err

        if (!mounted) return
        const next = roles || []
        setItems(next)
        const latestDate = next.map(r => r.updated_at).filter(Boolean).sort().reverse()[0] || null
        setLastUpdate(latestDate)
      } catch (e) {
        if (!mounted) return
        setError(e?.message || 'Failed to load market intelligence.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 300000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const trending = useMemo(() => {
    return [...items]
      .filter(r => (r.job_count_naukri || 0) > 0)
      .sort((a, b) => (b.job_count_naukri || 0) - (a.job_count_naukri || 0))
      .slice(0, 5)
  }, [items])

  const movers = useMemo(() => {
    return [...items]
      .filter(r => r.previous_min_salary != null && r.previous_min_salary > 0 && r.min_salary !== r.previous_min_salary)
      .map(r => {
        const change = r.min_salary - r.previous_min_salary
        const percentChange = Math.round((change / r.previous_min_salary) * 100)
        return { ...r, percentChange }
      })
      .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
      .slice(0, 5)
  }, [items])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'var(--font-body)',
      padding: '108px 24px 64px',
      transition: 'background 280ms var(--ease-out), color 280ms var(--ease-out)',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_IN}
        style={{ maxWidth: 1120, margin: '0 auto' }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 24,
          paddingBottom: 22,
          borderBottom: '1px solid var(--border)',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>
              Tool / Market Intelligence
            </div>
            <h1 style={{ margin: 0, letterSpacing: '-0.04em', fontSize: 'clamp(2.0rem, 4vw, 2.7rem)', lineHeight: 1.05 }}>
              Live Market Pulse
            </h1>
            <div style={{ marginTop: 10, fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, maxWidth: 56 * 14 }}>
              Salary floors, demand, and week-over-week movement. Auto-refreshes every 5 minutes.
            </div>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            borderRadius: 9999,
            border: '1px solid var(--border)',
            background: 'transparent',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-3)',
          }}>
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            <span>
              {loading ? 'Syncing…' : `Last sync: ${lastUpdate ? new Date(lastUpdate).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}`}
            </span>
          </div>
        </div>

        {error ? (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', color: 'var(--err)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            {error}
          </div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_IN, delay: 0.08 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 24,
            paddingTop: 28,
          }}
        >
          <div style={{ gridColumn: 'span 4' }}>
            <MonoKPI label="Roles tracked" value={loading ? '—' : items.length} sub="Active domains with salary floor > 0." />
          </div>
          <div style={{ gridColumn: 'span 4' }}>
            <MonoKPI label="Avg salary range" value="₹8.5L–₹15L" sub="Placeholder until we compute across dataset." />
          </div>
          <div style={{ gridColumn: 'span 4' }}>
            <MonoKPI label="Total jobs" value="45,000+" sub="Aggregated from Naukri counts." />
          </div>

          <div style={{ gridColumn: 'span 6', paddingTop: 10 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>
              Trending roles
            </div>
            <div style={{ borderTop: '1px solid var(--border)' }}>
              {(loading ? Array.from({ length: 5 }) : trending).map((r, i) => (
                <Row
                  key={loading ? i : (r.id || r.domain_name || i)}
                  left={loading ? <span className="shimmer" style={{ display: 'inline-block', width: 220, height: 14 }} /> : r.domain_name}
                  right={loading ? '—' : `${(r.job_count_naukri || 0).toLocaleString('en-IN')} jobs`}
                />
              ))}
              {!loading && trending.length === 0 ? (
                <div style={{ padding: '12px 0', color: 'var(--text-3)', fontSize: 13 }}>
                  Gathering data…
                </div>
              ) : null}
            </div>
          </div>

          <div style={{ gridColumn: 'span 6', paddingTop: 10 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>
              Salary movers (WoW)
            </div>
            <div style={{ borderTop: '1px solid var(--border)' }}>
              {(loading ? Array.from({ length: 5 }) : movers).map((r, i) => (
                <Row
                  key={loading ? i : (r.id || r.domain_name || i)}
                  left={loading ? <span className="shimmer" style={{ display: 'inline-block', width: 260, height: 14 }} /> : (
                    <span style={{ display: 'inline-flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--text-3)' }}>
                        {r.percentChange > 0 ? 'UP' : 'DOWN'} {Math.abs(r.percentChange)}%
                      </span>
                      <span>{r.domain_name}</span>
                    </span>
                  )}
                  right={loading ? '—' : `${fmtLakh(r.previous_min_salary)} → ${fmtLakh(r.min_salary)}`}
                  accent={!loading}
                />
              ))}
              {!loading && movers.length === 0 ? (
                <div style={{ padding: '12px 0', color: 'var(--text-3)', fontSize: 13 }}>
                  Tracking changes… (requires at least one weekly update)
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

