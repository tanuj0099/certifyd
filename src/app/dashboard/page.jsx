'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useJourneyStore } from '@/store/useJourneyStore.js'
import BurnRate from '@/components/BurnRate.jsx'
import { MarketingFooter } from '@/components/MarketingPageShell.jsx'
import {
  Award, TrendingUp, BarChart2, Zap, MapPin,
  ChevronRight, BookOpen, Compass, Target, Bookmark,
  Star, Activity, FileSearch
} from 'lucide-react'

const FH = "var(--font-head)";
const FM = "var(--font-mono)";
const FB = "var(--font-body)";

// ─── Sidebar nav item ────────────────────────────────────────────────────────
function NavItem({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '8px 12px',
        borderRadius: '8px', border: 'none', cursor: 'pointer',
        background: active ? 'var(--bg-surface)' : 'transparent',
        color: active ? 'var(--text)' : 'var(--text-3)',
        fontFamily: FH, fontSize: '13px', fontWeight: active ? '600' : '500',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-surface)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      {label}
    </button>
  )
}

// ─── Right sidebar action button ─────────────────────────────────────────────
function ActionBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '9px 12px',
        borderRadius: '8px', border: '1px solid var(--border)',
        background: 'transparent', color: 'var(--text)',
        fontFamily: FH, fontSize: '12px', fontWeight: '500',
        cursor: 'pointer', transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)' }}
    >
      {label}
      <ChevronRight size={12} />
    </button>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────
function SideLabel({ children }) {
  return (
    <div style={{ fontFamily: FM, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '8px', marginTop: '16px' }}>
      {children}
    </div>
  )
}

// ─── Empty active paths panel ─────────────────────────────────────────────────
function EmptyPaths({ onBrowse, onROI }) {
  return (
    <div style={{ padding: '32px 0' }}>
      <h2 style={{ fontFamily: FH, fontSize: '20px', fontWeight: '700', color: 'var(--text)', margin: '0 0 8px' }}>No active certification paths yet</h2>
      <p style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-3)', margin: '0 0 24px', maxWidth: '480px', lineHeight: 1.6 }}>
        Start by exploring certifications on Cert Radar, or run an ROI analysis to find your best path.
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={onBrowse}
          style={{
            padding: '10px 20px', borderRadius: '8px',
            background: 'var(--text)', color: 'var(--bg)',
            border: 'none', cursor: 'pointer',
            fontFamily: FH, fontSize: '13px', fontWeight: '700',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          Browse Cert Radar
        </button>
        <button
          onClick={onROI}
          style={{
            padding: '10px 20px', borderRadius: '8px',
            background: 'transparent', color: 'var(--text)',
            border: '1px solid var(--border)', cursor: 'pointer',
            fontFamily: FH, fontSize: '13px', fontWeight: '600',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)' }}
        >
          ROI Calculator
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const certName    = useJourneyStore(s => s.certName)
  const resumeName  = useJourneyStore(s => s.resumeName)
  const resumeCity  = useJourneyStore(s => s.resumeCity)
  const breakEvenMonths = 6

  const [activeSection, setActiveSection] = useState('active-paths')

  const SECTIONS = [
    { id: 'active-paths',  label: 'Active Paths' },
    { id: 'study-tracker', label: 'Study Tracker' },
    { id: 'target',        label: 'Target Profiles' },
    { id: 'milestones',    label: 'Milestone Moats' },
    { id: 'saved',         label: 'Saved Future Explorations' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingTop: '64px' }}>

      {/* ── Page header ── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={{ fontFamily: FM, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '6px' }}>CAREER TOOLS</div>
        <h1 style={{ fontFamily: FH, fontSize: '32px', fontWeight: '700', color: 'var(--text)', margin: 0 }}>
          {resumeName ? `${resumeName.split(' ')[0]}'s` : 'Your'} workspace
        </h1>
        {resumeCity && (
          <div style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-3)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MapPin size={12} /> {resumeCity}
          </div>
        )}
      </div>

      {/* ── 3-column layout ── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 24px 80px', display: 'grid', gridTemplateColumns: '200px 1fr 280px', gap: '24px', alignItems: 'start' }}>

        {/* ── LEFT: sidebar nav ── */}
        <div style={{ position: 'sticky', top: '80px' }}>
          {/* User card */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '14px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '9px',
              background: 'var(--accent)', color: 'var(--bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FH, fontWeight: '800', fontSize: '16px', flexShrink: 0,
            }}>
              {(resumeName || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontFamily: FH, fontSize: '13px', fontWeight: '700', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {resumeName || 'Your workspace'}
              </div>
              <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)' }}>Career Tools</div>
            </div>
          </div>

          {/* Nav items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {SECTIONS.map(s => (
              <NavItem key={s.id} label={s.label} active={activeSection === s.id} onClick={() => setActiveSection(s.id)} />
            ))}
          </div>
        </div>

        {/* ── CENTRE: main content ── */}
        <div style={{ minWidth: 0 }}>
          {/* Section heading */}
          <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
            <h2 style={{ fontFamily: FH, fontSize: '22px', fontWeight: '700', color: 'var(--text)', margin: 0 }}>
              {SECTIONS.find(s => s.id === activeSection)?.label}
            </h2>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

              {/* Active Paths */}
              {activeSection === 'active-paths' && (
                certName ? (
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <Award size={18} color="var(--accent)" />
                      <div style={{ fontFamily: FH, fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>{certName}</div>
                      <span style={{ marginLeft: 'auto', fontFamily: FM, fontSize: '10px', padding: '3px 8px', borderRadius: '99px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>Active</span>
                    </div>
                    <div style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.6 }}>
                      Break-even in <strong style={{ color: 'var(--text)', fontFamily: FM }}>{breakEvenMonths} months</strong>
                      {resumeCity && <> · {resumeCity} market</>}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                      <button
                        onClick={() => setActiveSection('study-tracker')}
                        style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--accent)', color: 'var(--bg)', border: 'none', cursor: 'pointer', fontFamily: FH, fontSize: '12px', fontWeight: '700' }}
                      >
                        Open Study Tracker
                      </button>
                      <button
                        onClick={() => router.push('/')}
                        style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: FH, fontSize: '12px' }}
                      >
                        Recalculate ROI
                      </button>
                    </div>
                  </div>
                ) : (
                  <EmptyPaths onBrowse={() => router.push('/cert-radar')} onROI={() => router.push('/')} />
                )
              )}

              {/* Study Tracker */}
              {activeSection === 'study-tracker' && (
                certName ? (
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                    <BurnRate certName={certName} breakEvenMonths={breakEvenMonths} />
                  </div>
                ) : (
                  <EmptyPaths onBrowse={() => router.push('/cert-radar')} onROI={() => router.push('/')} />
                )
              )}

              {/* Target Profiles */}
              {activeSection === 'target' && (
                <div>
                  <p style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-3)', marginBottom: '20px', lineHeight: 1.6 }}>
                    Save job profiles you're targeting — salary, role, company tier — to benchmark your cert journey against real offers.
                  </p>
                  <button
                    onClick={() => router.push('/offer-analysis')}
                    style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--text)', color: 'var(--bg)', border: 'none', cursor: 'pointer', fontFamily: FH, fontSize: '13px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <FileSearch size={14} /> Analyze an Offer Letter
                  </button>
                </div>
              )}

              {/* Milestone Moats */}
              {activeSection === 'milestones' && (
                <div>
                  <p style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-3)', marginBottom: '16px', lineHeight: 1.6 }}>
                    Track the certifications and skills that build your long-term career moat.
                  </p>
                  {certName ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        { label: `Complete ${certName}`, done: false },
                        { label: 'Score 80%+ on mock exam', done: false },
                        { label: 'Apply to 3 roles after certification', done: false },
                        { label: 'Negotiate using market data', done: false },
                      ].map((m, i) => (
                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent' }}>
                          <input type="checkbox" defaultChecked={m.done} style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }} />
                          <span style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text)' }}>{m.label}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <EmptyPaths onBrowse={() => router.push('/cert-radar')} onROI={() => router.push('/')} />
                  )}
                </div>
              )}

              {/* Saved Future Explorations */}
              {activeSection === 'saved' && (
                <div>
                  <p style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-3)', marginBottom: '16px', lineHeight: 1.6 }}>
                    Certs you've bookmarked for later. Use Cert Radar to explore and save more.
                  </p>
                  <div style={{ padding: '32px', border: '1px dashed var(--border)', borderRadius: '10px', textAlign: 'center', color: 'var(--text-4)', fontFamily: FB, fontSize: '13px' }}>
                    No saved certs yet.
                  </div>
                  <button
                    onClick={() => router.push('/cert-radar')}
                    style={{ marginTop: '16px', padding: '10px 20px', borderRadius: '8px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: FH, fontSize: '13px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Compass size={14} /> Browse Cert Radar
                  </button>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── RIGHT: stats sidebar ── */}
        <div style={{ position: 'sticky', top: '80px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column' }}>

          <SideLabel>Milestone Moats</SideLabel>
          <div style={{ fontFamily: FH, fontSize: '28px', fontWeight: '800', color: 'var(--text)', lineHeight: 1 }}>{certName ? 1 : 0}</div>
          <div style={{ fontFamily: FB, fontSize: '12px', color: 'var(--text-3)', marginTop: '4px', marginBottom: '4px' }}>active cert paths tracked!</div>

          <SideLabel>Quick Actions</SideLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ActionBtn label="Run ROI Calculator" onClick={() => router.push('/')} />
            <ActionBtn label="Cert Radar" onClick={() => router.push('/cert-radar')} />
            <ActionBtn label="Market Pulse" onClick={() => router.push('/market-pulse')} />
            <ActionBtn label="Analyze Offer Letter" onClick={() => router.push('/offer-analysis')} />
          </div>

          <SideLabel>Saved Future Explorations</SideLabel>
          <div style={{ fontFamily: FB, fontSize: '12px', color: 'var(--text-4)', padding: '10px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', textAlign: 'center' }}>
            No saved certs yet
          </div>

          {certName && (
            <>
              <SideLabel>Current Path</SideLabel>
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: FH, fontSize: '12px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>{certName}</div>
                <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-3)' }}>Break-even: {breakEvenMonths} months</div>
              </div>
            </>
          )}
        </div>

      </div>

      <MarketingFooter />
    </div>
  )
}
