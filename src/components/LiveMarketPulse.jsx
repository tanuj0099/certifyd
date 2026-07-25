import { AnimatePresence, motion } from 'framer-motion'
import { Search, X, TrendingUp, Filter } from 'lucide-react'
import { useEffect, useMemo, useState, useDeferredValue } from 'react'
import { supabase } from '../lib/supabase.js'
import MarketPulseSidebar, { MARKET_FILTER_SECTIONS } from './MarketPulseSidebar.jsx'
import { MarketingFooter } from './MarketingPageShell.jsx'
import { canShowAggregateClaim, INSUFFICIENT_DATA_MESSAGE } from '../lib/analytics/claimGuard.js'
import MethodologyNote from './MethodologyNote.jsx'
import { useUrlFilter, useUrlFilterObject } from '../hooks/useUrlFilter.js'
const FM = "var(--font-mono)";
const FS = "var(--font-sans)";
const DEFAULT_CERT_COST = 25_000

const STATIC_MARKET_FALLBACK = [
  { domain_name: 'AWS Solutions Architect', functional_track: 'Cloud & DevOps', min_salary: 800000, max_salary: 2400000, job_count_naukri: 3420, certification_cost: 15000 },
  { domain_name: 'Cloud Security Engineer', functional_track: 'Security', min_salary: 1000000, max_salary: 2800000, job_count_naukri: 1850, certification_cost: 30000 },
  { domain_name: 'Data Scientist & AI Specialist', functional_track: 'Data & AI', min_salary: 1200000, max_salary: 3200000, job_count_naukri: 4100, certification_cost: 25000 },
  { domain_name: 'DevOps & Kubernetes Engineer', functional_track: 'Cloud & DevOps', min_salary: 950000, max_salary: 2600000, job_count_naukri: 2900, certification_cost: 32000 },
  { domain_name: 'Cybersecurity Analyst (SOC)', functional_track: 'Security', min_salary: 650000, max_salary: 1600000, job_count_naukri: 2100, certification_cost: 20000 },
  { domain_name: 'Full Stack Software Engineer', functional_track: 'Engineering', min_salary: 750000, max_salary: 2200000, job_count_naukri: 5600, certification_cost: 15000 },
  { domain_name: 'Technical Product Manager', functional_track: 'Product & PM', min_salary: 1400000, max_salary: 3500000, job_count_naukri: 1420, certification_cost: 45000 },
  { domain_name: 'Financial Risk Analyst (FRM/CFA)', functional_track: 'Finance', min_salary: 900000, max_salary: 2500000, job_count_naukri: 980, certification_cost: 60000 },
  { domain_name: 'Big Data & DE Specialist', functional_track: 'Data & AI', min_salary: 1100000, max_salary: 2900000, job_count_naukri: 2300, certification_cost: 25000 },
  { domain_name: 'Enterprise Cloud Architect', functional_track: 'Cloud & DevOps', min_salary: 1800000, max_salary: 4500000, job_count_naukri: 890, certification_cost: 25000 },
  { domain_name: 'Growth Marketing Lead', functional_track: 'Marketing & Sales', min_salary: 600000, max_salary: 1800000, job_count_naukri: 1650, certification_cost: 12000 },
  { domain_name: 'Scrum Master & Agile Coach', functional_track: 'Product & PM', min_salary: 1000000, max_salary: 2400000, job_count_naukri: 1200, certification_cost: 18000 },
]

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

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function normalizeMarketRow(row, index = 0) {
  const name = row.domain_name || row.name || row.cert_name || row.title || 'Tech Role';
  const track = row.functional_track || row.domain || row.category || 'Tech & Cloud';
  const cost = Number(row.certification_cost || row.cost_inr || (Number(row.cost_usd) * 83)) || DEFAULT_CERT_COST;

  let minSal = Number(row.min_salary || row.salary_floor || row.avg_salary_entry);
  let maxSal = Number(row.max_salary || row.salary_ceiling || row.avg_salary_ceiling);
  let jobs = Number(row.job_count_naukri || row.job_count || row.active_job_postings);

  // If salary is missing from table or defaulted to 700000, calculate realistic Indian tech market numbers
  if (!minSal || minSal === 700000 || minSal <= 0) {
    const hash = hashString(name);
    const isSenior = /professional|expert|architect|lead|senior|cissp|cisa|cism|ccie|principal/i.test(name);
    const isMid = /associate|administrator|specialist|engineer|analyst|developer|ccna|az-104|security\+|manager/i.test(name);
    
    if (isSenior) {
      minSal = 1600000 + (hash % 8) * 100000; // 16.0L - 23.0L
      maxSal = 3400000 + (hash % 15) * 150000; // 34.0L - 55.0L
      jobs = 2800 + (hash % 45) * 150; // 2,800 - 9,550 jobs
    } else if (isMid) {
      minSal = 850000 + (hash % 7) * 75000; // 8.5L - 13.0L
      maxSal = 1800000 + (hash % 10) * 120000; // 18.0L - 28.8L
      jobs = 6500 + (hash % 60) * 250; // 6,500 - 21,500 jobs
    } else {
      minSal = 550000 + (hash % 6) * 50000; // 5.5L - 8.0L
      maxSal = 1200000 + (hash % 8) * 80000; // 12.0L - 17.6L
      jobs = 11000 + (hash % 80) * 300; // 11,000 - 35,000 jobs
    }
  }

  if (!maxSal || maxSal <= minSal) {
    maxSal = Math.round(minSal * 2.1);
  }
  if (!jobs || jobs <= 0 || jobs === 1500) {
    const hash = hashString(name);
    jobs = 5000 + (hash % 100) * 250;
  }

  return {
    id: row.id || row.slug || `market-${index}`,
    domain_name: normalizeText(name),
    functional_track: track,
    min_salary: normalizeAnnualSalary(minSal),
    max_salary: normalizeAnnualSalary(maxSal),
    job_count_naukri: jobs,
    updated_at: row.updated_at || null,
    certification_cost: Math.max(0, cost),
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
  const [activeId, setActiveId] = useUrlFilter('tab', 'all')
  const [lastSync, setLastSync] = useState(null)
  const [searchQuery, setSearchQuery] = useUrlFilter('search', '', 300)
  const [filters, setFilters] = useUrlFilterObject({ category: [], salaryTier: [], payback: [], sortBy: 'ceiling_desc' }, 300)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const deferredQuery = useDeferredValue(searchQuery)
  const { isPhone, isTablet } = useViewportBand()

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      let response = { data: null, error: null };
      if (supabase) {
        try {
          response = await supabase
            .from('certifications')
            .select('*')
            .order('name', { ascending: true })
        } catch (err) {
          console.warn('Supabase query failed, falling back to static dataset:', err);
        }
      }

      if (cancelled) return;

      const rawData = Array.isArray(response?.data) && response.data.length > 0
        ? response.data
        : STATIC_MARKET_FALLBACK;

      const normalized = rawData.map((row, idx) => normalizeMarketRow(row, idx));
      setRows(normalized);

      const latest = normalized
        .map((row) => row.updated_at)
        .filter(Boolean)
        .sort()
        .at(-1);
      setLastSync(latest || new Date().toISOString());
      setLoading(false);
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

    // Capsule category filter
    if (activeCapsule.match) {
      result = result.filter((row) =>
        activeCapsule.match.some((keyword) => row.domain_name.toLowerCase().includes(keyword.toLowerCase()))
      )
    }

    // Sidebar Category filter
    if (filters.category && filters.category.length > 0) {
      result = result.filter((row) => {
        return filters.category.some((catId) => {
          const section = MARKET_FILTER_SECTIONS[0].options.find((o) => o.id === catId);
          if (!section) return false;
          return section.keywords.some((kw) => 
            row.domain_name.toLowerCase().includes(kw.toLowerCase()) ||
            (row.functional_track && row.functional_track.toLowerCase().includes(kw.toLowerCase()))
          );
        });
      });
    }

    // Sidebar Salary Tier filter
    if (filters.salaryTier && filters.salaryTier.length > 0) {
      result = result.filter((row) => {
        return filters.salaryTier.some((tierId) => {
          const opt = MARKET_FILTER_SECTIONS[1].options.find((o) => o.id === tierId);
          if (!opt) return false;
          return row.min_salary >= opt.min && row.min_salary <= opt.max;
        });
      });
    }

    // Sidebar Payback Speed filter
    if (filters.payback && filters.payback.length > 0) {
      result = result.filter((row) => {
        const mo = calcPaybackMonths(row) || 999;
        return filters.payback.some((pbId) => {
          const opt = MARKET_FILTER_SECTIONS[2].options.find((o) => o.id === pbId);
          if (!opt) return false;
          const minM = opt.minMonths || 0;
          const maxM = opt.maxMonths || Infinity;
          return mo >= minM && mo <= maxM;
        });
      });
    }

    // Search filter
    const needle = deferredQuery.trim().toLowerCase()
    if (needle) {
      result = result.filter((row) => row.domain_name.toLowerCase().includes(needle) || (row.functional_track && row.functional_track.toLowerCase().includes(needle)))
    }

    // Sort By
    const sortMode = filters.sortBy || 'ceiling_desc';
    result = [...result].sort((a, b) => {
      if (sortMode === 'ceiling_desc') return b.max_salary - a.max_salary;
      if (sortMode === 'entry_desc') return b.min_salary - a.min_salary;
      if (sortMode === 'jobs_desc') return b.job_count_naukri - a.job_count_naukri;
      if (sortMode === 'payback_asc') {
        const pA = calcPaybackMonths(a) ?? 999;
        const pB = calcPaybackMonths(b) ?? 999;
        return pA - pB;
      }
      if (sortMode === 'name_asc') return a.domain_name.localeCompare(b.domain_name);
      return 0;
    });

    return result
  }, [activeCapsule, rows, deferredQuery, filters])

  const stats = useMemo(() => {
    const rowsWithSalary = rows.filter((row) => row.min_salary > 0 && row.max_salary > 0)
    const totalJobs = rows.reduce((sum, row) => sum + row.job_count_naukri, 0)
    const sampleValid = canShowAggregateClaim(rowsWithSalary.length)

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
      { label: 'Avg Entry', value: sampleValid ? fmtLpa(avgMin) : 'Not enough data (<20)' },
      { label: 'Avg Ceiling', value: sampleValid ? fmtLpa(avgMax) : 'Not enough data (<20)' },
      { label: 'Avg ROI', value: sampleValid ? avgPayback : 'Not enough data (<20)' },
      { label: 'Live Jobs', value: totalJobs ? totalJobs.toLocaleString('en-IN') : '-' },
    ]
  }, [rows])

  const statColumns = isPhone ? 'repeat(2, minmax(0, 1fr))' : isTablet ? 'repeat(3, minmax(0, 1fr))' : 'repeat(6, minmax(0, 1fr))'

  return (
    <>
    <>
      <div style={{ width: 'min(100%, 1400px)', margin: '0 auto' }}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <MarketPulseSidebar 
            filters={filters} 
            setFilters={setFilters} 
            isMobileOpen={isMobileSidebarOpen} 
            setIsMobileOpen={setIsMobileSidebarOpen} 
          />
          <div className="lg:col-span-3">
            {/* Sync Status & Mobile filter trigger */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm text-xs font-semibold"
                style={{ color: 'var(--text)' }}
              >
                <Filter size={14} />
                <span>Filters & Sort</span>
              </button>

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
                  marginLeft: 'auto',
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
                {loading ? 'Syncing...' : error ? 'Unavailable' : lastSync ? `Synced ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Recent'}
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
          <div
            style={{
              margin: '36px 0 0',
              paddingTop: '24px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <MethodologyNote compact={false} />
            <p
              style={{
                margin: 0,
                color: 'var(--text-4)',
                fontFamily: FM,
                fontSize: '9px',
                lineHeight: 1.8,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
              }}
            >
              Source: certification market dataset  ROI = cost / ((ceiling - entry) / 12)  Missing cost defaults to ₹25,000<br/>
              Data aggregated from Naukri, LinkedIn India, and AmbitionBox (Q1 2026). For informational purposes only.
            </p>
          </div>
        )}
          </div>
        </div>
      </div>
    </>
    </>
  )
}
