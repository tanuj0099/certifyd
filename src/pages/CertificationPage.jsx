import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { CERTIFICATIONS } from '../tokens.js'
import {
  ArrowRight, ExternalLink, Sparkles, CheckCircle,
  Clock, Trophy, TrendingUp, Target, ChevronRight,
  BarChart2, DollarSign, Calendar,
} from 'lucide-react'
import slugify from '../utils/slugify.js'

const FS = "'Inter', 'DM Sans', sans-serif"
const FM = "'JetBrains Mono', 'IBM Plex Mono', monospace"

// ── isMobile hook ────────────────────────────────────
function useIsMobile() {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return m
}

// ── Formatters ─────────────────────────────────────────────
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

// ── Shimmer skeleton ───────────────────────────────────────
const SHIMMER_STYLE_ID = 'cert-shimmer-style'
if (typeof document !== 'undefined' && !document.getElementById(SHIMMER_STYLE_ID)) {
  const style = document.createElement('style')
  style.id = SHIMMER_STYLE_ID
  style.textContent = `
    @keyframes certShimmer {
      0%   { background-position: -400px 0; }
      100% { background-position:  400px 0; }
    }
    .cert-shimmer {
      background: linear-gradient(90deg,
        rgba(255,255,255,0.03) 25%,
        rgba(255,255,255,0.08) 50%,
        rgba(255,255,255,0.03) 75%
      );
      background-size: 800px 100%;
      animation: certShimmer 1.5s infinite linear;
      border-radius: 8px;
    }
  `
  document.head.appendChild(style)
}
function ShimmerBox({ width = '100%', height = 18, style: extra = {} }) {
  return <div className="cert-shimmer" style={{ width, height, borderRadius: 8, ...extra }} />
}

// ── Stat card ──────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div style={{
      padding: '20px',
      borderRadius: '14px',
      border: '1px solid var(--border)',
      background: 'var(--bg-alt)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          background: accent ? `${accent}18` : 'var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={13} color={accent || 'var(--text-4)'} />
        </div>
        <span style={{ fontSize: '10px', fontFamily: FM, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-4)' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </div>
    </div>
  )
}

// ── Inline breadcrumb (no WorkspaceHeader dependency) ──────
function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <Link to="/" style={{ color: 'var(--text-4)', textDecoration: 'none', fontFamily: FM, fontSize: '11px', letterSpacing: '0.08em' }}>
        Home
      </Link>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ChevronRight size={11} color="var(--text-4)" />
          {item.href ? (
            <Link to={item.href} style={{ color: 'var(--text-3)', textDecoration: 'none', fontFamily: FM, fontSize: '11px', letterSpacing: '0.08em', transition: 'color 150ms' }}>
              {item.label}
            </Link>
          ) : (
            <span style={{ color: 'var(--text-2)', fontFamily: FM, fontSize: '11px', letterSpacing: '0.08em' }}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}

// ── Main page ──────────────────────────────────────────
export default function CertificationPage() {
  const { slug } = useParams()
  const isMobile = useIsMobile()
  const [cert, setCert] = useState(null)
  const [certLoading, setCertLoading] = useState(true)
  const [certError, setCertError] = useState(null)
  const [demandData, setDemandData] = useState(null)
  const [demandLoading, setDemandLoading] = useState(true)

  useEffect(() => {
    if (!slug) { setCertLoading(false); return }
    let active = true
    async function loadCertification() {
      setCertLoading(true); setCertError(null)
      try {
        if (supabase) {
          const { data, error } = await supabase
            .from('certifications').select('*').eq('slug', slug).maybeSingle()
          if (error) throw error
          if (active && data) { setCert(data); return }
        }
        const local = CERTIFICATIONS.find((item) => slugify(item.name) === slug)
        if (active) setCert(local ?? null)
      } catch (err) {
        if (active) setCertError('Certification metadata is unavailable right now.')
      } finally {
        if (active) setCertLoading(false)
      }
    }
    loadCertification()
    return () => { active = false }
  }, [slug])

  useEffect(() => {
    if (!cert || !supabase) { setDemandLoading(false); return }
    let active = true
    async function fetchDemand() {
      setDemandLoading(true)
      try {
        const lookupSlug = cert.slug || slug
        const { data: primary } = await supabase.from('demand_scores').select('*').eq('slug', lookupSlug).maybeSingle()
        if (active && primary) { setDemandData(primary); return }
        const { data: fallback } = await supabase.from('demand_scores').select('*').eq('certification', cert.name).maybeSingle()
        if (active) setDemandData(fallback ?? null)
      } catch (_) {
      } finally {
        if (active) setDemandLoading(false)
      }
    }
    fetchDemand()
    return () => { active = false }
  }, [cert, slug])

  if (certLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '120px 24px 80px', fontFamily: FS }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'grid', gap: '32px' }}>
          <ShimmerBox width="200px" height={12} />
          <ShimmerBox width="65%" height={52} style={{ marginTop: 8 }} />
          <ShimmerBox width="42%" height={16} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '14px', display: 'grid', gap: '10px' }}>
                <ShimmerBox width="55%" height={10} />
                <ShimmerBox width="75%" height={26} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!cert) {
    return (
      <div style={{ minHeight: '60vh', padding: '64px 24px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-3)', fontFamily: FS, background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '8px' }}>Certification not found</div>
          <div style={{ fontSize: '14px', color: 'var(--text-4)', marginBottom: '24px' }}>{certError || `No data found for "${slug}"`}</div>
          <Link to="/tools/cert-radar" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '999px', border: '1px solid var(--border)', color: 'var(--text)', textDecoration: 'none', fontFamily: FS, fontSize: '13px' }}>
            Browse all certifications <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    )
  }

  const costValue = cert.cost_inr ?? cert.avgCost ?? null
  const roiPercent = cert.median_roi_percent ?? cert.avgHike ?? null
  const timeMonths = cert.time_commitment_months ?? cert.timeMonths ?? null
  const monthlyCost = costValue && timeMonths ? Math.max(Math.round(Number(costValue) / Math.max(1, Number(timeMonths))), 0) : null
  const salaryFloor = demandData?.salary_floor ?? null
  const salaryCeiling = demandData?.salary_ceiling ?? null
  const jobCount = demandData?.job_count ?? null
  const demandScore = demandData?.score ?? demandData?.demand_score ?? null
  const domain = cert.domain_name ?? cert.domain ?? null
  const difficulty = cert.difficulty_level ?? cert.difficulty ?? null
  const provider = cert.provider ?? null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: FS }}>
      {/* ── Top bar ────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: isMobile ? '0 16px' : '0 24px',
        paddingTop: isMobile ? '12px' : 'max(env(safe-area-inset-top), 64px)',
      }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '12px 0' }}>
          <Breadcrumb items={[
            { label: 'Cert Radar', href: '/tools/cert-radar' },
            { label: domain || 'Certification', href: '/tools/cert-radar' },
            { label: cert.name },
          ]} />
        </div>
      </div>

      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: isMobile ? '24px 16px 100px' : '40px 24px 80px' }}>

        {/* ── Hero ──────────────────────────────────── */}
        <div style={{ marginBottom: isMobile ? '28px' : '40px' }}>
          {/* Tags row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {provider && (
              <span style={{ fontFamily: FM, fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-4)', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: '999px' }}>
                {provider}
              </span>
            )}
            {domain && (
              <span style={{ fontFamily: FM, fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: '999px' }}>
                {domain}
              </span>
            )}
            {difficulty && (
              <span style={{
                fontFamily: FM, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '3px 10px', borderRadius: '999px',
                color: difficulty === 'Beginner' ? '#7ec98c' : difficulty === 'Intermediate' ? '#d4a92e' : difficulty === 'Advanced' ? '#d46060' : 'var(--text-3)',
                border: `1px solid ${difficulty === 'Beginner' ? 'rgba(100,200,120,0.3)' : difficulty === 'Intermediate' ? 'rgba(230,180,60,0.3)' : difficulty === 'Advanced' ? 'rgba(220,80,80,0.3)' : 'var(--border)'}`,
                background: difficulty === 'Beginner' ? 'rgba(100,200,120,0.07)' : difficulty === 'Intermediate' ? 'rgba(230,180,60,0.07)' : difficulty === 'Advanced' ? 'rgba(220,80,80,0.07)' : 'transparent',
              }}>
                {difficulty}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto', gap: isMobile ? '20px' : '24px', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: isMobile ? 'clamp(1.5rem,6vw,2.2rem)' : 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1.06, letterSpacing: '-0.03em', color: 'var(--text)', fontWeight: 900, maxWidth: '18ch' }}>
                {cert.name}
              </h1>
              {(cert.forWho || cert.description) && (
                <p style={{ margin: '12px 0 0', maxWidth: '62ch', fontSize: isMobile ? '13px' : '15px', lineHeight: 1.75, color: 'var(--text-3)' }}>
                  {cert.forWho || cert.description}
                </p>
              )}
            </div>

            {/* CTA cluster */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '10px', flexShrink: 0, flexWrap: 'wrap' }}>
              <Link to="/dashboard" style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: isMobile ? '10px 14px' : '12px 20px', borderRadius: '12px',
                background: 'var(--text)', color: 'var(--bg)',
                textDecoration: 'none', fontWeight: 800, fontSize: '13px', whiteSpace: 'nowrap',
                transition: 'opacity 150ms',
              }}>
                Track <ArrowRight size={14} />
              </Link>
              <Link to="/app" style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: isMobile ? '10px 14px' : '12px 20px', borderRadius: '12px',
                border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)',
                textDecoration: 'none', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap',
              }}>
                ROI <BarChart2 size={14} />
              </Link>
              {cert.link && (
                <a href={cert.link} target="_blank" rel="noreferrer noopener" style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: isMobile ? '10px 12px' : '8px 14px', borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-3)',
                  textDecoration: 'none', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap',
                }}>
                  Official <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats grid ──────────────────────────────── */}
        {demandLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: isMobile ? '10px' : '14px', marginBottom: '28px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '14px', display: 'grid', gap: '10px' }}>
                <ShimmerBox width="55%" height={10} />
                <ShimmerBox width="75%" height={26} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: isMobile ? '10px' : '14px', marginBottom: isMobile ? '28px' : '40px' }}>
            <StatCard icon={DollarSign}  label="Cert Cost"       value={formatCurrency(costValue)}  accent="#2db87a" />
            <StatCard icon={TrendingUp}  label="Median Hike"     value={formatPercent(roiPercent)}  accent="#4f8ef7" />
            <StatCard icon={Calendar}    label="Study Time"      value={formatMonths(timeMonths)}   accent="#a78bfa" />
            <StatCard icon={DollarSign}  label="Monthly Budget"  value={monthlyCost ? formatCurrency(monthlyCost) : '—'} accent="#f59e0b" />
            <StatCard icon={Target}      label="Entry Salary"    value={formatCurrency(salaryFloor)} accent="#10b981" />
            <StatCard icon={TrendingUp}  label="Salary Ceiling"  value={formatCurrency(salaryCeiling)} accent="#f43f5e" />
          </div>
        )}

        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '40px' }} />

        {/* ── Two-col content panel ──────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: '20px', alignItems: 'start' }}>

          {/* Left — Why this cert */}
          <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', background: 'var(--bg-alt)' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text)' }}>
              Why this certification matters
            </h2>
            <div style={{ display: 'grid', gap: '22px' }}>
              {[
                { icon: CheckCircle, color: '#10b981', title: 'Job-ready signal', body: 'This certification is mapped to open roles and employer demand in current Indian tech and cloud markets.' },
                { icon: Clock, color: '#4f8ef7', title: 'Strong salary uplift', body: 'Expected hike estimates are derived from certification outcomes and latest employer salary signals.' },
                { icon: Trophy, color: '#f59e0b', title: 'Career differentiation', body: 'Hiring managers value certified professionals, especially for architecture, cloud, and specialist roles.' },
              ].map(({ icon: Icon, color, title, body }) => (
                <div key={title} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '10px', background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color={color} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{title}</h3>
                    <p style={{ margin: 0, color: 'var(--text-3)', lineHeight: 1.7, fontSize: '13px' }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Market demand */}
          <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', background: 'var(--bg-alt)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-4)', fontFamily: FM }}>
                  Demand signals
                </p>
                <h3 style={{ margin: '5px 0 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text)' }}>Live score</h3>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '999px', background: 'rgba(45,184,122,0.08)', border: '1px solid rgba(45,184,122,0.2)' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2db87a', display: 'block' }} />
                <span style={{ fontFamily: FM, fontSize: '10px', color: '#2db87a', fontWeight: 700 }}>Live</span>
              </div>
            </div>

            {demandLoading ? (
              <div style={{ display: 'grid', gap: '10px' }}>
                {Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ display: 'grid', gap: '6px' }}><ShimmerBox width="50%" height={10} /><ShimmerBox width="70%" height={18} /></div>)}
              </div>
            ) : !demandData ? (
              <div style={{ color: 'var(--text-4)', fontSize: '13px', lineHeight: 1.65, fontFamily: FS, padding: '16px 0' }}>
                No live market record found for this certification yet. Data is updated weekly.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {[
                  { label: 'Demand score', value: demandScore !== null ? (demandScore.toFixed ? demandScore.toFixed(1) : demandScore) : '—' },
                  { label: 'Live job postings', value: jobCount ? Number(jobCount).toLocaleString('en-IN') : '—' },
                  { label: 'Salary floor', value: formatCurrency(salaryFloor) },
                  { label: 'Salary ceiling', value: formatCurrency(salaryCeiling) },
                  { label: 'Last updated', value: demandData.updated_at ? new Date(demandData.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                ].map((item) => (
                  <div key={item.label} style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-4)', marginBottom: '6px', fontFamily: FM, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{item.label}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Compare CTA */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <Link to="/tools/compare" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-3)', textDecoration: 'none', fontFamily: FM, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'color 150ms' }}>
                Compare with another cert <ArrowRight size={11} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Related actions footer ─────────────────────── */}
        <div style={{ marginTop: '32px', padding: '20px 24px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: FM, fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '4px' }}>Next step</div>
            <div style={{ fontFamily: FS, fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
              See what this cert is worth for your salary + city
            </div>
          </div>
          <Link to="/app" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', background: 'var(--text)', color: 'var(--bg)', textDecoration: 'none', fontWeight: 800, fontSize: '13px', whiteSpace: 'nowrap' }}>
            Calculate ROI now <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
