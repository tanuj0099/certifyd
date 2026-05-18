import { AnimatePresence, motion } from 'framer-motion'
import { Search, X, Package } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const FM = "'JetBrains Mono','IBM Plex Mono',monospace"
const FS = "'Inter','DM Sans',sans-serif"

const CERT_COLUMNS =
  'cert_name, provider, domain_name, cost_inr, difficulty_level, prep_time_months'

const FREE_HINTS = ['free', 'hubspot academy', 'google skillshop', 'trailhead', 'aws skill builder']

function normalizeText(value, fallback) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || fallback
}

function normalizeNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function normalizeCert(row) {
  const certName = normalizeText(row.cert_name, 'Untitled certification')
  const provider = normalizeText(row.provider, 'Unknown provider')
  const domainName = normalizeText(row.domain_name, 'Unmapped')

  return {
    certName,
    provider,
    domainName,
    costInr: normalizeNumber(row.cost_inr),
    difficulty: normalizeText(row.difficulty_level, 'Unrated'),
    prepMonths: normalizeNumber(row.prep_time_months),
  }
}

function formatInr(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function isObviouslyFree(cert) {
  const haystack = `${cert.certName} ${cert.provider}`.toLowerCase()
  return FREE_HINTS.some((hint) => haystack.includes(hint))
}

function formatCost(cert) {
  if (cert.costInr > 0) return formatInr(cert.costInr)
  return isObviouslyFree(cert) ? 'Free' : 'Not captured'
}

function formatPrepMonths(value) {
  if (!value) return '—'
  return `${value} ${value === 1 ? 'month' : 'months'}`
}

function median(numbers) {
  const sorted = numbers.filter((item) => item > 0).sort((a, b) => a - b)
  if (!sorted.length) return 0
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2)
}

function useViewportBand() {
  const [width, setWidth] = useState(() => (typeof window === 'undefined' ? 1200 : window.innerWidth))
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return { isPhone: width <= 640, isTablet: width > 640 && width <= 1024 }
}

// ── Enhanced search bar ────────────────────────────────────────────────────
function SearchBar({ value, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        height: '44px',
        padding: '0 16px',
        borderRadius: '999px',
        border: '1px solid var(--border-mid)',
        background: 'transparent',
        color: 'var(--text-3)',
        width: '100%',
        maxWidth: '360px',
        transition: 'border-color 0.18s',
      }}
    >
      <Search size={15} strokeWidth={1.8} style={{ flexShrink: 0, opacity: 0.55 }} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search cert or provider…"
        aria-label="Search certification or provider"
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: 'var(--text)',
          fontFamily: FS,
          fontSize: '13px',
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          style={{
            background: 'none', border: 'none', padding: 0,
            cursor: 'pointer', color: 'var(--text-3)',
            display: 'flex', alignItems: 'center',
          }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}

// ── Domain capsule ─────────────────────────────────────────────────────────
function DomainCapsule({ domain, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        minHeight: '32px',
        padding: '0 13px',
        border: active ? '1px solid var(--text)' : '1px solid var(--border)',
        borderRadius: '999px',
        background: active ? 'var(--text)' : 'transparent',
        color: active ? 'var(--bg)' : 'var(--text-3)',
        cursor: 'pointer',
        fontFamily: FS,
        fontSize: '13px',
        fontWeight: active ? 700 : 500,
        whiteSpace: 'nowrap',
        transition: 'all 0.18s ease',
      }}
    >
      <span>{domain.name}</span>
      <small style={{
        color: active ? 'var(--bg)' : 'var(--text-4)',
        fontFamily: FM,
        fontSize: '10px',
        opacity: active ? 0.65 : 1,
      }}>
        {domain.count}
      </small>
    </button>
  )
}

// ── Difficulty badge ───────────────────────────────────────────────────────
function DifficultyBadge({ level }) {
  const colorMap = {
    'Beginner': { bg: 'rgba(100,200,120,0.1)', color: '#7ec98c', border: 'rgba(100,200,120,0.25)' },
    'Intermediate': { bg: 'rgba(230,180,60,0.1)', color: '#d4a92e', border: 'rgba(230,180,60,0.25)' },
    'Advanced': { bg: 'rgba(220,80,80,0.1)', color: '#d46060', border: 'rgba(220,80,80,0.25)' },
    'Expert': { bg: 'rgba(180,80,220,0.1)', color: '#b060d4', border: 'rgba(180,80,220,0.25)' },
  }
  const style = colorMap[level] || { bg: 'transparent', color: 'var(--text-4)', border: 'var(--border)' }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '999px',
      background: style.bg,
      border: `1px solid ${style.border}`,
      color: style.color,
      fontFamily: FM,
      fontSize: '9px',
      letterSpacing: '0.08em',
      fontWeight: 600,
    }}>
      {level}
    </span>
  )
}

// ── Cert card ──────────────────────────────────────────────────────────────
function CertCard({ cert, index }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.02, 0.15) }}
      style={{
        minWidth: 0,
        padding: '20px 0 22px',
        borderTop: '1px solid var(--border)',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Provider + domain */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <p style={{
          margin: 0,
          color: 'var(--text-4)',
          fontFamily: FM,
          fontSize: '9px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          {cert.provider}
        </p>
        <span style={{
          color: 'var(--text-3)',
          fontFamily: FM,
          fontSize: '9px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}>
          {cert.domainName}
        </span>
      </div>

      {/* Cert name */}
      <h3 style={{
        margin: 0,
        color: 'var(--text)',
        fontFamily: FS,
        fontSize: '15px',
        lineHeight: 1.28,
        fontWeight: 750,
        letterSpacing: '-0.01em',
      }}>
        {cert.certName}
      </h3>

      {/* Metrics row */}
      <dl style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '10px',
        margin: 0,
      }}>
        <div>
          <dt style={{
            marginBottom: '5px',
            color: 'var(--text-4)',
            fontFamily: FM,
            fontSize: '9px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>Cost</dt>
          <dd style={{
            margin: 0,
            color: 'var(--text-2)',
            fontFamily: FM,
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}>{formatCost(cert)}</dd>
        </div>
        <div>
          <dt style={{
            marginBottom: '5px',
            color: 'var(--text-4)',
            fontFamily: FM,
            fontSize: '9px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>Difficulty</dt>
          <dd style={{ margin: 0 }}>
            <DifficultyBadge level={cert.difficulty} />
          </dd>
        </div>
        <div>
          <dt style={{
            marginBottom: '5px',
            color: 'var(--text-4)',
            fontFamily: FM,
            fontSize: '9px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>Prep</dt>
          <dd style={{
            margin: 0,
            color: 'var(--text-2)',
            fontFamily: FM,
            fontSize: '12px',
            fontWeight: 600,
          }}>{formatPrepMonths(cert.prepMonths)}</dd>
        </div>
      </dl>
    </motion.article>
  )
}

export default function CertRadar() {
  const [certs, setCerts] = useState([])
  const [activeDomain, setActiveDomain] = useState('All')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const deferredQuery = useDeferredValue(query)
  const { isPhone, isTablet } = useViewportBand()

  useEffect(() => {
    let cancelled = false

    async function loadCerts() {
      setLoading(true)
      setError('')

      if (!supabase) {
        setCerts([])
        setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
        setLoading(false)
        return
      }

      const { data, error: queryError } = await supabase
        .from('certificates')
        .select(CERT_COLUMNS)
        .order('domain_name', { ascending: true })
        .order('cert_name', { ascending: true })

      if (cancelled) return

      if (queryError) {
        setCerts([])
        setError(queryError.message || 'Unable to load certification pipeline data.')
      } else {
        setCerts((data || []).map(normalizeCert))
      }

      setLoading(false)
    }

    loadCerts()
    return () => { cancelled = true }
  }, [])

  const domains = useMemo(() => {
    const counts = certs.reduce((acc, cert) => {
      acc.set(cert.domainName, (acc.get(cert.domainName) || 0) + 1)
      return acc
    }, new Map())

    return [
      { name: 'All', count: certs.length },
      ...Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([name, count]) => ({ name, count })),
    ]
  }, [certs])

  const filteredCerts = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase()
    return certs.filter((cert) => {
      const matchesDomain = activeDomain === 'All' || cert.domainName === activeDomain
      const matchesQuery =
        !needle ||
        cert.certName.toLowerCase().includes(needle) ||
        cert.provider.toLowerCase().includes(needle)
      return matchesDomain && matchesQuery
    })
  }, [activeDomain, certs, deferredQuery])

  const stats = useMemo(() => {
    const priced = certs.filter((cert) => cert.costInr > 0)
    const free = certs.filter((cert) => cert.costInr <= 0 && isObviouslyFree(cert))
    const medianCost = median(priced.map((cert) => cert.costInr))
    return [
      { label: 'Tracked Certs', value: certs.length || '—' },
      { label: 'Domains', value: Math.max(domains.length - 1, 0) || '—' },
      { label: 'Priced Rows', value: priced.length || '—' },
      { label: 'Median Cost', value: medianCost ? formatInr(medianCost) : free.length ? 'Free mix' : '—' },
    ]
  }, [certs, domains.length])

  useEffect(() => {
    if (activeDomain !== 'All' && !domains.some((domain) => domain.name === activeDomain)) {
      setActiveDomain('All')
    }
  }, [activeDomain, domains])

  const gridCols = isPhone ? '1fr' : isTablet ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))'

  return (
    <section
      style={{
        minHeight: '100vh',
        padding: isPhone ? '104px 18px 56px' : '128px 24px 72px',
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
      aria-labelledby="cert-radar-heading"
    >
      <div style={{ width: 'min(100%, 1120px)', margin: '0 auto' }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isPhone ? '1fr' : 'minmax(0, 1fr) auto',
          gap: '18px',
          alignItems: 'end',
          marginBottom: '32px',
        }}>
          <div>
            <p style={{
              margin: '0 0 4px',
              color: 'var(--text-4)',
              fontFamily: FM,
              fontSize: '10px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}>
              Tools
            </p>
            <h1 id="cert-radar-heading" style={{
              margin: 0,
              color: 'var(--text)',
              fontFamily: FS,
              fontSize: isPhone ? '28px' : '36px',
              lineHeight: 1.06,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'baseline',
              gap: '10px',
              flexWrap: 'wrap',
            }}>
              Cert Radar
              <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>— Pipeline Intelligence</span>
            </h1>
            <p style={{
              maxWidth: '600px',
              margin: '12px 0 0',
              color: 'var(--text-3)',
              fontFamily: FS,
              fontSize: isPhone ? '14px' : '15px',
              lineHeight: 1.7,
            }}>
              Browse the live certification catalogue collected by the pipeline, filtered by domain and provider.
            </p>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-4)',
            fontFamily: FM,
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            justifyContent: isPhone ? 'flex-start' : 'flex-end',
          }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '999px',
              background: error ? '#d94848' : certs.length ? 'var(--accent)' : 'var(--text-4)',
              animation: certs.length && !error ? 'pdot 1.8s ease-in-out infinite' : 'none',
            }} />
            {loading ? 'Syncing certificates' : error ? 'Pipeline unavailable' : 'Live from Supabase'}
          </div>
        </div>

        {/* ── Stats bar ─────────────────────────────────────── */}
        {!loading && certs.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isPhone ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            marginBottom: '28px',
          }}>
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  padding: '18px 0',
                  paddingLeft: i % (isPhone ? 2 : 4) === 0 ? 0 : '20px',
                  borderLeft: i % (isPhone ? 2 : 4) === 0 ? 'none' : '1px solid var(--border)',
                  borderTop: i >= (isPhone ? 2 : 4) ? '1px solid var(--border)' : 'none',
                }}
              >
                <span style={{
                  display: 'block', marginBottom: '8px',
                  color: 'var(--text-4)', fontFamily: FM,
                  fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase',
                }}>
                  {stat.label}
                </span>
                <strong style={{
                  display: 'block',
                  color: 'var(--text)',
                  fontFamily: FM,
                  fontSize: isPhone ? '18px' : '22px',
                  lineHeight: 1,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {stat.value}
                </strong>
              </div>
            ))}
          </div>
        )}

        {/* ── Filters: Domain capsules + Search ─────────────── */}
        <div style={{
          display: 'flex',
          alignItems: isPhone ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: '14px',
          marginBottom: '28px',
          flexDirection: isPhone ? 'column' : 'row',
          flexWrap: isPhone ? 'nowrap' : 'wrap',
        }}>
          {/* Capsules */}
          <div
            style={{
              display: 'flex',
              flexWrap: isPhone ? 'nowrap' : 'wrap',
              gap: '8px',
              overflowX: isPhone ? 'auto' : 'visible',
              scrollbarWidth: 'none',
              position: isPhone ? 'sticky' : 'static',
              top: isPhone ? '72px' : 'auto',
              zIndex: 4,
              background: isPhone ? 'var(--bg)' : 'transparent',
              padding: isPhone ? '6px 0' : 0,
              flex: 1,
            }}
          >
            {domains.map((domain) => (
              <DomainCapsule
                key={domain.name}
                domain={domain}
                active={activeDomain === domain.name}
                onClick={() => setActiveDomain(domain.name)}
              />
            ))}
          </div>

          {/* Search */}
          <SearchBar value={query} onChange={setQuery} />
        </div>

        {/* ── Loading ────────────────────────────────────────── */}
        {loading && (
          <div style={{
            padding: '48px 0',
            color: 'var(--text-4)',
            fontFamily: FM, fontSize: '11px',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'var(--text-4)',
              animation: 'pdot 1.4s ease-in-out infinite',
            }} />
            Loading certification signals…
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────── */}
        {!loading && error && (
          <div style={{
            padding: '34px 0', color: '#d94848',
            fontFamily: FS, fontSize: '14px', lineHeight: 1.6,
          }}>
            {error}
          </div>
        )}

        {/* ── Empty ─────────────────────────────────────────── */}
        {!loading && !error && filteredCerts.length === 0 && (
          <div style={{
            padding: '48px 0', color: 'var(--text-3)',
            fontFamily: FS, fontSize: '14px', lineHeight: 1.6,
            display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
            <Package size={18} style={{ opacity: 0.35 }} />
            {query
              ? `No certifications match "${query}". Try a different search.`
              : 'No certifications match this domain yet.'}
          </div>
        )}

        {/* ── Cert card grid ─────────────────────────────────── */}
        {!loading && !error && filteredCerts.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: gridCols,
              columnGap: '32px',
              rowGap: 0,
            }}
            aria-live="polite"
          >
            <AnimatePresence mode="popLayout">
              {filteredCerts.map((cert, index) => (
                <CertCard
                  key={`${cert.certName}-${cert.provider}-${index}`}
                  cert={cert}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ── Footer note ───────────────────────────────────── */}
        {!loading && certs.length > 0 && (
          <p style={{
            margin: '32px 0 0',
            paddingTop: '20px',
            borderTop: '1px solid var(--border)',
            color: 'var(--text-4)',
            fontFamily: FM,
            fontSize: '9px',
            lineHeight: 1.8,
            letterSpacing: '0.09em',
            textTransform: 'uppercase',
          }}>
            Source: certificates pipeline · Read-only view · Cost data: provider websites
          </p>
        )}
      </div>
    </section>
  )
}
