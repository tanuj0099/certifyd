'use client';

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth.jsx'
import { supabase } from '@/lib/supabase.js'
import slugify from '@/utils/slugify.js'
import SkeletonLoader from '@/components/SkeletonLoader.jsx'
import { useJourneyStore } from '@/store/useJourneyStore.js'

const FM = "var(--font-mono)";
const FS = "var(--font-sans)";

//  Career Hub navigation vocabulary 
const NAV_ITEMS = [
  { id: 'active-paths',   label: 'Active Paths' },
  { id: 'target-profiles', label: 'Target Profiles' },
  { id: 'milestones',     label: 'Milestone Moats' },
  { id: 'saved',          label: 'Saved Future Explorations' },
]

//  Status resolver - handles schema variations (status / stage / current_status) 
function resolveStatus(row) {
  return row?.status || row?.stage || row?.current_status || null
}

//  Status badge helper 
function statusColor(status) {
  if (!status) return 'var(--text-4)'
  const s = status.toLowerCase()
  if (s === 'complete' || s === 'done') return '#2db87a'
  if (s === 'in_progress' || s === 'active') return 'var(--accent)'
  if (s === 'paused' || s === 'saved') return '#f59e0b'
  return 'var(--text-4)'
}

//  Career card 
function CareerCard({ title, details, updatedAt, status, certSlug }) {
  const dateLabel = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null

  const content = (
    <div
      className="p-4 rounded-xl flex justify-between items-start gap-4 transition-all bg-[var(--surface)] border border-[var(--border)]"
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 750, fontSize: 14, color: 'var(--text)', marginBottom: 4, lineHeight: 1.35 }}>
          {title || 'Untitled Path'}
        </div>
        {details && (
          <div style={{ color: 'var(--text-3)', fontSize: 12, lineHeight: 1.5 }}>{details}</div>
        )}
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.04em' }}>
           Take next step
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        {status && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: 999,
            background: statusColor(status) + '14',
            border: '1px solid ' + statusColor(status) + '28',
            fontSize: 10, fontWeight: 700, color: statusColor(status),
            fontFamily: FM,
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

  // Make clickable if we have a cert slug
  if (certSlug) {
    return (
      <Link href={`/cert/${certSlug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        {content}
      </Link>
    )
  }
  return content
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  const [activeTab, setActiveTab] = useState('active-paths')

  // Dynamic data from Supabase
  const [journeyPaths, setJourneyPaths] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [savedItems, setSavedItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Load all dashboard data from Supabase
  useEffect(() => {
    if (!supabase || !user) {
      setLoading(false)
      return
    }
    let cancelled = false

    async function loadDashboardData() {
      try {
        setLoading(true)
        const userId = user.uid || user.id

        // Load journey tracking (Active Paths)
        try {
          const { data: journeys, error: journeyErr } = await supabase
            .from('journey_tracking')
            .select('id, cert_name, stage, current_status, domain, started_at, updated_at, notes, milestone_log')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(20)
          if (journeyErr) throw journeyErr
          if (!cancelled) setJourneyPaths(Array.isArray(journeys) ? journeys : [])
        } catch (err) {
          console.warn('journey_tracking load:', err?.message || err)
          if (!cancelled) setJourneyPaths([])
        }

        // Load user profile (Target Profiles / domain insights)
        const { data: profile, error } = await supabase.from('user_profiles').select('*').eq('user_id', userId).single()
        if (error && error.code !== 'PGRST116') throw error
        
        if (!profile) {
          router.push('/onboarding')
          return
        }
        
        if (!cancelled) setUserProfile(profile)
      } catch (err) {
        console.error("Critical dashboard initialization exception handle:", err)
      } finally {
        setLoading(false) // Drop the skeleton animation layer flawlessly
      }
    }

    loadDashboardData()
    return () => { cancelled = true }
  }, [user])

  // Derive milestones from journey_tracking.milestone_log JSONB arrays
  // (public.milestones table does not exist in this schema)
  useEffect(() => {
    if (journeyPaths.length === 0) {
      setMilestones([])
      return
    }
    const derived = []
    journeyPaths.forEach((jp) => {
      const log = jp.milestone_log
      if (Array.isArray(log)) {
        log.forEach((entry) => {
          if (entry && typeof entry === 'object') {
            derived.push({
              id: entry.id || `${jp.id}-${derived.length}`,
              title: entry.title || entry.name || jp.cert_name,
              status: entry.status || resolveStatus(jp) || 'in_progress',
              target_date: entry.target_date || entry.date || null,
            })
          }
        })
      }
    })
    setMilestones(derived)
    // savedItems: no saved_explorations table - keep as empty array
    setSavedItems([])
  }, [journeyPaths])

  //  Derive display content per active tab 
  function renderTabContent() {
    switch (activeTab) {
      case 'active-paths': {
        if (journeyPaths.length === 0) {
          return (
            <div style={{ padding: '40px 0', color: 'var(--text-4)', fontSize: 14, lineHeight: 1.7, fontFamily: FS }}>
              <div style={{ marginBottom: 12, fontSize: 16, fontWeight: 700, color: 'var(--text-3)' }}>
                No active certification paths yet
              </div>
              <p style={{ margin: 0 }}>Start by exploring certifications on Cert Radar, or run an ROI analysis to find your best path.</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <Link href="/tools/cert-radar" style={{
                  padding: '10px 16px', borderRadius: 10, background: 'var(--text)', color: 'var(--bg)',
                  textDecoration: 'none', fontWeight: 700, fontSize: 13,
                }}>
                  Browse Cert Radar
                </Link>
                <Link href="/#workspace" style={{
                  padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--text)',
                  textDecoration: 'none', fontWeight: 600, fontSize: 13,
                }}>
                  ROI Calculator
                </Link>
              </div>
            </div>
          )
        }
        return (
          <div style={{ display: 'grid', gap: 10 }}>
            {journeyPaths.map((jp, idx) => (
              <CareerCard
                key={jp.id || idx}
                title={jp.cert_name}
                details={jp.domain ? `${jp.domain}${jp.notes ? '  ' + jp.notes : ''}` : jp.notes}
                updatedAt={jp.updated_at || jp.started_at}
                status={resolveStatus(jp)}
                certSlug={jp.cert_name ? slugify(jp.cert_name) : null}
              />
            ))}
          </div>
        )
      }

      case 'target-profiles': {
        return (
          <div style={{ display: 'grid', gap: 14 }}>
            {userProfile ? (
              <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: FM, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
                  Your Career Profile
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    { label: 'Job Role', value: userProfile.job_role },
                    { label: 'Target Domain', value: userProfile.target_domain },
                    { label: 'City', value: userProfile.city },
                    { label: 'Current Salary', value: userProfile.current_salary ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(userProfile.current_salary) : null },
                    { label: 'Provider', value: userProfile.provider },
                  ].filter(r => r.value).map(({ label, value }) => (
                    <div key={label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: 9,
                      background: 'color-mix(in srgb, var(--text) 3%, transparent)',
                      border: '1px solid var(--border)',
                    }}>
                      <span style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: FM, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
                      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px 0', color: 'var(--text-4)', fontSize: 14, lineHeight: 1.7 }}>
                <div style={{ marginBottom: 12, fontSize: 16, fontWeight: 700, color: 'var(--text-3)' }}>
                  No profile data found
                </div>
                <p style={{ margin: 0 }}>Complete onboarding to set up your target domain and career profile.</p>
                <Link href="/onboarding" style={{
                  display: 'inline-block', marginTop: 14, padding: '10px 16px', borderRadius: 10,
                  background: 'var(--text)', color: 'var(--bg)', textDecoration: 'none', fontWeight: 700, fontSize: 13,
                }}>
                  Complete Profile
                </Link>
              </div>
            )}
          </div>
        )
      }

      case 'milestones': {
        if (milestones.length === 0) {
          return (
            <div style={{ padding: '40px 0', color: 'var(--text-4)', fontSize: 14, lineHeight: 1.7 }}>
              <div style={{ marginBottom: 12, fontSize: 16, fontWeight: 700, color: 'var(--text-3)' }}>
                No milestones tracked yet
              </div>
              <p style={{ margin: 0 }}>Milestones are created as you progress through certification paths - exam dates, prep checkpoints, and completion markers.</p>
            </div>
          )
        }
        return (
          <div style={{ display: 'grid', gap: 10 }}>
            {milestones.map((m, idx) => (
              <div key={m.id || idx} className="p-4 rounded-xl flex justify-between items-center bg-[var(--surface)] border border-[var(--border)]">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{m.title}</div>
                  {m.target_date && (
                    <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: FM }}>
                      Target: {new Date(m.target_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </div>
                {m.status && (
                  <div style={{
                    padding: '3px 9px', borderRadius: 999,
                    background: statusColor(m.status) + '14',
                    border: '1px solid ' + statusColor(m.status) + '28',
                    fontSize: 10, fontWeight: 700, color: statusColor(m.status),
                    fontFamily: FM, letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>
                    {m.status}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }

      case 'saved': {
        if (savedItems.length === 0) {
          return (
            <div style={{ padding: '40px 0', color: 'var(--text-4)', fontSize: 14, lineHeight: 1.7 }}>
              <div style={{ marginBottom: 12, fontSize: 16, fontWeight: 700, color: 'var(--text-3)' }}>
                No saved explorations
              </div>
              <p style={{ margin: 0 }}>Save certifications you want to explore later from Cert Radar or individual certification pages.</p>
              <Link href="/tools/cert-radar" style={{
                display: 'inline-block', marginTop: 14, padding: '10px 16px', borderRadius: 10,
                background: 'var(--text)', color: 'var(--bg)', textDecoration: 'none', fontWeight: 700, fontSize: 13,
              }}>
                Explore Certifications
              </Link>
            </div>
          )
        }
        return (
          <div style={{ display: 'grid', gap: 10 }}>
            {savedItems.map((item, idx) => (
              <Link
                key={item.id || idx}
                href={`/cert/${item.cert_name ? slugify(item.cert_name) : ''}`}
                className="no-underline"
              >
                <div className="p-4 rounded-xl flex justify-between items-center transition-all bg-[var(--surface)] border border-[var(--border)]">
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{item.cert_name}</div>
                  {item.saved_at && (
                    <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: FM }}>
                      {new Date(item.saved_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )
      }

      default:
        return null
    }
  }

  if (loading) {
    return <SkeletonLoader type="dashboard" />
  }

  return (
    <div 
      className="min-h-screen transition-colors"
      style={{
        paddingTop: isMobile ? '112px' : '128px',
        paddingRight: '24px',
        paddingBottom: '40px',
        paddingLeft: '24px',
      }}
    >
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '220px 1fr 300px',
        gap: '20px',
      }}>

        {/*  Left sidebar: Career Hub nav  */}
        <aside style={{ display: isMobile ? 'none' : 'block', position: 'relative' }}>
          <div className="p-4 rounded-2xl sticky top-[120px] bg-[var(--surface)] border border-[var(--border)]">
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
                  {user?.displayName || user?.email?.split('@')[0] || 'Your workspace'}
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

            {/* Target domain from profile */}
            {userProfile?.target_domain && (
              <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--text-4)', marginBottom: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Target Domain
                </div>
                <div style={{
                  padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)',
                  fontSize: 12, color: 'var(--text-2)', lineHeight: 1.3,
                }}>
                  {userProfile.target_domain}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/*  Center: Tab content  */}
        <main>
          {/* Mobile tab bar */}
          {isMobile && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16, scrollbarWidth: 'none' }}>
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    padding: '7px 14px', borderRadius: 999,
                    border: activeTab === item.id ? '1px solid var(--text)' : '1px solid var(--border)',
                    background: activeTab === item.id ? 'var(--text)' : 'transparent',
                    color: activeTab === item.id ? 'var(--bg)' : 'var(--text-3)',
                    fontWeight: activeTab === item.id ? 700 : 500,
                    fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 18, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)' }}>
              {NAV_ITEMS.find(n => n.id === activeTab)?.label ?? 'Active Paths'}
            </h1>
          </div>

          {renderTabContent()}
        </main>

        {/*  Right: metrics + quick actions  */}
        <aside style={{ display: isMobile ? 'none' : 'block' }}>
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
            <div style={{ fontSize: 10, color: 'var(--text-4)', marginBottom: 4, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Milestone Moats
            </div>
            <div style={{ fontWeight: 800, fontSize: '2rem', marginBottom: 4, color: 'var(--accent)', lineHeight: 1 }}>
              {journeyPaths.length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 16 }}>
              active cert paths tracked
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 10, color: 'var(--text)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Quick Actions
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                <Link href="/#workspace" onClick={() => {
                  const s = useJourneyStore.getState();
                  if (s.resetMode) s.resetMode();
                  if (s.setActiveTab) s.setActiveTab('resume');
                }} style={{ textDecoration: 'none' }}>
                  <button style={{
                    width: '100%', padding: '10px 12px', borderRadius: 9,
                    background: 'transparent', border: '1px solid var(--border-mid)',
                    color: 'var(--text-2)', textAlign: 'left', fontSize: 13,
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease',
                  }}>
                     Run ROI Calculator
                  </button>
                </Link>
                <Link href="/tools/cert-radar" style={{ textDecoration: 'none' }}>
                  <button style={{
                    width: '100%', padding: '10px 12px', borderRadius: 9,
                    background: 'transparent', border: '1px solid var(--border-mid)',
                    color: 'var(--text-2)', textAlign: 'left', fontSize: 13,
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease',
                  }}>
                     Cert Radar
                  </button>
                </Link>
                <Link href="/tools/market" style={{ textDecoration: 'none' }}>
                  <button style={{
                    width: '100%', padding: '10px 12px', borderRadius: 9,
                    background: 'transparent', border: '1px solid var(--border-mid)',
                    color: 'var(--text-2)', textAlign: 'left', fontSize: 13,
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease',
                  }}>
                     Market Pulse
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
                {savedItems.length > 0 ? (
                  savedItems.slice(0, 5).map((item, idx) => (
                    <Link
                      key={item.id || idx}
                      href={`/cert/${item.cert_name ? slugify(item.cert_name) : ''}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div style={{
                        padding: '8px 10px', borderRadius: 8,
                        background: 'color-mix(in srgb, var(--text) 3%, transparent)',
                        border: '1px solid var(--border)',
                        fontSize: 12, color: 'var(--text-3)', lineHeight: 1.3,
                        transition: 'border-color 0.15s ease',
                      }}>
                        {item.cert_name}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div style={{
                    padding: '8px 10px', borderRadius: 8,
                    background: 'color-mix(in srgb, var(--text) 3%, transparent)',
                    border: '1px solid var(--border)',
                    fontSize: 12, color: 'var(--text-4)', lineHeight: 1.3,
                  }}>
                    No saved certs yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  )
}
