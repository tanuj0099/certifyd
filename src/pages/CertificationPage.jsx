import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import WorkspaceHeader from '../components/WorkspaceHeader'
import { supabase } from '../lib/supabase.js'
import { CERTIFICATIONS } from '../tokens.js'
import { ArrowRight, Sparkles, CheckCircle, Clock, Trophy } from 'lucide-react'
import slugify from '../utils/slugify.js'

const FS = "'Inter', 'DM Sans', sans-serif"
const FM = "'JetBrains Mono', 'IBM Plex Mono', monospace"

const card = {
  padding: '22px',
  borderRadius: '14px',
  border: '1px solid var(--border)',
  background: 'var(--bg-alt)',
}

function formatCurrency(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return '—'
  return `₹${n.toLocaleString('en-IN')}`
}

function formatMonths(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return '—'
  return `${n} month${n === 1 ? '' : 's'}`
}

function formatPercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${n}%`
}

// CSS shimmer keyframe injected once
const SHIMMER_STYLE_ID = 'cert-shimmer-style'
if (typeof document !== 'undefined' && !document.getElementById(SHIMMER_STYLE_ID)) {
  const style = document.createElement('style')
  style.id = SHIMMER_STYLE_ID
  style.textContent = `
    @keyframes certShimmer {
      0% { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    .cert-shimmer {
      background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%);
      background-size: 800px 100%;
      animation: certShimmer 1.5s infinite linear;
      border-radius: 8px;
    }
  `
  document.head.appendChild(style)
}

function ShimmerBox({ width = '100%', height = 18, style: extra = {} }) {
  return (
    <div
      className="cert-shimmer"
      style={{ width, height, borderRadius: 8, ...extra }}
    />
  )
}

function ShimmerGrid() {
  return (
    <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(2, 1fr)' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ ...card, display: 'grid', gap: '10px' }}>
          <ShimmerBox width="60%" height={11} />
          <ShimmerBox width="80%" height={22} />
        </div>
      ))}
    </div>
  )
}

export default function CertificationPage() {
  const { slug } = useParams()
  const [cert, setCert] = useState(null)
  const [certLoading, setCertLoading] = useState(true)
  const [certError, setCertError] = useState(null)
  const [demandData, setDemandData] = useState(null)
  const [demandLoading, setDemandLoading] = useState(true)
  const [demandError, setDemandError] = useState(null)

  useEffect(() => {
    if (!slug || !supabase) {
      setCert(null)
      setCertLoading(false)
      return
    }

    let active = true

    async function loadCertification() {
      setCertLoading(true)
      setCertError(null)
      try {
        const { data, error } = await supabase
          .from('certifications')
          .select('*')
          .eq('slug', slug)
          .maybeSingle()

        if (error) throw error

        if (active && data) {
          setCert(data)
          return
        }

        const local = CERTIFICATIONS.find((item) => slugify(item.name) === slug)
        if (active) {
          setCert(local ?? null)
        }
      } catch (fetchError) {
        console.error('Failed to load certification metadata:', fetchError)
        if (active) {
          setCertError('Certification metadata is unavailable right now.')
        }
      } finally {
        if (active) setCertLoading(false)
      }
    }

    loadCertification()
    return () => { active = false }
  }, [slug])

  useEffect(() => {
    if (!cert || !supabase) {
      setDemandData(null)
      setDemandLoading(false)
      return
    }

    let active = true

    async function fetchDemandData() {
      setDemandLoading(true)
      setDemandError(null)
      try {
        const lookupSlug = cert.slug || slug
        const { data: primary, error: err1 } = await supabase
          .from('demand_scores')
          .select('*')
          .eq('slug', lookupSlug)
          .maybeSingle()

        if (err1) throw err1

        if (active && primary) {
          setDemandData(primary)
          return
        }

        const { data: fallback, error: err2 } = await supabase
          .from('demand_scores')
          .select('*')
          .eq('certification', cert.name)
          .maybeSingle()

        if (err2) throw err2
        if (active) setDemandData(fallback ?? null)
      } catch (fetchError) {
        console.error('Failed to load demand data:', fetchError)
        if (active) setDemandError('Market demand details are unavailable right now.')
      } finally {
        if (active) setDemandLoading(false)
      }
    }

    fetchDemandData()
    return () => { active = false }
  }, [cert, slug])

  if (certLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '100px 24px 80px', fontFamily: FS }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gap: '28px' }}>
          <ShimmerBox width="220px" height={14} />
          <ShimmerBox width="60%" height={48} style={{ marginTop: 8 }} />
          <ShimmerBox width="40%" height={16} />
          <ShimmerGrid />
        </div>
      </div>
    )
  }

  if (!cert) {
    return (
      <div
        style={{
          minHeight: '60vh',
          padding: '64px 24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'var(--text-3)',
          fontFamily: FS,
          background: 'var(--bg)',
        }}
      >
        {certError || 'Certification not found.'}
      </div>
    )
  }

  // Normalize field names — DB may use cost_inr / median_roi_percent / time_commitment_months
  // or legacy avgCost / avgHike / timeMonths from tokens.js
  const costValue = cert.cost_inr ?? cert.avgCost ?? null
  const roiPercent = cert.median_roi_percent ?? cert.avgHike ?? null
  const timeMonths = cert.time_commitment_months ?? cert.timeMonths ?? null

  const monthlyCost = costValue && timeMonths
    ? Math.max(Math.round(Number(costValue) / Math.max(1, Number(timeMonths))), 0)
    : null

  const demandScore = demandData?.score ?? demandData?.demand_score ?? null
  const salaryFloor = demandData?.salary_floor ?? null
  const salaryCeiling = demandData?.salary_ceiling ?? null
  const jobCount = demandData?.job_count ?? null

  const statsCards = [
    { label: 'Certification cost', value: formatCurrency(costValue) },
    { label: 'Median ROI hike', value: formatPercent(roiPercent) },
    { label: 'Time to complete', value: formatMonths(timeMonths) },
    { label: 'Monthly budget', value: monthlyCost ? formatCurrency(monthlyCost) : '—' },
    { label: 'Entry salary', value: formatCurrency(salaryFloor) },
    { label: 'Salary ceiling', value: formatCurrency(salaryCeiling) },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        /* 112px clears the fixed Dynamic Island nav capsule */
        padding: '112px 24px 80px',
        fontFamily: FS,
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gap: '24px' }}>
        <WorkspaceHeader
          breadcrumb={[
            { label: 'Certifications', href: '/tools/cert-radar' },
            { label: cert.name },
          ]}
        />

        {/* Hero */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '20px',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: 'var(--accent)',
                }}
              >
                <Sparkles size={18} />
              </span>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.24em', color: 'var(--text-4)', fontFamily: FM }}>
                Certification detail
              </span>
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(2rem, 4vw, 3.2rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                color: 'var(--text)',
                fontWeight: 800,
              }}
            >
              {cert.name}
            </h1>
            <p style={{ margin: '16px 0 0', maxWidth: '680px', fontSize: '15px', lineHeight: 1.8, color: 'var(--text-3)' }}>
              {cert.forWho || cert.description || ''}
            </p>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            <Link
              to="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '13px 20px',
                borderRadius: '999px',
                background: 'var(--accent)',
                color: '#010102',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: '14px',
                whiteSpace: 'nowrap',
              }}
            >
              Track this plan
              <ArrowRight size={16} />
            </Link>
            {cert.link && (
              <a
                href={cert.link}
                target="_blank"
                rel="noreferrer noopener"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '13px 20px',
                  borderRadius: '999px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text)',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                }}
              >
                Official page
                <ArrowRight size={16} />
              </a>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div>
          {demandLoading ? (
            <ShimmerGrid />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              {statsCards.map((item) => (
                <div key={item.label} style={card}>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: FM, letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: '10px' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Demand signals panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
          <div style={card}>
            <h2 style={{ margin: '0 0 18px', fontSize: '1.1rem', fontWeight: 800, color: '#f7f8f8' }}>
              Why this certification matters
            </h2>
            <div style={{ display: 'grid', gap: '18px' }}>
              {[
                {
                  Icon: CheckCircle,
                  color: '#10b981',
                  title: 'Job-ready signal',
                  body: 'This certification is mapped to open roles and employer demand in current Indian tech and cloud markets.',
                },
                {
                  Icon: Clock,
                  color: 'var(--accent)',
                  title: 'Strong salary uplift',
                  body: 'Expected hike estimates are derived from certification outcomes and latest employer salary signals.',
                },
                {
                  Icon: Trophy,
                  color: '#f43f5e',
                  title: 'Career differentiation',
                  body: 'Hiring managers value certified professionals, especially for architecture, cloud, and specialist roles.',
                },
              ].map(({ Icon, color, title, body }) => (
                <div key={title} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      flexShrink: 0,
                      borderRadius: '10px',
                      background: `${color}18`,
                      color,
                    }}
                  >
                    <Icon size={17} />
                  </span>
                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{title}</h3>
                    <p style={{ margin: 0, color: 'var(--text-3)', lineHeight: 1.7, fontSize: '13px' }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside style={{ display: 'grid', gap: '14px' }}>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-4)', fontFamily: FM }}>
                    Demand signals
                  </p>
                  <h3 style={{ margin: '6px 0 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text)' }}>Live score</h3>
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    borderRadius: '999px',
                    background: 'rgba(59, 130, 246, 0.08)',
                    color: 'var(--accent)',
                  }}
                >
                  <Sparkles size={14} />
                  <span style={{ fontWeight: 700, fontSize: '12px' }}>Live</span>
                </div>
              </div>

              {demandLoading ? (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ display: 'grid', gap: '6px' }}>
                      <ShimmerBox width="50%" height={10} />
                      <ShimmerBox width="70%" height={18} />
                    </div>
                  ))}
                </div>
              ) : demandError ? (
                <div style={{ color: '#f87171', fontSize: '13px', lineHeight: 1.6 }}>{demandError}</div>
              ) : !demandData ? (
                <div style={{ color: 'var(--text-3)', fontSize: '13px', lineHeight: 1.6 }}>
                  No market demand record found for this certification.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {[
                    { label: 'Demand score', value: demandScore !== null ? demandScore.toFixed ? demandScore.toFixed(1) : demandScore : '—' },
                    { label: 'Live job postings', value: jobCount ? Number(jobCount).toLocaleString('en-IN') : '—' },
                    { label: 'Salary floor', value: formatCurrency(salaryFloor) },
                    { label: 'Last updated', value: demandData.updated_at ? new Date(demandData.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                  ].map((item) => (
                    <div key={item.label} style={{ padding: '12px 14px', borderRadius: '10px', background: 'color-mix(in srgb, var(--text) 3%, transparent)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '6px', fontFamily: FM, letterSpacing: '0.08em' }}>{item.label}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
