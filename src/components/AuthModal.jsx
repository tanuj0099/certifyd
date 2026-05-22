import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Github, Mail, Phone, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'
import { useTheme } from '../hooks/useTheme.jsx'
import TurnstileWidget, { isTurnstileEnabled } from './TurnstileWidget.jsx'
import { verifyTurnstileToken } from '../services/turnstileService.js'

const FS = "'Inter', 'DM Sans', sans-serif"
const FM = "'JetBrains Mono', 'IBM Plex Mono', monospace"

// ─── Field ────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, autoComplete, autoFocus, maxLength }) {
  return (
    <label style={{ display: 'grid', gap: '7px' }}>
      <span style={{ color: 'var(--text-4)', fontFamily: FM, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        maxLength={maxLength}
        style={{
          width: '100%', boxSizing: 'border-box',
          minHeight: '46px', borderRadius: '12px',
          border: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.03)',
          color: 'var(--text)', padding: '0 14px',
          fontFamily: FS, fontSize: '14px', outline: 'none',
          transition: 'border-color 160ms ease',
        }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--border-mid)' }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
      />
    </label>
  )
}

// ─── SocialBtn ────────────────────────────────────────────
function SocialBtn({ onClick, disabled, icon: Icon, label, secondary = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', minHeight: '46px', borderRadius: '12px',
        border: secondary ? '1px solid var(--border)' : '1px solid var(--border-mid)',
        background: secondary ? 'transparent' : 'var(--text)',
        color: secondary ? 'var(--text-2)' : 'var(--bg)',
        fontFamily: FS, fontSize: '14px', fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        transition: 'opacity 180ms, background 180ms',
      }}
    >
      <Icon size={16} strokeWidth={secondary ? 1.5 : 2} />
      {label}
    </button>
  )
}

// ─── Divider ──────────────────────────────────────────────
function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '6px 0' }}>
      <div style={{ height: '1px', flex: 1, background: 'var(--border)' }} />
      <span style={{ color: 'var(--text-4)', fontFamily: FM, fontSize: '10px', letterSpacing: '0.12em' }}>{label}</span>
      <div style={{ height: '1px', flex: 1, background: 'var(--border)' }} />
    </div>
  )
}

// ─── GoogleIcon ───────────────────────────────────────────
function GoogleIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

const INDIA_CODE = '+91'

export default function AuthModal({ isOpen, onClose, loading }) {
  const { signInGoogle, signInGithub, signInPhone, signInEmail, signUpEmail, resetPassword, authError } = useAuth()
  const { isDark } = useTheme()

  // tab: 'social' | 'phone' | 'email'
  const [tab, setTab] = useState('social')
  // email sub-mode: 'signin' | 'signup' | 'reset'
  const [emailMode, setEmailMode] = useState('signin')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  // phone flow
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [confirmationResult, setConfirmationResult] = useState(null)
  const [otpSent, setOtpSent] = useState(false)
  const recaptchaRef = useRef(null)

  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState(isTurnstileEnabled() ? '' : 'turnstile-disabled')

  // reset form when modal closes/reopens
  useEffect(() => {
    if (!isOpen) {
      setTab('social'); setEmailMode('signin')
      setEmail(''); setPassword(''); setName('')
      setPhone(''); setOtp(''); setOtpSent(false); setConfirmationResult(null)
      setError(''); setNotice('')
    }
  }, [isOpen])

  if (!isOpen) return null

  async function ensureHumanCheck() {
    if (!isTurnstileEnabled()) return
    if (!turnstileToken) throw new Error('Complete the human verification check.')
    await verifyTurnstileToken(turnstileToken)
  }

  async function handleGoogle() {
    setBusy(true); setError(''); setNotice('')
    try { await ensureHumanCheck(); await signInGoogle(); onClose() }
    catch (err) { setError(err?.message || 'Google sign-in failed.') }
    finally { setBusy(false) }
  }

  async function handleGithub() {
    setBusy(true); setError(''); setNotice('')
    try { await ensureHumanCheck(); await signInGithub(); onClose() }
    catch (err) { setError(err?.message || 'GitHub sign-in failed.') }
    finally { setBusy(false) }
  }

  async function handleSendOtp() {
    if (!phone || phone.length < 7) { setError('Enter a valid mobile number.'); return }
    setBusy(true); setError(''); setNotice('')
    try {
      await ensureHumanCheck()
      const fullNumber = phone.startsWith('+') ? phone : `${INDIA_CODE}${phone.replace(/^0+/, '')}`
      const result = await signInPhone(fullNumber, 'recaptcha-container')
      setConfirmationResult(result)
      setOtpSent(true)
      setNotice('OTP sent to your mobile.')
    } catch (err) { setError(err?.message || 'Failed to send OTP.') }
    finally { setBusy(false) }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault()
    if (!otp || otp.length < 4) { setError('Enter the OTP you received.'); return }
    if (!confirmationResult) { setError('Please request an OTP first.'); return }
    setBusy(true); setError(''); setNotice('')
    try {
      await confirmationResult.confirm(otp)
      onClose()
    } catch (err) {
      setError(err?.message || 'Invalid OTP. Please try again.')
    } finally { setBusy(false) }
  }

  async function handleEmailSubmit(event) {
    event.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      await ensureHumanCheck()
      if (emailMode === 'reset') {
        await resetPassword(email)
        setNotice('Password reset email sent. Check your inbox.')
      } else if (emailMode === 'signup') {
        await signUpEmail(email, password, name)
        onClose()
      } else {
        await signInEmail(email, password)
        onClose()
      }
    } catch (err) { setError(err?.message || 'Authentication failed.') }
    finally { setBusy(false) }
  }

  const TABS = [
    { id: 'social', label: 'Social' },
    { id: 'phone', label: 'Mobile' },
    { id: 'email', label: 'Email' },
  ]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
          background: isDark ? 'rgba(0,0,0,0.74)' : 'rgba(20,20,20,0.44)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 'min(100%, 420px)',
            borderRadius: '24px',
            border: '1px solid var(--border-mid)',
            background: 'var(--bg)',
            color: 'var(--text)',
            padding: '28px 28px 24px',
            position: 'relative',
          }}
        >
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: '18px', right: '18px',
              width: '32px', height: '32px', borderRadius: '999px',
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-3)', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>

          {/* Header */}
          <div style={{ marginBottom: '22px', paddingRight: '40px' }}>
            <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '8px' }}>
              CertifyROI
            </div>
            <h2 style={{ margin: 0, fontFamily: FS, fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {tab === 'email' && emailMode === 'signup' ? 'Create account' :
               tab === 'email' && emailMode === 'reset' ? 'Reset password' :
               tab === 'phone' ? 'Sign in with mobile' :
               'Welcome back'}
            </h2>
            <p style={{ margin: '7px 0 0', color: 'var(--text-3)', fontFamily: FS, fontSize: '13px', lineHeight: 1.55 }}>
              {tab === 'phone' ? 'We\'ll send a one-time code to your Indian mobile number.' :
               tab === 'email' && emailMode === 'reset' ? 'Enter your email to receive a password reset link.' :
               'Save your ROI results and sync across devices.'}
            </p>
          </div>

          {/* Tab switcher */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '20px' }}>
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setTab(id); setError(''); setNotice('') }}
                style={{
                  minHeight: '34px', borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: tab === id ? 'var(--text)' : 'transparent',
                  color: tab === id ? 'var(--bg)' : 'var(--text-3)',
                  fontFamily: FS, fontSize: '12px', fontWeight: 700,
                  cursor: 'pointer', transition: 'all 160ms ease',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <TurnstileWidget
            onVerify={setTurnstileToken}
            onExpire={() => setTurnstileToken('')}
            onError={() => setTurnstileToken('')}
          />

          {/* ── SOCIAL TAB ──────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {tab === 'social' && (
              <motion.div key="social" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.18 }}>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <SocialBtn
                    onClick={handleGoogle}
                    disabled={busy || loading || (isTurnstileEnabled() && !turnstileToken)}
                    icon={GoogleIcon}
                    label="Continue with Google"
                  />
                  <SocialBtn
                    onClick={handleGithub}
                    disabled={busy || loading || (isTurnstileEnabled() && !turnstileToken)}
                    icon={Github}
                    label="Continue with GitHub"
                    secondary
                  />
                </div>
                <div style={{ marginTop: '18px', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Secured by Firebase Auth</div>
                  <div style={{ fontFamily: FS, fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.6 }}>
                    Your credentials are never stored on CertifyROI servers. Use Mobile OTP or Email for more sign-in options.
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── PHONE / OTP TAB ─────────────────────────── */}
            {tab === 'phone' && (
              <motion.div key="phone" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.18 }}>
                {/* invisible recaptcha anchor */}
                <div id="recaptcha-container" ref={recaptchaRef} />

                {!otpSent ? (
                  <div style={{ display: 'grid', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '8px', alignItems: 'end' }}>
                      <label style={{ display: 'grid', gap: '7px' }}>
                        <span style={{ color: 'var(--text-4)', fontFamily: FM, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Code</span>
                        <div style={{ minHeight: '46px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FM, fontSize: '13px', color: 'var(--text-2)' }}>
                          {INDIA_CODE}
                        </div>
                      </label>
                      <Field
                        label="Mobile Number"
                        type="tel"
                        value={phone}
                        onChange={setPhone}
                        placeholder="98765 43210"
                        autoComplete="tel-national"
                        autoFocus
                        maxLength={10}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={busy || !phone || phone.length < 7 || (isTurnstileEnabled() && !turnstileToken)}
                      style={{
                        width: '100%', minHeight: '46px', borderRadius: '12px',
                        border: 'none', background: 'var(--text)', color: 'var(--bg)',
                        fontFamily: FS, fontSize: '14px', fontWeight: 800,
                        cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      }}
                    >
                      <Phone size={15} />
                      {busy ? 'Sending...' : 'Send OTP'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyOtp} style={{ display: 'grid', gap: '14px' }}>
                    <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(45,184,122,0.07)', border: '1px solid rgba(45,184,122,0.2)', fontFamily: FS, fontSize: '13px', color: '#2db87a', lineHeight: 1.5 }}>
                      OTP sent to {INDIA_CODE} {phone}
                    </div>
                    <Field label="Enter OTP" type="text" value={otp} onChange={setOtp} placeholder="6-digit code" autoFocus maxLength={6} />
                    <button
                      type="submit"
                      disabled={busy || otp.length < 4}
                      style={{
                        width: '100%', minHeight: '46px', borderRadius: '12px',
                        border: 'none', background: 'var(--text)', color: 'var(--bg)',
                        fontFamily: FS, fontSize: '14px', fontWeight: 800,
                        cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1,
                      }}
                    >
                      {busy ? 'Verifying...' : 'Verify & Sign In'}
                    </button>
                    <button type="button" onClick={() => { setOtpSent(false); setOtp(''); setConfirmationResult(null) }} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontFamily: FS, fontSize: '13px', cursor: 'pointer', padding: '4px 0' }}>
                      ← Change number
                    </button>
                  </form>
                )}
              </motion.div>
            )}

            {/* ── EMAIL TAB ───────────────────────────────── */}
            {tab === 'email' && (
              <motion.div key="email" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.18 }}>
                {/* Email mode tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px', marginBottom: '18px' }}>
                  {[['signin', 'Sign In'], ['signup', 'Sign Up'], ['reset', 'Reset']].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => { setEmailMode(id); setError(''); setNotice('') }}
                      style={{
                        minHeight: '32px', borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: emailMode === id ? 'var(--bg-alt)' : 'transparent',
                        color: emailMode === id ? 'var(--text)' : 'var(--text-4)',
                        fontFamily: FS, fontSize: '11px', fontWeight: emailMode === id ? 800 : 500,
                        cursor: 'pointer', transition: 'all 140ms ease',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleEmailSubmit} style={{ display: 'grid', gap: '12px' }}>
                  {emailMode === 'signup' && (
                    <Field label="Full Name" value={name} onChange={setName} placeholder="Your name" autoComplete="name" />
                  )}
                  <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" autoFocus />
                  {emailMode !== 'reset' && (
                    <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Minimum 6 characters" autoComplete={emailMode === 'signup' ? 'new-password' : 'current-password'} />
                  )}
                  <button
                    type="submit"
                    disabled={busy || loading || !email || (emailMode !== 'reset' && !password) || (isTurnstileEnabled() && !turnstileToken)}
                    style={{
                      width: '100%', minHeight: '46px', borderRadius: '12px',
                      border: 'none', background: 'var(--text)', color: 'var(--bg)',
                      fontFamily: FS, fontSize: '14px', fontWeight: 800,
                      cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1,
                      marginTop: '4px',
                    }}
                  >
                    {busy || loading ? 'Working...' :
                     emailMode === 'signup' ? 'Create Account' :
                     emailMode === 'reset' ? 'Send Reset Link' : 'Sign In'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error / notice banner */}
          {(error || authError || notice) && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '14px', padding: '11px 14px', borderRadius: '12px',
                border: `1px solid ${(error || authError) ? 'rgba(217,72,72,0.25)' : 'rgba(255,255,255,0.1)'}`,
                background: (error || authError) ? 'rgba(217,72,72,0.07)' : 'rgba(255,255,255,0.03)',
                color: (error || authError) ? 'var(--err)' : 'var(--text-2)',
                fontFamily: FS, fontSize: '13px', lineHeight: 1.5,
              }}
            >
              {error || authError || notice}
            </motion.div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '20px', fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', textAlign: 'center', letterSpacing: '0.07em', lineHeight: 1.6 }}>
            By continuing you agree to our Terms of Service &amp; Privacy Policy.
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
