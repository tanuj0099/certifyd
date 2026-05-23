import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, LogOut, Settings, ShieldCheck, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase.js'

const F_SANS = "'Inter', 'DM Sans', sans-serif"

function initialsFromUser(user) {
  const name = user?.user_metadata?.full_name || user?.email || 'U'
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

  useEffect(() => {
    function handleClick(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function go(pageId) {
    setOpen(false)
    onNavigate?.(pageId)
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
        {user?.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt=""
            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
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
        )}
        <span style={{ fontSize: '12px', fontWeight: 700, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Tanuj Rajdev'}
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
              style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: 0,
                zIndex: 9999,
                overflow: 'visible',
                width: '12rem',
                padding: '0.5rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255,255,255,0.08)',
                background: '#09090b',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              }}
            >
              <motion.div
                style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--border)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div className="text-white font-medium" style={{ fontSize: '13px' }}>
                  {user?.user_metadata?.full_name || 'Tanuj Rajdev'}
                </motion.div>
                <motion.div className="text-zinc-400 text-xs" style={{ marginTop: 4, wordBreak: 'break-all' }}>
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
                    className="text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      border: 'none',
                      borderRadius: '10px',
                      fontFamily: F_SANS,
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <Icon size={15} style={{ color: 'var(--text-3)' }} />
                    {item.label}
                  </button>
                )
              })}

              {/* ── Sign out ──────────────────────────────── */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  onSignOut?.()
                }}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/[0.06] transition-colors"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', marginTop: '4px',
                  border: 'none', borderRadius: '10px',
                  fontFamily: F_SANS, fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <LogOut size={15} />
                Sign out
              </button>

            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}
