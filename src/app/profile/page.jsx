'use client';

import { useEffect, useState } from 'react'
import { Save, Send, Sparkles, Trash2, Ban } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useTheme } from '@/hooks/useTheme.jsx'
import { supabase } from '@/lib/supabase.js'
import { fetchUserProfile, upsertUserProfile } from '@/services/userProfileService.js'
import { submitFeedback } from '@/services/feedbackService.js'
import DashboardShell, {
  DashPanel,
  DashField,
  DashInput,
  DashTextarea,
  DashButton,
} from '@/components/DashboardShell.jsx'
import { MarketingFooter } from '@/components/MarketingPageShell.jsx'

const TABS = [
  { id: 'preferences', label: 'Preferences' },
  { id: 'suggestions', label: 'Suggestions' },
  { id: 'account', label: 'Account' },
]

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const { mode, setThemeMode } = useTheme()
  const [activeTab, setActiveTab] = useState('preferences')
  const [profile, setProfile] = useState({
    full_name: '',
    city: '',
    job_role: '',
    current_salary: '',
    target_domain: '',
    notify_product_updates: true,
    notify_roi_alerts: false,
  })
  const [suggestion, setSuggestion] = useState({ subject: 'Product suggestion', message: '' })
  const [syncState, setSyncState] = useState('idle')
  const [message, setMessage] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      if (!user) return
      setSyncState('loading')
      setMessage('')
      try {
        const saved = await fetchUserProfile(user.uid)
        if (cancelled) return
        const prefs = saved?.preferences || {}
        setProfile({
          full_name: saved?.full_name || user.displayName || '',
          city: saved?.city || '',
          job_role: saved?.job_role || '',
          current_salary: saved?.current_salary ?? '',
          target_domain: saved?.target_domain || '',
          notify_product_updates: prefs.notify_product_updates !== false,
          notify_roi_alerts: Boolean(prefs.notify_roi_alerts),
        })
        setSyncState('ready')
      } catch (error) {
        if (cancelled) return
        setProfile((prev) => ({ ...prev, full_name: user.displayName || prev.full_name }))
        setSyncState('error')
        setMessage(error?.message || 'Could not load profile from Supabase.')
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
      await upsertUserProfile(user, {
        ...profile,
        preferences: {
          theme_mode: mode,
          notify_product_updates: profile.notify_product_updates,
          notify_roi_alerts: profile.notify_roi_alerts,
        },
      })
      setSyncState('ready')
      setMessage('Profile saved and synced to Supabase.')
    } catch (error) {
      setSyncState('error')
      setMessage(error?.message || 'Could not save profile.')
    }
  }

  async function handleExportData() {
    try {
      setSyncState('saving')
      const dataToExport = {
        user: {
          id: user.uid,
          email: user.email,
          provider: user.providerData?.[0]?.providerId || 'password',
        },
        profile,
        export_date: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certifyd-data-${user.uid}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setSyncState('ready')
      setMessage('Your data has been successfully downloaded.')
    } catch (error) {
      setSyncState('error')
      setMessage('Failed to export data.')
    }
  }

  async function handleSuggestion(event) {
    event.preventDefault()
    if (!user) return
    setSyncState('saving')
    setMessage('')
    try {
      await submitFeedback({
        name: profile.full_name || user.displayName || 'User',
        email: user.email,
        subject: suggestion.subject,
        message: suggestion.message,
        source: 'profile_dashboard',
      })
      setSuggestion({ subject: 'Product suggestion', message: '' })
      setSyncState('ready')
      setMessage('Thanks - your suggestion was sent to our team.')
    } catch (error) {
      setSyncState('error')
      setMessage(error?.message || 'Could not send suggestion.')
    }
  }

  return (
    <>
      <DashboardShell
        eyebrow="Your account"
        title={`Welcome${profile.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}`}
        subtitle="Manage career preferences, product settings, and feedback. Everything syncs to your Supabase profile."
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {message ? (
          <DashPanel>
            <p style={{ margin: 0, color: syncState === 'error' ? 'var(--err)' : 'var(--text-2)', fontSize: 14 }}>
              {message}
            </p>
          </DashPanel>
        ) : null}

        {activeTab === 'preferences' ? (
          <div className="profile-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 20 }}>
            <DashPanel>
              <form onSubmit={handleSave} style={{ display: 'grid', gap: 16 }}>
                <DashField label="Full name">
                  <DashInput value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} placeholder="Your name" />
                </DashField>
                <div className="dash-grid-2">
                  <DashField label="City">
                    <DashInput value={profile.city} onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))} placeholder="Bangalore" />
                  </DashField>
                  <DashField label="Current role">
                    <DashInput value={profile.job_role} onChange={(e) => setProfile((p) => ({ ...p, job_role: e.target.value }))} placeholder="Cloud engineer" />
                  </DashField>
                </div>
                <div className="dash-grid-2">
                  <DashField label="Current salary (INR / year)">
                    <DashInput type="number" value={profile.current_salary} onChange={(e) => setProfile((p) => ({ ...p, current_salary: e.target.value }))} placeholder="1200000" />
                  </DashField>
                  <DashField label="Target domain">
                    <DashInput value={profile.target_domain} onChange={(e) => setProfile((p) => ({ ...p, target_domain: e.target.value }))} placeholder="Cloud & DevOps" />
                  </DashField>
                </div>
                <DashButton type="submit" variant="primary" disabled={syncState === 'saving'}>
                  <Save size={15} />
                  {syncState === 'saving' ? 'Saving...' : 'Save preferences'}
                </DashButton>
              </form>
            </DashPanel>

            <DashPanel>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>Appearance</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  ['light', 'Light'],
                  ['dark', 'Dark'],
                  ['system', 'System'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setThemeMode(id)}
                    className={`dash-tab${mode === id ? ' dash-tab--active' : ''}`}
                    style={{ width: '100%', textAlign: 'center' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <h3 style={{ margin: '22px 0 12px', fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>Notifications</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, color: 'var(--text-2)', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={profile.notify_product_updates}
                  onChange={(e) => setProfile((p) => ({ ...p, notify_product_updates: e.target.checked }))}
                />
                Product updates & new tools
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-2)', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={profile.notify_roi_alerts}
                  onChange={(e) => setProfile((p) => ({ ...p, notify_roi_alerts: e.target.checked }))}
                />
                ROI alerts for saved certifications
              </label>
            </DashPanel>
          </div>
        ) : null}

        {activeTab === 'suggestions' ? (
          <DashPanel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Sparkles size={18} style={{ color: 'var(--text-3)' }} />
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Share feedback</h2>
            </div>
            <form onSubmit={handleSuggestion} style={{ display: 'grid', gap: 14, maxWidth: 640 }}>
              <DashField label="Subject">
                <DashInput value={suggestion.subject} onChange={(e) => setSuggestion((s) => ({ ...s, subject: e.target.value }))} />
              </DashField>
              <DashField label="Your suggestion">
                <DashTextarea
                  value={suggestion.message}
                  onChange={(e) => setSuggestion((s) => ({ ...s, message: e.target.value }))}
                  placeholder="Tell us what would make Certify more useful for your career decisions..."
                  required
                />
              </DashField>
              <DashButton type="submit" variant="primary" disabled={syncState === 'saving' || !suggestion.message.trim()}>
                <Send size={15} />
                Submit suggestion
              </DashButton>
            </form>
          </DashPanel>
        ) : null}

        {activeTab === 'account' ? (
          <DashPanel>
            <div style={{ display: 'grid', gap: 14, maxWidth: 520 }}>
              {[
                ['Email', user?.email],
                ['User ID', user?.uid],
                ['Provider', user?.providerData?.[0]?.providerId || 'password'],
                ['Supabase sync', syncState],
              ].map(([label, value]) => (
                <div key={label} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-3)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                    {label}
                  </div>
                  <div style={{ color: 'var(--text)', fontSize: 14, wordBreak: 'break-word' }}>{value}</div>
                </div>
              ))}
              <DashButton type="button" variant="ghost" onClick={signOut} style={{ marginTop: 8, width: 'fit-content' }}>
                Sign out
              </DashButton>

              <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Data Portability</h3>
                <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 12 }}>
                  You have the right to request a copy of your data. Download a JSON file containing your profile information and preferences.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={handleExportData}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
                      background: 'var(--bg)', color: 'var(--text)',
                      fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                    }}
                  >
                    <Save size={14} />
                    Download My Data
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!user) return;
                      setSyncState('saving')
                      setMessage('')
                      try {
                        const { error } = await supabase.from('user_profiles').update({
                          current_salary: null,
                          job_role: 'Consent Withdrawn',
                          technical_skills: [],
                          applied_projects: []
                        }).eq('user_id', user.uid || user.id);
                        if (error) throw error;
                        setSyncState('ready')
                        setMessage('Consent withdrawn. ROI and career data wiped.');
                      } catch (err) {
                        setSyncState('error')
                        setMessage('Failed to withdraw consent. Try again.');
                      }
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '8px 14px', borderRadius: 8, border: '1px solid var(--amber-500, #f59e0b)',
                      background: 'transparent', color: 'var(--amber-500, #f59e0b)',
                      fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                    }}
                  >
                    <Ban size={14} /> 
                    Withdraw Consent
                  </button>
                </div>
              </div>

              {/*  Secure Delete Account Cascade  */}
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--err)' }}>Danger Zone</h3>
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => { setConfirmDelete(true); setDeleteError('') }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(217,72,72,0.3)',
                      background: 'transparent', color: 'rgba(217,72,72,0.8)',
                      fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} />
                    Delete Account & Profile Context
                  </button>
                ) : (
                  <div style={{ padding: 16, borderRadius: 12, border: '1px solid rgba(217,72,72,0.4)', background: 'rgba(217,72,72,0.04)', display: 'grid', gap: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                      This will permanently flush your profile row from 'public.user_profiles', clear your localized storage tokens, and destroy your authentication record. This action cannot be undone.
                    </div>
                    {deleteError && (
                      <div style={{ fontSize: 12, color: 'var(--err)', lineHeight: 1.4 }}>{deleteError}</div>
                    )}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={async () => {
                          setDeleting(true)
                          setDeleteError('')
                          try {
                            const userId = user?.uid || user?.id
                            if (supabase && userId) {
                              // Call the secure soft-delete RPC
                              const { error: rpcError } = await supabase.rpc('soft_delete_user')
                              if (rpcError) throw rpcError
                            }
                            if (supabase) {
                              await supabase.auth.signOut()
                            }
                            try { localStorage.clear() } catch (_) {}
                            signOut()
                          } catch (err) {
                            setDeleteError(err?.message || 'Deletion failed. Please try again.')
                            setDeleting(false)
                          }
                        }}
                        style={{
                          padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(217,72,72,0.5)',
                          background: 'rgba(217,72,72,0.1)', color: 'var(--err)',
                          fontSize: 12, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer',
                          opacity: deleting ? 0.6 : 1,
                        }}
                      >
                        {deleting ? 'Deleting...' : 'Yes, securely delete my account'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setConfirmDelete(false); setDeleteError('') }}
                        style={{
                          padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                          background: 'transparent', color: 'var(--text-3)',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </DashPanel>
        ) : null}
      </DashboardShell>
      <MarketingFooter />
    </>
  )
}
