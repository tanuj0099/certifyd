import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase.js'
import { upsertUserProfile } from '../services/userProfileService.js'
import { useAuth } from '../hooks/useAuth.jsx'

const FS = "'Inter', 'DM Sans', sans-serif"
const FM = "'JetBrains Mono', 'IBM Plex Mono', monospace"

const AVATAR_COLORS = [
  { bg: '#1a2e1a', text: '#2db87a' },
  { bg: '#1a1a2e', text: '#7c6af4' },
  { bg: '#2e1a1a', text: '#f47c6a' },
  { bg: '#2e261a', text: '#f4c06a' },
  { bg: '#1a2a2e', text: '#6ab8f4' },
]

const CAREER_FOCUSES = [
  'Student',
  'Software Engineer',
  'Cloud & DevOps Engineer',
  'Data Analyst',
  'Product Manager',
  'Finance Professional',
  'Cybersecurity Analyst',
]

const CITIES = [
  'Bangalore',
  'Mumbai',
  'Delhi NCR',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Kolkata',
  'Remote',
]

const TARGET_DOMAINS = [
  'Cloud & DevOps',
  'Data & Analytics',
  'Cybersecurity',
  'Software Engineering',
  'Product Management',
  'Finance & Accounting',
  'AI / Machine Learning',
  'Networking',
]

function slugify(str) {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function StepIndicator({ current, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '36px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: i === current ? '28px' : '8px',
            height: '8px',
            borderRadius: '999px',
            background: i === current ? '#f4f5f8' : i < current ? '#2db87a' : 'rgba(255,255,255,0.12)',
            transition: 'all 0.3s ease',
          }} />
        </div>
      ))}
    </div>
  )
}

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Step 1 state
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceSlug, setWorkspaceSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)

  // Step 2 state
  const [careerFocus, setCareerFocus] = useState('')
  const [city, setCity] = useState('Bangalore')
  const [currentSalary, setCurrentSalary] = useState('')
  const [targetDomain, setTargetDomain] = useState('')

  // Step 3 — avatar is derived from user name / email
  const initials = (() => {
    if (!user) return '?'
    const name = user.displayName || user.email || ''
    const parts = name.split(/[\s@]/)
    return parts[0]?.[0]?.toUpperCase() || '?'
  })()

  const avatarColor = AVATAR_COLORS[(initials.charCodeAt(0) || 0) % AVATAR_COLORS.length]

  // Auto-derive slug from workspace name unless user manually edited it
  useEffect(() => {
    if (!slugManual) {
      setWorkspaceSlug(slugify(workspaceName))
    }
  }, [workspaceName, slugManual])

  // Prefill workspace name from user metadata
  useEffect(() => {
    if (user && !workspaceName) {
      const name = user.displayName || ''
      if (name) setWorkspaceName(name)
    }
  }, [user])

  async function handleComplete() {
    setSubmitting(true)
    setError('')
    try {
      const { data: { user: activeUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !activeUser) {
        console.error("Auth state missing inside onboarding dispatcher")
        setError('No authenticated session found. Please sign in again.')
        return
      }

      const provider = activeUser.app_metadata?.provider || 'password'

      // Upsert into user_profiles via the service
      await upsertUserProfile(activeUser, {
        email: activeUser.email || user?.email || '',
        full_name: workspaceName.trim() || activeUser.user_metadata?.full_name || user?.displayName || '',
        avatar_url: activeUser.user_metadata?.avatar_url || user?.photoURL || '',
        job_role: careerFocus || 'Student',
        city: city || 'Bangalore',
        current_salary: currentSalary ? Number(currentSalary) : null,
        target_domain: targetDomain || '',
        provider,
      })

      // Also upsert into profiles table for onboarding gate compatibility
      if (supabase) {
        const profileData = {
          id: user.uid,
          email: user.email,
          workspace_name: workspaceName.trim() || 'My Workspace',
          workspace_slug: workspaceSlug.trim() || slugify(workspaceName) || activeUser.id,
          career_focus: careerFocus || 'Student',
          city: city || 'Bangalore',
          avatar_initials: initials,
          onboarding_complete: true,
          updated_at: new Date().toISOString(),
        }
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData, { onConflict: 'id' })
        if (profileError) console.warn('profiles upsert warning:', profileError.message)
      }

      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('Onboarding save failed:', err)
      setError(err?.message || 'Failed to save profile. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const canAdvanceStep0 = workspaceName.trim().length >= 2 && /^[a-z0-9-]+$/.test(workspaceSlug)
  const canAdvanceStep1 = !!careerFocus && !!targetDomain && !!city && (!currentSalary || (Number(currentSalary) > 0 && Number(currentSalary) < 100000000))

  return (
    <div className="min-h-screen bg-white dark:bg-[#010102] transition-colors flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[480px]">

        {/* Brand mark */}
        <div className="text-center mb-10">
          <div className="font-mono text-[11px] text-zinc-500 dark:text-white/30 tracking-[0.22em] uppercase mb-2">
            Certify
          </div>
          <div className="font-sans text-[22px] font-extrabold text-zinc-900 dark:text-[#f4f5f8] tracking-tight">
            Set up your workspace
          </div>
          <div className="font-sans text-[13px] text-zinc-500 dark:text-white/40 mt-1.5">
            Takes under 60 seconds
          </div>
        </div>

        <StepIndicator current={step} total={3} />

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="bg-zinc-50 dark:bg-[#0d0d10] border border-zinc-200 dark:border-white/[0.08] rounded-[20px] p-8"
          >
            {/* ── STEP 0: Workspace creation ────────────────────── */}
            {step === 0 && (
              <>
                <div className="font-mono text-[9px] text-zinc-500 dark:text-white/30 tracking-[0.2em] uppercase mb-5">
                  Step 1 of 3 — Workspace
                </div>
                <h2 className="m-0 mb-2 text-[18px] font-extrabold text-zinc-900 dark:text-[#f4f5f8] tracking-tight">
                  Name your workspace
                </h2>
                <p className="m-0 mb-7 text-[13px] text-zinc-600 dark:text-white/40 leading-[1.6]">
                  This is your personal career tracking hub. You can always change it later.
                </p>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: FM, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Workspace Name
                  </label>
                  <input
                    autoFocus
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="e.g. Tanuj's Career Hub"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.04)',
                      color: '#f4f5f8',
                      fontFamily: FS, fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: FM, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Workspace URL
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                    <span style={{ padding: '12px 10px 12px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.25)', fontFamily: FM, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      certifyroi.in/ws/
                    </span>
                    <input
                      value={workspaceSlug}
                      onChange={(e) => { setSlugManual(true); setWorkspaceSlug(slugify(e.target.value)) }}
                      placeholder="your-slug"
                      style={{
                        flex: 1, border: 'none', background: 'transparent',
                        color: '#f4f5f8', fontFamily: FM, fontSize: '13px',
                        outline: 'none', padding: '12px 14px 12px 0',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '28px', fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontFamily: FM }}>
                  Asia (Mumbai) · UTC+5:30
                </div>

                <button
                  onClick={() => setStep(1)}
                  disabled={!canAdvanceStep0}
                  style={{
                    width: '100%', padding: '13px', borderRadius: '10px',
                    background: canAdvanceStep0 ? '#f4f5f8' : 'rgba(255,255,255,0.06)',
                    color: canAdvanceStep0 ? '#010102' : 'rgba(255,255,255,0.25)',
                    border: 'none', fontFamily: FS, fontSize: '14px',
                    fontWeight: 800, cursor: canAdvanceStep0 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.18s ease',
                  }}
                >
                  Continue →
                </button>
              </>
            )}

            {/* ── STEP 1: Career focus + domain + salary ────────────── */}
            {step === 1 && (
              <>
                <div style={{ fontFamily: FM, fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px' }}>
                  Step 2 of 3 — Career Focus
                </div>
                <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#f4f5f8', letterSpacing: '-0.02em' }}>
                  What describes you best?
                </h2>
                <p style={{ margin: '0 0 24px', fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                  We use this to tailor cert recommendations and salary benchmarks.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                  {CAREER_FOCUSES.map((focus) => (
                    <button
                      key={focus}
                      onClick={() => setCareerFocus(focus)}
                      style={{
                        padding: '8px 14px', borderRadius: '999px',
                        border: careerFocus === focus ? '1px solid #f4f5f8' : '1px solid rgba(255,255,255,0.1)',
                        background: careerFocus === focus ? '#f4f5f8' : 'transparent',
                        color: careerFocus === focus ? '#010102' : 'rgba(255,255,255,0.6)',
                        fontFamily: FS, fontSize: '13px', fontWeight: careerFocus === focus ? 700 : 500,
                        cursor: 'pointer', transition: 'all 0.15s ease',
                      }}
                    >
                      {focus}
                    </button>
                  ))}
                </div>

                {/* Target Domain */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: FM, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Target Domain
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {TARGET_DOMAINS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setTargetDomain(d)}
                        style={{
                          padding: '6px 12px', borderRadius: '999px',
                          border: targetDomain === d ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
                          background: targetDomain === d ? 'rgba(255,255,255,0.08)' : 'transparent',
                          color: targetDomain === d ? '#f4f5f8' : 'rgba(255,255,255,0.4)',
                          fontFamily: FS, fontSize: '12px', fontWeight: targetDomain === d ? 700 : 400,
                          cursor: 'pointer', transition: 'all 0.15s ease',
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Base City */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: FM, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Base City
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {CITIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCity(c)}
                        style={{
                          padding: '6px 12px', borderRadius: '999px',
                          border: city === c ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
                          background: city === c ? 'rgba(255,255,255,0.08)' : 'transparent',
                          color: city === c ? '#f4f5f8' : 'rgba(255,255,255,0.4)',
                          fontFamily: FS, fontSize: '12px', fontWeight: city === c ? 700 : 400,
                          cursor: 'pointer', transition: 'all 0.15s ease',
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Salary */}
                <div style={{ marginBottom: '28px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: FM, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Current Annual Salary (INR, optional)
                  </label>
                  <input
                    type="number"
                    value={currentSalary}
                    onChange={(e) => setCurrentSalary(e.target.value)}
                    placeholder="e.g. 800000"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.04)',
                      color: '#f4f5f8',
                      fontFamily: FM, fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                  <button
                    onClick={() => setStep(0)}
                    style={{
                      padding: '13px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.5)', fontFamily: FS, fontSize: '14px',
                      fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!canAdvanceStep1}
                    style={{
                      padding: '13px', borderRadius: '10px',
                      background: canAdvanceStep1 ? '#f4f5f8' : 'rgba(255,255,255,0.06)',
                      color: canAdvanceStep1 ? '#010102' : 'rgba(255,255,255,0.25)',
                      border: 'none', fontFamily: FS, fontSize: '14px',
                      fontWeight: 800, cursor: canAdvanceStep1 ? 'pointer' : 'not-allowed',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    Continue →
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 2: Avatar confirmation ───────────────────── */}
            {step === 2 && (
              <>
                <div style={{ fontFamily: FM, fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px' }}>
                  Step 3 of 3 — Your Profile
                </div>
                <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#f4f5f8', letterSpacing: '-0.02em' }}>
                  Your workspace is ready
                </h2>
                <p style={{ margin: '0 0 32px', fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                  Review your setup and launch your career hub.
                </p>

                {/* Avatar block */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
                    background: avatarColor.bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '22px', fontWeight: 800,
                    color: avatarColor.text, fontFamily: FS,
                  }}>
                    {initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#f4f5f8', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {workspaceName || 'My Workspace'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: FM, letterSpacing: '0.06em' }}>
                      certifyroi.in/ws/{workspaceSlug || 'workspace'}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div style={{ display: 'grid', gap: '8px', marginBottom: '28px' }}>
                  {[
                    { label: 'Focus', value: careerFocus || '—' },
                    { label: 'Target Domain', value: targetDomain || '—' },
                    { label: 'City', value: city || '—' },
                    { label: 'Current Salary', value: currentSalary ? `₹${Number(currentSalary).toLocaleString('en-IN')}` : 'Not provided' },
                    { label: 'Email', value: user?.email || '—' },
                    { label: 'Provider', value: user?.providerData?.[0]?.providerId || 'password' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '9px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: FM, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
                      <span style={{ fontSize: '13px', color: '#f4f5f8', fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                </div>

                {error && (
                  <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '9px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '13px', lineHeight: 1.5 }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                  <button
                    onClick={() => setStep(1)}
                    style={{
                      padding: '13px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.5)', fontFamily: FS, fontSize: '14px',
                      fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={submitting}
                    style={{
                      padding: '13px', borderRadius: '10px',
                      background: submitting ? 'rgba(45,184,122,0.3)' : '#2db87a',
                      color: submitting ? 'rgba(255,255,255,0.5)' : '#010102',
                      border: 'none', fontFamily: FS, fontSize: '14px',
                      fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    {submitting ? 'Saving…' : 'Launch my workspace →'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
