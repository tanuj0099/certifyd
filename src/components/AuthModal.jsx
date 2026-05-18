import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mail, User, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'

const F_SANS = "'Inter', 'DM Sans', sans-serif"
const F_MONO = "'JetBrains Mono', 'IBM Plex Mono', monospace"

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <label style={{ display: 'grid', gap: '8px' }}>
      <span
        style={{
          color: 'var(--text-4)',
          fontFamily: F_MONO,
          fontSize: '10px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          width: '100%',
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

export default function AuthModal({ isOpen, onClose, loading }) {
  const { signInGoogle, signInEmail, signUpEmail, resetPassword, authError } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const title =
    mode === 'signup'
      ? 'Create your profile'
      : mode === 'reset'
        ? 'Reset password'
        : 'Sign in to continue'

  const subtitle =
    mode === 'signup'
      ? 'Create an account to save profile details, preferences, and ROI context.'
      : mode === 'reset'
        ? 'Enter your email and we will send a Firebase reset link.'
        : 'Save your tools, sync profile details, and continue across devices.'

  async function handleGoogle() {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await signInGoogle()
      onClose()
    } catch (err) {
      setError(err?.message || 'Google sign-in failed.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (mode === 'reset') {
        await resetPassword(email)
        setNotice('Password reset email sent. Check your inbox.')
      } else if (mode === 'signup') {
        await signUpEmail(email, password, name)
        onClose()
      } else {
        await signInEmail(email, password)
        onClose()
      }
    } catch (err) {
      setError(err?.message || 'Authentication failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '22px',
          background: 'rgba(14, 15, 17, 0.72)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          style={{
            width: 'min(100%, 440px)',
            borderRadius: '24px',
            border: '1px solid var(--border-mid)',
            background: '#222326',
            color: 'var(--text)',
            padding: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '999px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '18px',
                }}
              >
                <User size={19} />
              </div>
              <h2 style={{ margin: '0 0 10px', fontFamily: F_SANS, fontSize: '24px', lineHeight: 1.1, fontWeight: 900 }}>
                {title}
              </h2>
              <p style={{ margin: '0 0 22px', color: 'var(--text-2)', fontFamily: F_SANS, fontSize: '14px', lineHeight: 1.65 }}>
                {subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sign in"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '999px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-2)',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '18px' }}>
            {[
              ['signin', 'Sign In'],
              ['signup', 'Sign Up'],
              ['reset', 'Reset'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMode(id)
                  setError('')
                  setNotice('')
                }}
                style={{
                  minHeight: '34px',
                  borderRadius: '999px',
                  border: '1px solid var(--border)',
                  background: mode === id ? 'var(--text)' : 'transparent',
                  color: mode === id ? '#222326' : 'var(--text-2)',
                  fontFamily: F_SANS,
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy || loading}
            style={{
              width: '100%',
              minHeight: '46px',
              borderRadius: '999px',
              border: '1px solid var(--border)',
              background: 'var(--text)',
              color: 'var(--bg)',
              fontFamily: F_SANS,
              fontSize: '14px',
              fontWeight: 900,
              cursor: busy || loading ? 'not-allowed' : 'pointer',
              opacity: busy || loading ? 0.7 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '9px',
            }}
          >
            <Mail size={15} />
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ height: '1px', flex: 1, background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-4)', fontFamily: F_MONO, fontSize: '10px', letterSpacing: '0.1em' }}>
              OR EMAIL
            </span>
            <div style={{ height: '1px', flex: 1, background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
            {mode === 'signup' ? (
              <Field label="Name" value={name} onChange={setName} placeholder="Your name" autoComplete="name" />
            ) : null}
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
            {mode !== 'reset' ? (
              <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Minimum 6 characters" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
            ) : null}

            {(error || authError || notice) ? (
              <div
                role={error || authError ? 'alert' : 'status'}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '12px',
                  color: error || authError ? '#FCA5A5' : '#D1D5DB',
                  fontFamily: F_SANS,
                  fontSize: '13px',
                  lineHeight: 1.5,
                }}
              >
                {error || authError || notice}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={busy || loading || !email || (mode !== 'reset' && !password)}
              style={{
                width: '100%',
                minHeight: '48px',
                borderRadius: '999px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                fontFamily: F_SANS,
                fontSize: '14px',
                fontWeight: 900,
                cursor: busy || loading ? 'not-allowed' : 'pointer',
                opacity: busy || loading ? 0.7 : 1,
              }}
            >
              {busy || loading
                ? 'Working...'
                : mode === 'signup'
                  ? 'Create Account'
                  : mode === 'reset'
                    ? 'Send Reset Link'
                    : 'Sign In'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
