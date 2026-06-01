import { AnimatePresence, motion } from 'framer-motion'
import { Search, X, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState, useDeferredValue } from 'react'
import { supabase } from '../lib/supabase.js'
import { MarketingFooter } from './MarketingPageShell.jsx'
const FM = "var(--font-mono)";
const FS = "var(--font-sans)";
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

//  Capsule filter pill 
function Capsule({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '32px',
        padding: '0 14px',
        borderRadius: '999px',
        border: active ? '1px solid var(--text)' : '1px solid var(--border)',
        background: active ? 'var(--text)' : 'transparent',
        color: active ? 'var(--bg)' : 'var(--text-3)',
        fontFamily: FM,
        fontSize: '10px',
        letterSpacing: '0.08em',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        transition: 'background 0.18s ease, color 0.18s ease, border-color 0.18s ease',
        fontWeight: active ? 700 : 500,
      }}
    >
      {label}
    </button>
  )
}

//  Search input (enhanced, pill style) 
function SearchBar({ value, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        height: '42px',
        padding: '0 16px',
        borderRadius: '999px',
        border: '1px solid var(--border-mid)',
        background: 'transparent',
        color: 'var(--text-3)',
        transition: 'border-color 0.18s ease',
        minWidth: '260px',
        maxWidth: '360px',
        flex: '1 1 260px',
      }}
    >
      <Search size={15} strokeWidth={1.8} style={{ flexShrink: 0, opacity: 0.6 }} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search role or domain..."
        aria-label="Search roles"
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: 'var(--text)',
          fontFamily: FS,
          fontSize: '13px',
          lineHeight: 1,
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--text-3)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}

//  Table row 
function RoleRow({ row, index, total, isPhone }) {
  const payback = calcPaybackMonths(row)
  const isLast = index === total - 1

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
            margin: '0 0 14px',
            color: 'var(--text)',
            fontFamily: FS,
            fontSize: '15px',
            lineHeight: 1.3,
            fontWeight: 750,
          }}
        >
          {row.domain_name}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
          {[
            { label: 'Entry', val: fmtLpa(row.min_salary) },
            { label: 'Ceiling', val: fmtLpa(row.max_salary) },
            { label: 'Live Jobs', val: fmtJobs(row.job_count_naukri) },
            { label: 'ROI Months', val: payback ? `${payback} mo` : '-' },
          ].map(({ label, val }) => (
            <div key={label}>
              <span style={{
                display: 'block', marginBottom: '5px',
                color: 'var(--text-4)', fontFamily: FM, fontSize: '9px',
                letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>{label}</span>
              <span style={{
                display: 'block', color: 'var(--text)', fontFamily: FM,
                fontSize: '12px', fontVariantNumeric: 'tabular-nums',
              }}>{val}</span>
            </div>
          ))}
        </div>
      </motion.article>
    )
  }

  // Row hover highlight
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.025, 0.2) }}
      className="group"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.6fr) 112px 112px 96px 96px',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 12px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        background: 'transparent',
        borderRadius: '6px',
        cursor: 'default',
        transition: 'background 0.2s ease',
      }}
      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent' }}
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
        (value, i) => (
          <span
            key={`${value}-${i}`}
            style={{
              color: 'var(--text-3)',
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
  const [searchQuery, setSearchQuery] = useState('')
  const deferredQuery = useDeferredValue(searchQuery)
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
        setLoading(false)
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
    let result = rows

    // Category filter
    if (activeCapsule.match) {
      result = result.filter((row) =>
        activeCapsule.match.some((keyword) => row.domain_name.toLowerCase().includes(keyword.toLowerCase()))
      )
    }

    // Search filter
    const needle = deferredQuery.trim().toLowerCase()
    if (needle) {
      result = result.filter((row) => row.domain_name.toLowerCase().includes(needle))
    }

    return result
  }, [activeCapsule, rows, deferredQuery])

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
    <>
    <>
      <div style={{ width: 'min(100%, 1120px)', margin: '0 auto' }}>
        {/* Sync Status */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-4)',
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
                background: error ? 'var(--err)' : rows.length ? 'var(--accent)' : 'var(--text-4)',
                animation: rows.length && !error ? 'pdot 1.8s ease-in-out infinite' : 'none',
              }}
            />
            {loading ? 'Syncing...' : error ? 'Unavailable' : lastSync ? `Synced ${new Date(lastSync).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Live'}
          </div>
        </div>

        {/*  Stats bar  */}
        {!loading && rows.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: statColumns,
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              marginBottom: '28px',
            }}
          >
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                style={{
                  minWidth: 0,
                  padding: '18px 0',
                  paddingLeft: index % (isPhone ? 2 : isTablet ? 3 : 6) === 0 ? 0 : '20px',
                  borderLeft: index % (isPhone ? 2 : isTablet ? 3 : 6) === 0 ? 'none' : '1px solid var(--border)',
                  borderTop: index >= (isPhone ? 2 : isTablet ? 3 : 6) ? '1px solid var(--border)' : 'none',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: 'var(--text-4)',
                    fontFamily: FM,
                    fontSize: '9px',
                    letterSpacing: '0.14em',
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
                    fontSize: isPhone ? '17px' : '20px',
                    lineHeight: 1,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {stat.value}
                </strong>
              </div>
            ))}
          </div>
        )}

        {/*  Filters: Capsules + Search  */}
        <div
          style={{
            display: 'flex',
            flexWrap: isPhone ? 'nowrap' : 'wrap',
            alignItems: 'center',
            gap: '10px',
            overflowX: isPhone ? 'auto' : 'visible',
            padding: isPhone ? '6px 0' : 0,
            marginBottom: '24px',
            background: 'var(--bg)',
            scrollbarWidth: 'none',
            position: isPhone ? 'sticky' : 'static',
            top: isPhone ? '72px' : 'auto',
            zIndex: 4,
          }}
        >
          {/* Category capsules */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: isPhone ? 'nowrap' : 'wrap', flexShrink: 0 }}>
            {CAPSULES.map((capsule) => (
              <Capsule
                key={capsule.id}
                active={capsule.id === activeId}
                label={capsule.label}
                onClick={() => setActiveId(capsule.id)}
              />
            ))}
          </div>

          {/* Spacer */}
          {!isPhone && <div style={{ flex: 1 }} />}

          {/* Search */}
          {!isPhone && (
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          )}
        </div>

        {/* Mobile search */}
        {isPhone && (
          <div style={{ marginBottom: '18px' }}>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        )}

        {/*  Table header  */}
        {!isPhone && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.6fr) 112px 112px 96px 96px',
              gap: '10px',
              padding: '0 12px 12px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {['Role', 'Entry', 'Ceiling', 'Jobs', 'ROI Mo'].map((label, index) => (
              <span
                key={label}
                style={{
                  color: 'var(--text-4)',
                  fontFamily: FM,
                  fontSize: '9px',
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

        {/*  Loading state  */}
        {loading && (
          <div
            style={{
              padding: '48px 0',
              color: 'var(--text-4)',
              fontFamily: FM,
              fontSize: '11px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'var(--text-4)',
              animation: 'pdot 1.4s ease-in-out infinite',
            }} />
            Loading market rows...
          </div>
        )}

        {/*  Error state  */}
        {!loading && error && (
          <div
            style={{
              padding: '34px 0',
              color: 'var(--err)',
              fontFamily: FS,
              fontSize: '14px',
              lineHeight: 1.6,
            }}
          >
            {error}
          </div>
        )}

        {/*  Empty state  */}
        {!loading && !error && filtered.length === 0 && (
          <div
            style={{
              padding: '48px 0',
              color: 'var(--text-3)',
              fontFamily: FS,
              fontSize: '14px',
              lineHeight: 1.6,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <TrendingUp size={18} style={{ opacity: 0.4 }} />
            {searchQuery
              ? `No roles match "${searchQuery}". Try a different search.`
              : 'No data for this category yet. The scraper is still building this slice.'}
          </div>
        )}

        {/*  Data rows  */}
        {!loading && !error && filtered.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeId}-${deferredQuery}`}
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

        {/*  Footer note  */}
        {!loading && rows.length > 0 && (
          <p
            style={{
              margin: '32px 0 0',
              paddingTop: '20px',
              borderTop: '1px solid var(--border)',
              color: 'var(--text-4)',
              fontFamily: FM,
              fontSize: '9px',
              lineHeight: 1.8,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
            }}
          >
            Source: market_intelligence table  ROI = cost  ((ceiling  entry)  12)  Missing cost defaults to ₹25,000<br/>
            Data aggregated from Naukri, LinkedIn India, and AmbitionBox (Q1 2026). For informational purposes only.
          </p>
        )}
      </div>
    </>
    </>
  )
}
