import { AnimatePresence, motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'

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
  if (!value) return 'Not captured'
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

export default function CertRadar() {
  const [certs, setCerts] = useState([])
  const [activeDomain, setActiveDomain] = useState('All')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const deferredQuery = useDeferredValue(query)

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

    return () => {
      cancelled = true
    }
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
      { label: 'Tracked Certs', value: certs.length || '-' },
      { label: 'Domains', value: Math.max(domains.length - 1, 0) || '-' },
      { label: 'Priced Rows', value: priced.length || '-' },
      { label: 'Median Cost', value: medianCost ? formatInr(medianCost) : free.length ? 'Free mix' : '-' },
    ]
  }, [certs, domains.length])

  useEffect(() => {
    if (activeDomain !== 'All' && !domains.some((domain) => domain.name === activeDomain)) {
      setActiveDomain('All')
    }
  }, [activeDomain, domains])

  return (
    <section className="cert-radar" aria-labelledby="cert-radar-heading">
      <div className="cert-radar__shell">
        <div className="cert-radar__intro">
          <div>
            <p className="cert-radar__eyebrow">Pipeline intelligence</p>
            <h2 id="cert-radar-heading" className="cert-radar__title">
              Live Certification Pipeline
            </h2>
            <p className="cert-radar__copy">
              Read-only view of the certifications pulled by the automated pipeline, organized for fast
              domain discovery.
            </p>
          </div>
          <div className="cert-radar__sync">
            <span className={`cert-radar__sync-dot${error ? ' cert-radar__sync-dot--error' : ''}`} />
            {loading ? 'Syncing certificates' : error ? 'Pipeline unavailable' : 'Live from Supabase'}
          </div>
        </div>

        <div className="cert-radar__stats" aria-label="Certification pipeline summary">
          {stats.map((stat) => (
            <div className="cert-radar__stat" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>

        <div className="cert-radar__controls">
          <div className="cert-radar__capsules" aria-label="Filter certifications by domain">
            {domains.map((domain) => (
              <button
                className={`cert-radar__capsule${
                  activeDomain === domain.name ? ' cert-radar__capsule--active' : ''
                }`}
                key={domain.name}
                type="button"
                onClick={() => setActiveDomain(domain.name)}
              >
                <span>{domain.name}</span>
                <small>{domain.count}</small>
              </button>
            ))}
          </div>

          <label className="cert-radar__search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search cert or provider"
              aria-label="Search certification or provider"
            />
          </label>
        </div>

        {loading && (
          <div className="cert-radar__state" role="status">
            Loading certification signals...
          </div>
        )}

        {!loading && error && (
          <div className="cert-radar__state cert-radar__state--error" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && filteredCerts.length === 0 && (
          <div className="cert-radar__state">
            No certifications match this domain and search yet.
          </div>
        )}

        {!loading && !error && filteredCerts.length > 0 && (
          <div className="cert-radar__grid" aria-live="polite">
            <AnimatePresence mode="popLayout">
              {filteredCerts.map((cert, index) => (
                <motion.article
                  className="cert-radar__item"
                  key={`${cert.certName}-${cert.provider}-${index}`}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="cert-radar__item-main">
                    <p className="cert-radar__provider">{cert.provider}</p>
                    <h3>{cert.certName}</h3>
                    <span>{cert.domainName}</span>
                  </div>

                  <dl className="cert-radar__metrics">
                    <div>
                      <dt>Cost</dt>
                      <dd>{formatCost(cert)}</dd>
                    </div>
                    <div>
                      <dt>Difficulty</dt>
                      <dd>{cert.difficulty}</dd>
                    </div>
                    <div>
                      <dt>Prep</dt>
                      <dd>{formatPrepMonths(cert.prepMonths)}</dd>
                    </div>
                  </dl>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  )
}
