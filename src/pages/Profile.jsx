import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Save, ShieldCheck, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'
import { fetchUserProfile, upsertUserProfile } from '../services/userProfileService.js'
import { MarketingFooter } from '../components/MarketingPageShell.jsx'

const F_SANS = "'Inter', 'DM Sans', sans-serif"
const F_MONO = "'JetBrains Mono', 'IBM Plex Mono', monospace"

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <label style={{ display: 'grid', gap: '8px' }}>
      <span style={{ color: 'var(--text-4)', fontFamily: F_MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{
          minHeight: '46px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--text)',
          padding: '0 14px',
          fontFamily: F_SANS,
          fontSize: '14px',
          outline: 'none',
        }}
      />
    </label>
  )
}

export default function ProfilePage() {
  const { user, loading, signInGoogle, signOut } = useAuth()
  const [profile, setProfile] = useState({
    full_name: '',
    city: '',
    current_role: '',
    current_salary: '',
    target_domain: '',
  })
  const [syncState, setSyncState] = useState('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      if (!user) return
      setSyncState('loading')
      setMessage('')
      try {
        const saved = await fetchUserProfile(user.uid)
        if (cancelled) return
        setProfile({
          full_name: saved?.full_name || user.displayName || '',
          city: saved?.city || '',
          current_role: saved?.current_role || '',
          current_salary: saved?.current_salary || '',
          target_domain: saved?.target_domain || '',
        })
        setSyncState('ready')
      } catch (error) {
        if (cancelled) return
        setProfile((prev) => ({ ...prev, full_name: user.displayName || prev.full_name }))
        setSyncState('error')
        setMessage(error?.message || 'Could not read Supabase profile yet.')
      }
    }

    loadProfile()
    return () => {
      cancelled = true
    }
  }, [user])

  async function handleSave(event) {
    event.preventDefault()
    if (!user) return
    setSyncState('saving')
    setMessage('')
    try {
      await upsertUserProfile(user, profile)
      setSyncState('ready')
      setMessage('Profile synced to Supabase.')
    } catch (error) {
      setSyncState('error')
      setMessage(error?.message || 'Could not sync profile to Supabase.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <main style={{ width: 'min(100%, 1120px)', margin: '0 auto', padding: '128px 24px 72px' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
          <div style={{ maxWidth: '680px', marginBottom: '42px' }}>
            <p style={{ margin: '0 0 12px', color: 'var(--text-4)', fontFamily: F_MONO, fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              Account surface
            </p>
            <h1 style={{ margin: 0, color: 'var(--text)', fontFamily: F_SANS, fontSize: '36px', lineHeight: 1.08, letterSpacing: 0, fontWeight: 900 }}>
              Profile and preferences
            </h1>
            <p style={{ margin: '14px 0 0', color: 'var(--text-2)', fontFamily: F_SANS, fontSize: '15px', lineHeight: 1.75 }}>
              Firebase handles authentication. This page syncs user details and career preferences into Supabase so your admin view can see who is using CertifyROI.
            </p>
          </div>

          {!user && !loading ? (
            <section style={{ borderTop: '1px solid var(--border)', paddingTop: '28px', maxWidth: '620px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <User size={20} />
                <h2 style={{ margin: 0, fontFamily: F_SANS, fontSize: '20px', letterSpacing: 0 }}>Sign in required</h2>
              </div>
              <p style={{ margin: '0 0 22px', color: 'var(--text-2)', fontFamily: F_SANS, fontSize: '14px', lineHeight: 1.7 }}>
                Sign in to create or update your Supabase-backed profile.
              </p>
              <button
                type="button"
                onClick={signInGoogle}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  minHeight: '48px',
                  padding: '0 22px',
                  borderRadius: '999px',
                  border: '1px solid var(--text)',
                  background: 'var(--text)',
                  color: 'var(--bg)',
                  fontFamily: F_SANS,
                  fontSize: '13px',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                Continue with Google <ArrowRight size={15} />
              </button>
            </section>
          ) : null}

          {user ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '34px', alignItems: 'start' }} className="profile-grid">
              <form onSubmit={handleSave} style={{ display: 'grid', gap: '18px', borderTop: '1px solid var(--border)', paddingTop: '26px' }}>
                <Field label="Full name" value={profile.full_name} onChange={(value) => setProfile((prev) => ({ ...prev, full_name: value }))} placeholder="Your name" />
                <Field label="City" value={profile.city} onChange={(value) => setProfile((prev) => ({ ...prev, city: value }))} placeholder="Bangalore" />
                <Field label="Current role" value={profile.current_role} onChange={(value) => setProfile((prev) => ({ ...prev, current_role: value }))} placeholder="Product analyst" />
                <Field label="Current salary INR" type="number" value={profile.current_salary} onChange={(value) => setProfile((prev) => ({ ...prev, current_salary: value }))} placeholder="1200000" />
                <Field label="Target domain" value={profile.target_domain} onChange={(value) => setProfile((prev) => ({ ...prev, target_domain: value }))} placeholder="Cloud, Data, Finance..." />

                {message ? (
                  <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', color: syncState === 'error' ? '#FCA5A5' : 'var(--text-2)', fontFamily: F_SANS, fontSize: '13px', lineHeight: 1.5 }}>
                    {message}
                  </div>
                ) : null}

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    disabled={syncState === 'saving'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '9px',
                      minHeight: '48px',
                      padding: '0 22px',
                      borderRadius: '999px',
                      border: '1px solid var(--text)',
                      background: 'var(--text)',
                      color: 'var(--bg)',
                      fontFamily: F_SANS,
                      fontSize: '13px',
                      fontWeight: 900,
                      cursor: syncState === 'saving' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Save size={15} />
                    {syncState === 'saving' ? 'Syncing...' : 'Save Profile'}
                  </button>
                  <button
                    type="button"
                    onClick={signOut}
                    style={{
                      minHeight: '48px',
                      padding: '0 22px',
                      borderRadius: '999px',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text)',
                      fontFamily: F_SANS,
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </form>

              <aside style={{ borderTop: '1px solid var(--border)', paddingTop: '26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <ShieldCheck size={18} />
                  <h2 style={{ margin: 0, fontFamily: F_SANS, fontSize: '18px', letterSpacing: 0 }}>Account state</h2>
                </div>
                {[
                  ['Email', user.email || 'Not available'],
                  ['Firebase UID', user.uid],
                  ['Provider', user.providerData?.[0]?.providerId || 'password'],
                  ['Supabase', syncState === 'ready' ? 'Connected' : syncState],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: '14px 0', borderTop: '1px solid var(--border)' }}>
                    <div style={{ color: 'var(--text-4)', fontFamily: F_MONO, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
                    <div style={{ color: 'var(--text-2)', fontFamily: F_SANS, fontSize: '13px', lineHeight: 1.5, wordBreak: 'break-word' }}>{value}</div>
                  </div>
                ))}
              </aside>
            </div>
          ) : null}
        </motion.div>
      </main>
      <MarketingFooter />
    </div>
  )
}
