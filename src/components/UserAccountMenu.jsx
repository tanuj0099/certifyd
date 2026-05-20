import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, LogOut, Settings, Shield } from 'lucide-react'
import { isAdminEmail } from '../utils/admin.js'

const F_SANS = "'Inter', 'DM Sans', sans-serif"

function initialsFromUser(user) {
  const name = user?.displayName || user?.email || 'U'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function UserAccountMenu({ user, onNavigate, onSignOut }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const isAdmin = isAdminEmail(user?.email)

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
        onClick={() => setOpen((value) => !value)}
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
        {user.photoURL ? (
          <img
            src={user.photoURL}
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
          {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Account'}
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
                top: '42px',
                right: 0,
                zIndex: 9999,
                minWidth: '220px',
                padding: '6px',
                borderRadius: '16px',
                border: '1px solid var(--border-mid)',
                background: 'var(--bg)',
                boxShadow: '0 12px 40px var(--overlay-scrim, rgba(0,0,0,0.2))',
              }}
            >
              <motion.div
                style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--border)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>
                  {user.displayName || 'Your account'}
                </motion.div>
                <motion.div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: 4, wordBreak: 'break-all' }}>
                  {user.email}
                </motion.div>
              </motion.div>

              {[
                { id: 'profile', label: 'Profile & preferences', icon: Settings },
                ...(isAdmin ? [{ id: 'admin', label: 'Admin console', icon: Shield }] : []),
              ].map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => go(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      border: 'none',
                      borderRadius: '10px',
                      background: 'transparent',
                      color: 'var(--text)',
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

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  onSignOut?.()
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  marginTop: '4px',
                  border: 'none',
                  borderRadius: '10px',
                  background: 'transparent',
                  color: 'var(--err)',
                  fontFamily: F_SANS,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
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
