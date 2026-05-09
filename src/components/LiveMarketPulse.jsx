import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const FM = "'JetBrains Mono','IBM Plex Mono',monospace"
const FS = "'Inter','DM Sans',sans-serif"
const DEFAULT_CERT_COST = 25_000
const BASE_COLUMNS = 'domain_name, min_salary, max_salary, job_count_naukri, updated_at'
const COST_COLUMNS = `${BASE_COLUMNS}, certification_cost`

const CAPSULES = [
  { id: 'all', label: 'All Roles', match: null },
  { id: 'cloud', label: 'Cloud & DevOps', match: ['Cloud', 'DevOps', 'SRE', 'GCP', 'Azure', 'AWS', 'Kubernetes'] },
  {
    id: 'data',
    label: 'Data & AI',
    match: ['Data', 'Machine Learning', 'AI', 'NLP', 'Computer Vision', 'Big Data', 'Business Intelligence'],
  },
  { id: 'security', label: 'Security', match: ['Cybersecurity', 'Security', 'Hacker', 'Penetration', 'SOC'] },
  {
    id: 'software',
    label: 'Engineering',
    match: ['Full Stack', 'Backend', 'Frontend', 'Mobile', 'iOS', 'Android', 'Blockchain', 'QA', 'Software'],
  },
  {
    id: 'product',
    label: 'Product & PM',
    match: ['Product Manager', 'Project Manager', 'Scrum', 'Agile', 'Business Analyst', 'Program Manager'],
  },
  { id: 'finance', label: 'Finance', match: ['Financial', 'Investment', 'Risk', 'Actuarial', 'Equity', 'Tax', 'Audit'] },
  { id: 'marketing', label: 'Marketing & Sales', match: ['Marketing', 'SEO', 'Growth', 'Content', 'Sales'] },
]

function useViewportBand() {
  const [width, setWidth] = useState(() => (typeof window === 'undefined' ? 1200 : window.innerWidth))

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return {
    isPhone: width <= 640,
    isTablet: width > 640 && width <= 1024,
  }
}

function normalizeText(value, fallback = 'Unmapped role') {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || fallback
}

function normalizeAnnualSalary(value) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return 0
  return number < 1000 ? number * 100_000 : number
}

function normalizeMarketRow(row) {
  return {
    domain_name: normalizeText(row.domain_name),
    min_salary: normalizeAnnualSalary(row.min_salary),
    max_salary: normalizeAnnualSalary(row.max_salary),
    job_count_naukri: Math.max(0, Math.round(Number(row.job_count_naukri) || 0)),
    updated_at: row.updated_at || null,
    certification_cost: Math.max(0, Number(row.certification_cost) || DEFAULT_CERT_COST),
  }
}

function calcPaybackMonths(row) {
  const annualGain = row.max_salary - row.min_salary
  if (annualGain <= 0) return null
  return Math.ceil(row.certification_cost / (annualGain / 12))
}

function fmtLpa(rupees) {
  if (!rupees || rupees <= 0) return '-'
  return `INR ${(rupees / 100_000).toFixed(1)}L`
}

function fmtJobs(value) {
  return value > 0 ? value.toLocaleString('en-IN') : '-'
}

function Capsule({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '34px',
        padding: '0 14px',
        borderRadius: '999px',
        border: active ? '1px solid var(--text)' : '1px solid var(--border)',
        background: active ? 'var(--text)' : 'transparent',
        color: active ? 'var(--bg)' : 'var(--text-muted)',
        fontFamily: FM,
        fontSize: '11px',
        letterSpacing: '0.08em',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        transition: 'background 0.18s ease, color 0.18s ease, border-color 0.18s ease',
      }}
    >
      {label}
    </button>
  )
}

function RoleRow({ row, index, total, isPhone }) {
  const payback = calcPaybackMonths(row)
  const isLast = index === total - 1
  const metricStyle = {
    minWidth: 0,
  }
  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    color: 'var(--text-soft)',
    fontFamily: FM,
    fontSize: '9px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  }
  const valueStyle = {
    display: 'block',
    color: 'var(--text)',
    fontFamily: FM,
    fontSize: '12px',
    fontVariantNumeric: 'tabular-nums',
  }

  if (isPhone) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: Math.min(index * 0.025, 0.2) }}
        style={{
          padding: '18px 0',
          borderBottom: isLast ? 'none' : '1px solid var(--border)',
          background: 'transparent',
        }}
      >
        <h3
          style={{
            margin: '0 0 16px',
            color: 'var(--text)',
            fontFamily: FS,
            fontSize: '16px',
            lineHeight: 1.3,
            fontWeight: 750,
          }}
        >
          {row.domain_name}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
          <div style={metricStyle}>
            <span style={labelStyle}>Entry</span>
            <span style={valueStyle}>{fmtLpa(row.min_salary)}</span>
          </div>
          <div style={metricStyle}>
            <span style={labelStyle}>Ceiling</span>
            <span style={valueStyle}>{fmtLpa(row.max_salary)}</span>
          </div>
          <div style={metricStyle}>
            <span style={labelStyle}>Jobs</span>
            <span style={valueStyle}>{fmtJobs(row.job_count_naukri)}</span>
          </div>
          <div style={metricStyle}>
            <span style={labelStyle}>ROI Months</span>
            <span style={valueStyle}>{payback ? `${payback} mo` : '-'}</span>
          </div>
        </div>
      </motion.article>
    )
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.025, 0.2) }}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.35fr) 104px 104px 92px 96px',
        alignItems: 'center',
        gap: '10px',
        padding: '15px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        background: 'transparent',
      }}
    >
      <span
        style={{
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: 'var(--text)',
          fontFamily: FS,
          fontSize: '14px',
          fontWeight: 650,
        }}
      >
        {row.domain_name}
      </span>
      {[fmtLpa(row.min_salary), fmtLpa(row.max_salary), fmtJobs(row.job_count_naukri), payback ? `${payback} mo` : '-'].map(
        (value) => (
          <span
            key={value}
            style={{
              color: 'var(--text-muted)',
              fontFamily: FM,
              fontSize: '12px',
              fontVariantNumeric: 'tabular-nums',
              textAlign: 'right',
            }}
          >
            {value}
          </span>
        )
      )}
    </motion.article>
  )
}

export default function LiveMarketPulse() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeId, setActiveId] = useState('all')
  const [lastSync, setLastSync] = useState(null)
  const { isPhone, isTablet } = useViewportBand()

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      if (!supabase) {
        setRows([])
        setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
        setLoading(false)
        return
      }

      try {
        let response = await supabase
          .from('market_intelligence')
          .select(COST_COLUMNS)
          .order('domain_name', { ascending: true })

        if (response.error && /certification_cost/i.test(response.error.message || '')) {
          response = await supabase
            .from('market_intelligence')
            .select(BASE_COLUMNS)
            .order('domain_name', { ascending: true })
        }

        if (cancelled) return
        if (response.error) throw response.error

        const normalized = (Array.isArray(response.data) ? response.data : []).map(normalizeMarketRow)
        setRows(normalized)

        const latest = normalized
          .map((row) => row.updated_at)
          .filter(Boolean)
          .sort()
          .at(-1)
        setLastSync(latest || null)
      } catch (err) {
        if (!cancelled) {
          setRows([])
          setError(err?.message || 'Failed to load market data.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 300_000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const activeCapsule = CAPSULES.find((capsule) => capsule.id === activeId) || CAPSULES[0]
  const filtered = useMemo(() => {
    if (!activeCapsule.match) return rows
    return rows.filter((row) =>
      activeCapsule.match.some((keyword) => row.domain_name.toLowerCase().includes(keyword.toLowerCase()))
    )
  }, [activeCapsule, rows])

  const stats = useMemo(() => {
    const rowsWithSalary = rows.filter((row) => row.min_salary > 0 && row.max_salary > 0)
    const totalJobs = rows.reduce((sum, row) => sum + row.job_count_naukri, 0)
    const avgMin = rowsWithSalary.length
      ? Math.round(rowsWithSalary.reduce((sum, row) => sum + row.min_salary, 0) / rowsWithSalary.length)
      : 0
    const avgMax = rowsWithSalary.length
      ? Math.round(rowsWithSalary.reduce((sum, row) => sum + row.max_salary, 0) / rowsWithSalary.length)
      : 0
    const paybacks = rowsWithSalary.map(calcPaybackMonths).filter(Boolean)
    const avgPayback = paybacks.length
      ? `${Math.round(paybacks.reduce((sum, value) => sum + value, 0) / paybacks.length)} mo`
      : '-'

    return [
      { label: 'Roles Tracked', value: rows.length || '-' },
      { label: 'With Salary', value: rowsWithSalary.length || '-' },
      { label: 'Avg Entry', value: fmtLpa(avgMin) },
      { label: 'Avg Ceiling', value: fmtLpa(avgMax) },
      { label: 'Avg ROI', value: avgPayback },
      { label: 'Live Jobs', value: totalJobs ? totalJobs.toLocaleString('en-IN') : '-' },
    ]
  }, [rows])

  const statColumns = isPhone ? 'repeat(2, minmax(0, 1fr))' : isTablet ? 'repeat(3, minmax(0, 1fr))' : 'repeat(6, minmax(0, 1fr))'

  return (
    <section
      style={{
        minHeight: '100vh',
        padding: isPhone ? '104px 18px 56px' : '128px 24px 72px',
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <div style={{ width: 'min(100%, 1120px)', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isPhone ? '1fr' : 'minmax(0, 1fr) auto',
            gap: '18px',
            alignItems: 'end',
            marginBottom: '30px',
          }}
        >
          <div>
            <p
              style={{
                margin: '0 0 10px',
                color: 'var(--accent)',
                fontFamily: FM,
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Market intelligence
            </p>
            <h1
              style={{
                margin: 0,
                color: 'var(--text)',
                fontFamily: FS,
                fontSize: isPhone ? '28px' : '32px',
                lineHeight: 1.08,
                fontWeight: 800,
                letterSpacing: 0,
              }}
            >
              Live Market Pulse
            </h1>
            <p
              style={{
                maxWidth: '660px',
                margin: '14px 0 0',
                color: 'var(--text-muted)',
                fontFamily: FS,
                fontSize: isPhone ? '14px' : '15px',
                lineHeight: 1.7,
              }}
            >
              Domain-level salary bands, Naukri demand, and certification payback windows from the
              market_intelligence table.
            </p>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: isPhone ? 'flex-start' : 'flex-end',
              gap: '9px',
              color: 'var(--text-soft)',
              fontFamily: FM,
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '999px',
                background: error ? '#d94848' : rows.length ? 'var(--accent)' : 'var(--text-soft)',
              }}
            />
            {loading ? 'Syncing' : error ? 'Unavailable' : lastSync ? `Synced ${new Date(lastSync).toLocaleDateString('en-IN')}` : 'Live'}
          </div>
        </div>

        {!loading && rows.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: statColumns,
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              marginBottom: '24px',
            }}
          >
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                style={{
                  minWidth: 0,
                  padding: '17px 0',
                  paddingLeft: index % (isPhone ? 2 : isTablet ? 3 : 6) === 0 ? 0 : '18px',
                  borderLeft: index % (isPhone ? 2 : isTablet ? 3 : 6) === 0 ? 'none' : '1px solid var(--border)',
                  borderTop: index >= (isPhone ? 2 : isTablet ? 3 : 6) ? '1px solid var(--border)' : 'none',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: 'var(--text-soft)',
                    fontFamily: FM,
                    fontSize: '9px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  {stat.label}
                </span>
                <strong
                  style={{
                    display: 'block',
                    color: 'var(--text)',
                    fontFamily: FM,
                    fontSize: isPhone ? '17px' : '19px',
                    lineHeight: 1,
                    fontWeight: 650,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {stat.value}
                </strong>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            position: isPhone ? 'sticky' : 'static',
            top: isPhone ? '72px' : 'auto',
            zIndex: 4,
            display: 'flex',
            flexWrap: isPhone ? 'nowrap' : 'wrap',
            gap: '8px',
            overflowX: isPhone ? 'auto' : 'visible',
            padding: isPhone ? '8px 0' : 0,
            marginBottom: '28px',
            background: 'var(--bg)',
            scrollbarWidth: 'none',
          }}
        >
          {CAPSULES.map((capsule) => (
            <Capsule
              key={capsule.id}
              active={capsule.id === activeId}
              label={capsule.label}
              onClick={() => setActiveId(capsule.id)}
            />
          ))}
        </div>

        {!isPhone && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.35fr) 104px 104px 92px 96px',
              gap: '10px',
              paddingBottom: '11px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {['Role', 'Entry', 'Ceiling', 'Jobs', 'ROI Mo'].map((label, index) => (
              <span
                key={label}
                style={{
                  color: 'var(--text-soft)',
                  fontFamily: FM,
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  textAlign: index === 0 ? 'left' : 'right',
                }}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {loading && (
          <div
            style={{
              padding: '44px 0',
              borderTop: isPhone ? '1px solid var(--border)' : 'none',
              color: 'var(--text-soft)',
              fontFamily: FM,
              fontSize: '12px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Loading market rows...
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              padding: '34px 0',
              borderTop: isPhone ? '1px solid var(--border)' : 'none',
              color: '#d94848',
              fontFamily: FS,
              fontSize: '14px',
              lineHeight: 1.6,
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div
            style={{
              padding: '44px 0',
              borderTop: isPhone ? '1px solid var(--border)' : 'none',
              color: 'var(--text-muted)',
              fontFamily: FS,
              fontSize: '14px',
              lineHeight: 1.6,
            }}
          >
            No data for this capsule yet. The scraper is still building this slice of the dataset.
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {filtered.map((row, index) => (
                <RoleRow
                  key={`${row.domain_name}-${index}`}
                  row={row}
                  index={index}
                  total={filtered.length}
                  isPhone={isPhone}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {!loading && rows.length > 0 && (
          <p
            style={{
              margin: '32px 0 0',
              paddingTop: '20px',
              borderTop: '1px solid var(--border)',
              color: 'var(--text-soft)',
              fontFamily: FM,
              fontSize: '10px',
              lineHeight: 1.8,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Data: market_intelligence. ROI months = cost / ((salary ceiling - entry salary) / 12).
            Missing certification cost falls back to INR 25,000.
          </p>
        )}
      </div>
    </section>
  )
}
