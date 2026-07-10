'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, LogOut, Check, Download, Ban, Trash2 } from 'lucide-react';
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx';
import { useAuth } from '@/hooks/useAuth.jsx';
import { useProfile } from '@/hooks/useProfile.jsx';
import { supabase } from '@/lib/supabase.js';
import { logger } from '@/lib/logger.js';

export default function UserProfile() {
  const { user, signOut } = useAuth();
  const { profile, loading, error, updateProfile } = useProfile();

  const [displayName, setDisplayName] = useState(profile?.display_name || user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

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

  async function executeDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      const userId = user?.id || user?.uid;
      if (!userId) throw new Error('User not found');
      
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account');
      
      signOut()
    } catch (err) {
      console.error('Account erasure failed:', err)
      setDeleteError(err.message || 'Failed to delete account.')
      setDeleting(false)
    }
  }

  async function downloadData() {
    try {
      const { data, error } = await supabase.from('user_profiles').select('*').eq('user_id', user?.id || user?.uid).single();
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certifyd_data.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMsg('Data export downloaded successfully.');
    } catch (err) {
      logger.error('Failed to download data', err);
      setStatusMsg('Failed to export data.');
    }
  }

  async function withdrawConsent() {
    try {
      const { error } = await supabase.from('user_profiles').update({
        current_salary: null,
        job_role: 'Consent Withdrawn',
        technical_skills: [],
        applied_projects: []
      }).eq('user_id', user?.id || user?.uid);
      if (error) throw error;
      setStatusMsg("Consent withdrawn. Your ROI and career data has been wiped from active tables.");
    } catch (err) {
      logger.error('Withdraw consent failed', err);
      setStatusMsg("Failed to withdraw consent. Please try again.");
    }
  }

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
        {statusMsg && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: '10px',
            background: 'var(--accent)',
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            {statusMsg}
          </div>
        )}
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

          <div style={{ background: 'var(--bg)', padding: '32px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: '600', color: 'var(--text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} /> Data & Privacy
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-2)', marginBottom: '24px' }}>
              Manage your personal data, withdraw consent for AI analysis, or permanently delete your account.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={downloadData}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer' }}
              >
                <Download size={16} /> Download My Data
              </button>
              
              <button
                onClick={withdrawConsent}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'transparent', border: '1px solid var(--amber-500, #f59e0b)', borderRadius: '8px', color: 'var(--amber-500, #f59e0b)', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer' }}
              >
                <Ban size={16} /> Withdraw Consent
              </button>

              {!confirmDelete ? (
                <button
                  onClick={() => { setConfirmDelete(true); setDeleteError(''); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'transparent', border: '1px solid var(--err)', borderRadius: '8px', color: 'var(--err)', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer' }}
                >
                  <Trash2 size={16} /> Delete Account
                </button>
              ) : (
                <div style={{ padding: '16px', border: '1px solid var(--err)', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.05)' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '12px', fontFamily: 'var(--font-body)' }}>
                    Your account will be queued for permanent deletion. Type <strong>DELETE</strong> below to confirm.
                  </div>
                  <input
                    type="text"
                    placeholder="DELETE"
                    disabled={deleting}
                    id="delete-confirm-input"
                    onChange={(e) => {
                      if (e.target.value === 'DELETE') {
                        // We do not auto-delete here anymore.
                        // The user must click the button below.
                      }
                    }}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--err)', borderRadius: '6px', color: 'var(--text)', outline: 'none', marginBottom: '8px' }}
                  />
                  {deleting && <div style={{ fontSize: '12px', color: 'var(--err)', marginTop: '4px' }}>Processing erasure...</div>}
                  {deleteError && <div style={{ fontSize: '12px', color: 'var(--err)', marginTop: '4px' }}>{deleteError}</div>}
                  <button
                    onClick={() => {
                      const inputEl = document.getElementById('delete-confirm-input');
                      if (inputEl && inputEl.value === 'DELETE') {
                        executeDelete();
                      } else {
                        setDeleteError('Please type DELETE to confirm.');
                      }
                    }}
                    disabled={deleting}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--err)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '14px', fontWeight: 'bold', cursor: deleting ? 'not-allowed' : 'pointer', marginBottom: '8px' }}
                  >
                    {deleting ? 'Deleting...' : 'Yes, securely delete my account'}
                  </button>
                  <button
                    onClick={() => { setConfirmDelete(false); setDeleteError(''); }}
                    style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-3)', fontSize: '12px', cursor: 'pointer', padding: '8px 0' }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </motion.div>
    </ToolPageWrapper>
  );
}
