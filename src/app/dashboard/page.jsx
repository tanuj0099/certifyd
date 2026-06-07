'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useJourneyStore } from '@/store/useJourneyStore.js'
import BurnRate from '@/components/BurnRate.jsx'
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx'
import {
  BookOpen, TrendingUp, Target, Clock, CheckCircle2,
  ArrowRight, Award, BarChart2, Zap, Calendar, MapPin,
  ChevronRight, Flame, Brain, FileText
} from 'lucide-react'

const FH = "var(--font-head)";
const FM = "var(--font-mono)";
const FB = "var(--font-body)";

function StatCard({ icon: Icon, label, value, accent = false }) {
  return (
    <div style={{
      background: accent ? 'var(--accent)' : 'var(--bg-surface)',
      border: `1px solid ${accent ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size={16} color={accent ? 'var(--bg)' : 'var(--text-3)'} />
        <span style={{ fontFamily: FM, fontSize: '10px', color: accent ? 'var(--bg)' : 'var(--text-3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: FH, fontSize: '28px', fontWeight: '700', color: accent ? 'var(--bg)' : 'var(--text)', lineHeight: 1 }}>
        {value}
      </div>
    </div>
  )
}

function QuickLink({ icon: Icon, label, href, desc }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(href)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px', borderRadius: '12px', width: '100%',
        background: 'transparent', border: '1px solid var(--border)',
        cursor: 'pointer', transition: 'all 0.2s',
        textAlign: 'left',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-surface)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px',
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={16} color="var(--text-2)" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: FH, fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{label}</div>
        <div style={{ fontFamily: FB, fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{desc}</div>
      </div>
      <ChevronRight size={14} color="var(--text-4)" />
    </button>
  )
}

function StudyStreakWidget({ certName }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const studied = [true, true, false, true, true, false, false] // mock data

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Flame size={16} color="#f97316" />
        <span style={{ fontFamily: FH, fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>Study Streak</span>
        <span style={{
          marginLeft: 'auto', fontFamily: FM, fontSize: '11px',
          background: 'var(--bg)', border: '1px solid var(--border)',
          padding: '2px 8px', borderRadius: '99px', color: 'var(--text-3)'
        }}>This week</span>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {days.map((day, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              width: '100%', aspectRatio: '1', borderRadius: '8px', marginBottom: '6px',
              background: studied[i] ? 'var(--accent)' : 'var(--bg)',
              border: `1px solid ${studied[i] ? 'var(--accent)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {studied[i] && <CheckCircle2 size={12} color="var(--bg)" />}
            </div>
            <span style={{ fontFamily: FM, fontSize: '9px', color: 'var(--text-4)' }}>{day}</span>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: FB, fontSize: '12px', color: 'var(--text-3)' }}>
        <span style={{ color: '#f97316', fontWeight: '700' }}>4 day</span> streak · Keep it up to hit your exam date!
      </div>
    </div>
  )
}

function ExamCountdown({ certName }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Calendar size={16} color="var(--text-3)" />
        <span style={{ fontFamily: FH, fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>Exam Countdown</span>
      </div>
      <div style={{ fontFamily: FH, fontSize: '36px', fontWeight: '800', color: 'var(--accent)', lineHeight: 1 }}>
        47
        <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-3)', marginLeft: '6px' }}>days left</span>
      </div>
      <div style={{ fontFamily: FB, fontSize: '12px', color: 'var(--text-3)', marginTop: '8px' }}>
        At current pace · ~2hr/day needed
      </div>
      <div style={{ marginTop: '14px', background: 'var(--bg)', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
        <div style={{ width: '38%', height: '100%', background: 'var(--accent)', borderRadius: '99px', transition: 'width 1s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        <span style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)' }}>38% prepared</span>
        <span style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)' }}>Target: 80%</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const certName = useJourneyStore(s => s.certName)
  const resumeCity = useJourneyStore(s => s.resumeCity)
  const resumeName = useJourneyStore(s => s.resumeName)
  const breakEvenMonths = 6

  if (!certName) {
    return (
      <ToolPageWrapper title="Your" subtitle="Dashboard" description="Track your certification progress and career ROI." footer={true} showFeedback={false}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', textAlign: 'center',
          padding: '60px 24px', gap: '16px'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Award size={28} color="var(--text-3)" />
          </div>
          <div>
            <h2 style={{ fontFamily: FH, fontSize: '22px', color: 'var(--text)', margin: '0 0 8px' }}>No certification selected yet</h2>
            <p style={{ fontFamily: FB, fontSize: '14px', color: 'var(--text-3)', margin: 0, maxWidth: '360px' }}>
              Use the ROI Calculator to pick a cert and your dashboard will populate automatically.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '12px 24px', borderRadius: '10px',
                background: 'var(--accent)', color: 'var(--bg)',
                border: 'none', cursor: 'pointer',
                fontFamily: FH, fontWeight: '700', fontSize: '14px',
                display: 'inline-flex', alignItems: 'center', gap: '8px'
              }}
            >
              <TrendingUp size={15} /> ROI Calculator <ArrowRight size={14} />
            </button>
            <button
              onClick={() => router.push('/offer-analysis')}
              style={{
                padding: '12px 24px', borderRadius: '10px',
                background: 'transparent', color: 'var(--text)',
                border: '1px solid var(--border)', cursor: 'pointer',
                fontFamily: FH, fontWeight: '600', fontSize: '14px',
                display: 'inline-flex', alignItems: 'center', gap: '8px'
              }}
            >
              <Brain size={15} /> Analyze an Offer
            </button>
          </div>

          {/* Preview cards */}
          <div style={{
            marginTop: '32px', width: '100%', maxWidth: '800px',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px',
          }}>
            {[
              { icon: TrendingUp, label: 'Break-even Months', preview: '—' },
              { icon: Clock, label: 'Salary Boost', preview: '—' },
              { icon: Flame, label: 'Study Streak', preview: '0 days' },
              { icon: Target, label: 'Exam Readiness', preview: '—' },
            ].map(({ icon: Icon, label, preview }) => (
              <div key={label} style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: '16px', padding: '20px', opacity: 0.5,
              }}>
                <Icon size={18} color="var(--text-4)" style={{ marginBottom: '8px' }} />
                <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontFamily: FH, fontSize: '22px', fontWeight: '700', color: 'var(--text-3)' }}>{preview}</div>
              </div>
            ))}
          </div>
        </div>
      </ToolPageWrapper>
    )
  }

  return (
    <ToolPageWrapper
      title={resumeName ? `${resumeName.split(' ')[0]}'s` : "Study"}
      subtitle="Dashboard"
      description={`Tracking your journey to ${certName}${resumeCity ? ` · ${resumeCity}` : ''}`}
      footer={true}
      showFeedback={false}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <StatCard icon={Award} label="Target Cert" value={certName.split(' ').slice(0, 2).join(' ')} />
          <StatCard icon={Clock} label="Break-even" value={`${breakEvenMonths}mo`} accent />
          <StatCard icon={TrendingUp} label="ROI Gain" value="+28%" />
          <StatCard icon={MapPin} label="Location" value={resumeCity || 'India'} />
        </div>

        {/* Main 3-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 320px', gap: '24px', alignItems: 'start' }}>

          {/* LEFT: BurnRate / ROI Engine */}
          <div style={{ gridColumn: '1 / 3', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <BurnRate certName={certName} breakEvenMonths={breakEvenMonths} />
            </motion.div>

            {/* Study streak */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
              <StudyStreakWidget certName={certName} />
            </motion.div>
          </div>

          {/* RIGHT: Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
              <ExamCountdown certName={certName} />
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}
            >
              <div style={{ fontFamily: FH, fontSize: '14px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px' }}>Quick Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <QuickLink icon={TrendingUp} label="ROI Calculator" desc="Recalculate with updated salary" href="/" />
                <QuickLink icon={BarChart2} label="City Demand" desc={`See ${certName} demand heatmap`} href="/" />
                <QuickLink icon={Brain} label="Offer Analyzer" desc="Benchmark a job offer" href="/offer-analysis" />
                <QuickLink icon={FileText} label="Resume Analyzer" desc="Get cert recommendations" href="/" />
              </div>
            </motion.div>

            {/* Next milestone */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Zap size={15} color="var(--accent)" />
                <span style={{ fontFamily: FH, fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>Next Milestone</span>
              </div>
              {[
                { label: 'Complete Domain 1', done: true },
                { label: 'Mock Test 1 (>70%)', done: false },
                { label: 'Book exam slot', done: false },
              ].map((m, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 0',
                  borderBottom: i < 2 ? '1px solid var(--border)' : 'none'
                }}>
                  <CheckCircle2 size={14} color={m.done ? 'var(--accent)' : 'var(--border)'} />
                  <span style={{
                    fontFamily: FB, fontSize: '13px',
                    color: m.done ? 'var(--text-3)' : 'var(--text)',
                    textDecoration: m.done ? 'line-through' : 'none',
                  }}>{m.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </ToolPageWrapper>
  )
}
