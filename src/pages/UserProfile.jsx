import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, LogOut, Check } from 'lucide-react';
import ToolPageWrapper from '../components/ToolPageWrapper.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useProfile } from '../hooks/useProfile.jsx';

export default function UserProfile() {
  const { user, signOut } = useAuth();
  const { profile, loading, error, updateProfile } = useProfile();

  const [displayName, setDisplayName] = useState(profile?.display_name || user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  if (!user) {
    return (
      <ToolPageWrapper eyebrow="ACCOUNT" title="Profile" subtitle="Restricted">
        <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-2)', marginBottom: '24px' }}>
            You need to be signed in to view this page.
          </p>
        </div>
      </ToolPageWrapper>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile({ display_name: displayName });
    setSaving(false);
    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <ToolPageWrapper
      eyebrow="ACCOUNT"
      title="User Profile"
      description="Manage your account preferences and settings."
      footer={true}
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr', gap: '24px',
          maxWidth: '600px'
        }}>

          <div style={{ background: 'var(--bg)', padding: '32px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: '600', color: 'var(--text)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} /> Personal Details
            </h2>

            {loading ? (
              <div style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>Loading profile data...</div>
            ) : (
              <form onSubmit={handleSave}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Email Address (Read Only)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border-mid)', color: 'var(--text-2)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
                    <Mail size={16} />
                    {user.email}
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 16px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)',
                      color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '14px', outline: 'none'
                    }}
                    placeholder="Enter your name"
                  />
                </div>

                {error && <div style={{ color: 'var(--err)', fontSize: '12px', marginBottom: '16px' }}>{error}</div>}

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                  style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                >
                  {saving ? 'Saving...' : saved ? <><Check size={14} /> Saved</> : 'Save Changes'}
                </button>
              </form>
            )}
          </div>

          <div style={{ background: 'var(--bg)', padding: '32px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: '600', color: 'var(--text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} /> Authentication
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-2)', marginBottom: '24px' }}>
              You are signed in via secure Google Authentication. Password resets and credential management are handled directly by Google.
            </p>
            <button
              onClick={signOut}
              className="btn-ghost"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', color: 'var(--err)', borderColor: 'var(--err)' }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>

        </div>
      </motion.div>
    </ToolPageWrapper>
  );
}
