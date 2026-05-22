import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase.js'

// ── Career Hub navigation vocabulary ─────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'active-paths',   label: 'Active Paths' },
  { id: 'target-roles',   label: 'Target Roles' },
  { id: 'milestones',     label: 'Milestone Moats' },
  { id: 'saved',          label: 'Saved Explorations' },
]

// ── Status badge helper ───────────────────────────────────────────────────────
function statusColor(status) {
  if (!status) return 'var(--text-4)'
  const s = status.toLowerCase()
  if (s === 'complete' || s === 'done') return '#2db87a'
  if (s === 'in_progress' || s === 'active') return 'var(--accent)'
  return 'var(--text-4)'
}

// ── Career card ───────────────────────────────────────────────────────────────
function CareerCard({ title, details, updatedAt, status, index }) {
  const dateLabel = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null

  // Derive a synthetic payback hint from title keywords
  const paybackHint = (() => {
    const t = (title || '').toLowerCase()
    if (t.includes('aws') || t.includes('cloud')) return '~6 mo payback'
    if (t.includes('pmp') || t.includes('project')) return '~7 mo payback'
    if (t.includes('azure')) return '~5 mo payback'
    if (t.includes('data') || t.includes('sql')) return '~4 mo payback'
    return null
  })()

  // Step indicator
  const stepLabel = (() => {
    const t = (title || '').toLowerCase()
    if (t.includes('run') || t.includes('roi')) return '→ Run ROI analysis'
    if (t.includes('explore') || t.includes('cert')) return '→ Browse Cert Radar'
    if (t.includes('resume')) return '→ Upload resume'
    if (t.includes('familiar') || t.includes('dashboard')) return '→ Complete profile'
    return '→ Take next step'
  })()

  return (
    <div
      style={{
        padding: '16px 18px',
        borderRadius: 12,
        background: 'var(--bg-alt)',
        border: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 16,
        transition: 'border-color 0.18s ease',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title */}
        <div style={{ fontWeight: 750, fontSize: 14, color: 'var(--text)', marginBottom: 4, lineHeight: 1.35 }}>
          {title}
        </div>
        {/* Details or payback hint */}
        {details ? (
          <div style={{ color: 'var(--text-3)', fontSize: 12, lineHeight: 1.5 }}>{details}</div>
        ) : paybackHint ? (
          <div style={{ color: 'var(--text-4)', fontSize: 11, fontFamily: "'JetBrains Mono','IBM Plex Mono',monospace", letterSpacing: '0.06em' }}>
            {paybackHint}
          </div>
        ) : null}
        {/* Actionable step */}
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.04em' }}>
          {stepLabel}
        </div>
      </div>
      {/* Right meta */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        {status && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: 999,
            background: statusColor(status) + '14',
            border: '1px solid ' + statusColor(status) + '28',
            fontSize: 10, fontWeight: 700, color: statusColor(status),
            fontFamily: "'JetBrains Mono','IBM Plex Mono',monospace",
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            {status}
          </div>
        )}
        {dateLabel && (
          <div style={{ color: 'var(--text-4)', fontSize: 11, whiteSpace: 'nowrap' }}>{dateLabel}</div>
        )}
      </div>
    </div>
  )
}

// ── Placeholder cards when Supabase has no data ───────────────────────────────
const PLACEHOLDER_PATHS = [
  { title: 'AWS Certified Solutions Architect', details: 'Cloud architecture · Bangalore', status: 'active', payback: '~6 mo payback' },
  { title: 'Run your first ROI analysis', details: 'Get your cert payback window in seconds', status: null },
  { title: 'Explore cert recommendations', details: 'Tailored to your domain and city', status: null },
  { title: 'Connect your resume for insights', details: 'Auto-map skills and certifications', status: null },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  const [activeTab, setActiveTab] = useState('active-paths')
  const [activity, setActivity] = useState([])
  const [planItems, setPlanItems] = useState([])

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!supabase || !user) return
    let cancelled = false

    async function loadActivity() {
      try {
        const { data, error } = await supabase
          .from('user_activity')
          .select('title, details, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(12)
        if (error) throw error
        if (!cancelled) setActivity(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setActivity([])
      }
    }

    async function loadPlan() {
      try {
        const { data, error } = await supabase
          .from('user_plan')
          .select('title, status')
          .eq('user_id', user.id)
          .limit(20)
        if (error) throw error
        if (!cancelled) setPlanItems(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setPlanItems([])
      }
    }

    loadActivity()
    loadPlan()
    return () => { cancelled = true }
  }, [user])

  const displayItems = activity.length ? activity : PLACEHOLDER_PATHS

  return (
    <div style={{
      minHeight: '100vh',
      paddingTop: isMobile ? '104px' : '112px',
      paddingRight: '24px',
      paddingBottom: '40px',
      paddingLeft: '24px',
      color: 'var(--text)',
      background: 'var(--bg)',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '220px 1fr 300px',
        gap: '20px',
      }}>

        {/* ── Left sidebar: Career Hub nav ──────────────────────── */}
        <aside style={{ display: isMobile ? 'none' : 'block', position: 'relative' }}>
          <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-alt)', border: '1px solid var(--border)', position: 'sticky', top: '120px' }}>
            {/* User avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: 'var(--accent)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: 'var(--bg)', fontWeight: 800, fontSize: 15,
              }}>
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>
                  {user?.email?.split('@')[0] || 'Your workspace'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.06em' }}>Career Hub</div>
              </div>
            </div>

            {/* Nav links */}
            <div style={{ display: 'grid', gap: '4px' }}>
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '9px 11px', borderRadius: '10px',
                    background: activeTab === item.id ? 'color-mix(in srgb, var(--text) 8%, transparent)' : 'transparent',
                    border: `1px solid ${activeTab === item.id ? 'var(--border-mid)' : 'transparent'}`,
                    color: activeTab === item.id ? 'var(--text)' : 'var(--text-3)',
                    fontWeight: activeTab === item.id ? 750 : 500,
                    fontSize: 13, cursor: 'pointer',
                    transition: 'all 0.16s ease', textAlign: 'left',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Target roles section */}
            <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text-4)', marginBottom: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Target Roles
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                {['Cloud DevOps Engineer', 'Software Architect', 'Data Lead'].map((role) => (
                  <button
                    key={role}
                    style={{
                      padding: '8px 10px', borderRadius: 8,
                      border: '1px solid transparent', background: 'transparent',
                      color: 'var(--text-3)', textAlign: 'left',
                      fontSize: 12, cursor: 'pointer', lineHeight: 1.3,
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ── Center: Career paths list ─────────────────────────── */}
        <main>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 18, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)' }}>
              {NAV_ITEMS.find(n => n.id === activeTab)?.label ?? 'Active Paths'}
            </h1>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {['All', 'In Progress', 'Saved'].map((t) => (
                <button
                  key={t}
                  style={{
                    padding: '5px 13px', borderRadius: 999,
                    border: '1px solid var(--border-mid)',
                    background: 'transparent', color: 'var(--text-3)',
                    fontWeight: 600, fontSize: 12, cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <input
                placeholder="Search certifications…"
                style={{
                  padding: '7px 12px', borderRadius: 10,
                  border: '1px solid var(--border-mid)',
                  background: 'transparent', color: 'var(--text)',
                  minWidth: isMobile ? 140 : 200, fontSize: 12, outline: 'none',
                }}
              />
              <button
                style={{
                  padding: '7px 15px', borderRadius: 10,
                  background: 'var(--accent)', color: 'var(--bg)',
                  fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer',
                }}
              >
                + Add Path
              </button>
            </div>
          </div>

          {/* Cards */}
          <div style={{ display: 'grid', gap: 10 }}>
            {displayItems.map((it, idx) => (
              <CareerCard
                key={idx}
                title={it.title}
                details={it.details}
                updatedAt={it.updated_at}
                status={it.status}
                index={idx}
              />
            ))}
          </div>
        </main>

        {/* ── Right: metrics + quick actions ───────────────────── */}
        <aside style={{ display: isMobile ? 'none' : 'block' }}>
          <div style={{ padding: '16px', borderRadius: 14, background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-4)', marginBottom: 4, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Milestone Moats
            </div>
            <div style={{ fontWeight: 800, fontSize: '2rem', marginBottom: 4, color: 'var(--accent)', lineHeight: 1 }}>
              {planItems.length || displayItems.length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 16 }}>
              active cert paths tracked
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 10, color: 'var(--text)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Quick Actions
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                <Link to="/app" style={{ textDecoration: 'none' }}>
                  <button style={{
                    width: '100%', padding: '10px 12px', borderRadius: 9,
                    background: 'transparent', border: '1px solid var(--border-mid)',
                    color: 'var(--text-2)', textAlign: 'left', fontSize: 13,
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease',
                  }}>
                    → Run ROI Calculator
                  </button>
                </Link>
                <Link to="/tools/cert-radar" style={{ textDecoration: 'none' }}>
                  <button style={{
                    width: '100%', padding: '10px 12px', borderRadius: 9,
                    background: 'transparent', border: '1px solid var(--border-mid)',
                    color: 'var(--text-2)', textAlign: 'left', fontSize: 13,
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease',
                  }}>
                    → Cert Radar
                  </button>
                </Link>
                <Link to="/tools/market" style={{ textDecoration: 'none' }}>
                  <button style={{
                    width: '100%', padding: '10px 12px', borderRadius: 9,
                    background: 'transparent', border: '1px solid var(--border-mid)',
                    color: 'var(--text-2)', textAlign: 'left', fontSize: 13,
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease',
                  }}>
                    → Market Pulse
                  </button>
                </Link>
              </div>
            </div>

            {/* Saved Explorations mini-list */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 10, color: 'var(--text)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Saved Future Explorations
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {['Google Cloud Professional', 'CKA Kubernetes', 'CFA Level 1'].map((cert) => (
                  <div key={cert} style={{
                    padding: '8px 10px', borderRadius: 8,
                    background: 'color-mix(in srgb, var(--text) 3%, transparent)',
                    border: '1px solid var(--border)',
                    fontSize: 12, color: 'var(--text-3)', lineHeight: 1.3,
                  }}>
                    {cert}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  )
}
