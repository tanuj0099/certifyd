import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import ToolPageWrapper from '../components/ToolPageWrapper'
import { LogOut, Save } from 'lucide-react'

const FH = "'Plus Jakarta Sans','Bricolage Grotesque',sans-serif"
const FB = "'Inter',sans-serif"
const FM = "'JetBrains Mono','Commit Mono',monospace"

const ProfilePage = () => {
  const { user, signOut } = useAuth()
  const { profile, loading, error, updateProfile } = useProfile()
  const [displayName, setDisplayName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
    }
  }, [profile])

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveSuccess(false)
    const { error } = await updateProfile({ display_name: displayName })
    if (!error) {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    }
    setIsSaving(false)
  }

  if (loading) {
    return (
      <ToolPageWrapper eyebrow="ACCOUNT" title="Your Profile">
        <div style={{ fontFamily: FB, color: 'var(--text-3)' }}>Loading profile...</div>
      </ToolPageWrapper>
    )
  }

  if (error) {
    return (
      <ToolPageWrapper eyebrow="ACCOUNT" title="Error">
        <div style={{ fontFamily: FB, color: 'var(--semantic-danger)' }}>Failed to load profile: {error}</div>
      </ToolPageWrapper>
    )
  }

  return (
    <ToolPageWrapper
      eyebrow="ACCOUNT"
      title="Your Profile"
      description={`Manage your account details and preferences.`}
    >
      <div style={{ maxWidth: '600px' }}>
        <div className="surface-panel" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <img
              src={profile?.photo_url || `https://api.dicebear.com/8.x/initials/svg?seed=${user?.email}`}
              alt="Profile"
              style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--border-strong)' }}
            />
            <div>
              <h2 style={{ fontFamily: FH, fontSize: '22px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                {profile?.display_name || 'Certify User'}
              </h2>
              <p style={{ fontFamily: FM, fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                {user?.email}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '16px' }}>
              <label className="control-label" htmlFor="displayName">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-number"
                style={{ marginTop: '8px' }}
              />
            </div>
            <motion.button
              type="submit"
              disabled={isSaving}
              className="btn-primary"
              style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
              {!isSaving && <Save size={15} />}
            </motion.button>
          </form>
        </div>

        <div className="surface-panel" style={{ padding: '24px', borderColor: 'var(--semantic-danger)' }}>
          <h3 style={{ fontFamily: FH, fontSize: '18px', fontWeight: '700', color: 'var(--semantic-danger)', margin: '0 0 8px' }}>
            Danger Zone
          </h3>
          <p style={{ fontFamily: FB, fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
            Signing out will clear your current session.
          </p>
          <motion.button
            onClick={signOut}
            style={{ background: 'var(--semantic-danger)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontFamily: FH, fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <LogOut size={15} />
            Sign Out
          </motion.button>
        </div>
      </div>
    </ToolPageWrapper>
  )
}

export default ProfilePage