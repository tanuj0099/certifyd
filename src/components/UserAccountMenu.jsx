import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, LogOut, Settings, ShieldCheck, Trash2, Download, Ban } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useRouter } from 'next/navigation'
import { AnimatedAvatar, getAnimAvatarId } from './AnimatedAvatar.jsx'

const F_SANS = "var(--font-sans)";

function initialsFromUser(user) {
  const metaName = user?.user_metadata?.full_name;
  let name = metaName && metaName.toUpperCase() !== 'ANONYMIZED' 
    ? metaName 
    : (user?.email || 'Professional');
    
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function UserAccountMenu({ user, onNavigate, onSignOut }) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const rootRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    function handleClick(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function go(pageId) {
    setOpen(false)
    router.push(`/${pageId}`)
    onNavigate?.(pageId)
  }

  async function executeDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      const { error } = await supabase.rpc('soft_delete_user')
      if (error) throw error
      // Log them out locally
      onSignOut?.()
      setOpen(false)
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
    } catch (err) {
      console.error('Failed to download data', err);
    }
  }

  async function withdrawConsent() {
    try {
      // Blank out the user's sensitive career data without deleting the auth shell
      const { error } = await supabase.from('user_profiles').update({
        current_salary: null,
        job_role: 'Consent Withdrawn',
        technical_skills: [],
        applied_projects: []
      }).eq('user_id', user?.id || user?.uid);
      if (error) throw error;
      alert("Consent withdrawn. Your ROI and career data has been wiped from active tables.");
      setOpen(false);
    } catch (err) {
      console.error('Withdraw consent failed:', err);
      alert("Failed to withdraw consent. Please try again.");
    }
  }

  return (
    <motion.div
      ref={rootRef}
      style={{ position: 'relative' }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          height: '34px',
          padding: '0 10px 0 4px',
          borderRadius: '999px',
          border: '1px solid var(--border)',
          background: open ? 'var(--bg-alt)' : 'transparent',
          color: 'var(--text)',
          cursor: 'pointer',
          fontFamily: F_SANS,
        }}
      >
        {(() => {
          const avatarSrc = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
          const animId = getAnimAvatarId(avatarSrc);
          
          if (animId) {
            return <AnimatedAvatar id={animId} size={28} />;
          }
          if (avatarSrc) {
            return (
              <img
                src={avatarSrc}
                alt=""
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
              />
            );
          }
          return (
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--text)',
                color: 'var(--bg)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              {initialsFromUser(user)}
            </span>
          );
        })()}
        <span style={{ fontSize: '12px', fontWeight: 700, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {(() => {
            const mName = user?.user_metadata?.full_name;
            if (mName && mName.toUpperCase() !== 'ANONYMIZED') return mName.split(' ')[0];
            if (user?.email) return user.email.split('@')[0];
            return 'Professional';
          })()}
        </span>
        <ChevronDown size={14} style={{ color: 'var(--text-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 180ms ease' }} />
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-white dark:bg-[#010102] border border-zinc-200 dark:border-white/[0.08] shadow-2xl rounded-xl p-2 z-[9999]"
              style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: 0,
                overflow: 'visible',
                width: '12rem',
              }}
            >
              <motion.div
                className="px-3 pb-3 pt-2 border-b border-zinc-200 dark:border-white/[0.08]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div className="text-zinc-900 dark:text-white font-medium text-sm">
                  {(() => {
                    const fullName = user?.user_metadata?.full_name;
                    if (fullName && fullName.toUpperCase() !== 'ANONYMIZED') return fullName;
                    return 'Candidate Profile';
                  })()}
                </motion.div>
                <motion.div className="text-zinc-500 dark:text-zinc-400 text-sm font-medium text-[color:var(--text-3)] mt-1 break-all">
                  {user?.email || ''}
                </motion.div>
              </motion.div>

              {[
                { id: 'dashboard', label: 'Dashboard',           icon: ShieldCheck },
                { id: 'profile',   label: 'Profile \u0026 preferences', icon: Settings },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => go(item.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 border-none rounded-lg bg-transparent text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all text-left font-sans text-[13px] font-semibold cursor-pointer"
                  >
                    <Icon size={15} className="text-zinc-500 dark:text-zinc-400" />
                    {item.label}
                  </button>
                )
              })}

              {/* Removed data export, withdrawal, and delete sections as per user request to move them to profile page */}

            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}
