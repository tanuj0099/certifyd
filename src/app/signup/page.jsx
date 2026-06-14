'use client';

import { useState } from 'react'
import { useRouter } from 'next/navigation';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth.jsx'

const FS = "var(--font-sans)";
const FM = "var(--font-mono)";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/>
    </svg>
  )
}

export default function SignupPage() {
  const { signInGoogle, signInGithub, signUpEmail, signInPhone, verifyPhoneOtp, loading } = useAuth()
  const router = useRouter()
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [otpMode, setOtpMode] = useState(false)

  // Consent Modal State
  const [showConsent, setShowConsent] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)
  const [marketingChecked, setMarketingChecked] = useState(false)

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Allow a small buffer (e.g., 5px) for browser rounding errors
    if (scrollHeight - scrollTop - clientHeight < 5) {
      setHasScrolledToBottom(true);
    }
  };

  const triggerConsent = (actionFunc) => {
    setPendingAction(() => actionFunc);
    setShowConsent(true);
  };

  const executePendingAction = () => {
    setShowConsent(false);
    if (pendingAction) {
      pendingAction();
    }
  };

  async function doGoogle() {
    setBusy(true)
    setError(null)
    try {
      await signInGoogle()
      router.push('/onboarding', { replace: true })
    } catch (err) {
      setError(err?.message || 'Google sign-up failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function doGithub() {
    setBusy(true)
    setError(null)
    try {
      await signInGithub()
      router.push('/onboarding', { replace: true })
    } catch (err) {
      setError(err?.message || 'GitHub sign-up failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function handleGoogle() { triggerConsent(doGoogle) }
  function handleGithub() { triggerConsent(doGithub) }

  async function doCredentialSubmit() {
    e.preventDefault()
    setBusy(true)
    setError(null)
    
    try {
      if (otpMode) {
        await verifyPhoneOtp(identifier, password)
        router.push('/onboarding', { replace: true })
      } else {
        if (identifier.includes('@')) {
          await signUpEmail(identifier, password)
          router.push('/onboarding', { replace: true })
        } else if (/^\+?[0-9\s-]+$/.test(identifier)) {
          await signInPhone(identifier)
          setOtpMode(true)
          setPassword('')
        } else {
          throw new Error('Please enter a valid email or phone number.')
        }
      }
    } catch (err) {
      setError(err?.message || 'Authentication failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function handleCredentialWrapper(e) {
    e.preventDefault()
    triggerConsent(doCredentialSubmit)
  }

  const isDisabled = busy || loading

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#010102',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: FS,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
        style={{ width: '100%', maxWidth: '400px' }}
      >
        {/* Logo wordmark */}
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: 16,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5Z" stroke="#f7f8f8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17l10 5 10-5" stroke="#f7f8f8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12l10 5 10-5" stroke="#f7f8f8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#f7f8f8', letterSpacing: '-0.02em' }}>
            Certifyd
          </div>
        </div>

        {/* Auth card */}
        <div
          style={{
            padding: '32px',
            borderRadius: '18px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.025)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <h1 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 800, color: '#f7f8f8', letterSpacing: '-0.02em' }}>
            Create your account
          </h1>
          <p style={{ margin: '0 0 28px', fontSize: '14px', color: 'rgba(247,248,248,0.45)', lineHeight: 1.6 }}>
            Get personalized ROI analysis, certification tracking, and premium career tools - free.
          </p>

          {/* Primary: Google - high-contrast white fill */}
          <button
            type="button"
            id="signup-google-btn"
            onClick={handleGoogle}
            disabled={isDisabled}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '13px 20px',
              borderRadius: '10px',
              border: 'none',
              background: isDisabled ? 'rgba(247,248,248,0.7)' : '#f7f8f8',
              color: '#010102',
              fontFamily: FS,
              fontSize: '14px',
              fontWeight: 800,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.65 : 1,
              transition: 'background 180ms ease, opacity 180ms ease',
              letterSpacing: '-0.01em',
            }}
          >
            <GoogleIcon />
            {busy ? 'Creating account...' : 'Continue with Google'}
          </button>

          {/* Secondary: GitHub - subtle ghost */}
          <button
            type="button"
            id="signup-github-btn"
            onClick={handleGithub}
            disabled={isDisabled}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '12px 20px',
              marginTop: '10px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: 'rgba(247,248,248,0.7)',
              fontFamily: FS,
              fontSize: '14px',
              fontWeight: 600,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.5 : 1,
              transition: 'border-color 180ms ease, opacity 180ms ease',
            }}
          >
            <GithubIcon />
            Continue with GitHub
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ padding: '0 12px', fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontFamily: FM }}>or</div>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleCredentialWrapper} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="Email or Phone number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={isDisabled || otpMode}
              required
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#fff',
                fontFamily: FS,
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />

            <input
              type={otpMode ? "text" : "password"}
              placeholder={otpMode ? "Enter OTP sent to phone" : "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isDisabled}
              required={!otpMode || (otpMode && identifier)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#fff',
                fontFamily: FS,
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
                display: (otpMode || identifier) ? 'block' : 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />

            <button
              type="submit"
              disabled={isDisabled || !identifier}
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--accent)',
                color: 'var(--bg)',
                fontFamily: FS,
                fontSize: '14px',
                fontWeight: 800,
                cursor: (isDisabled || !identifier) ? 'not-allowed' : 'pointer',
                opacity: (isDisabled || !identifier) ? 0.65 : 1,
                transition: 'all 180ms ease',
                marginTop: '8px',
              }}
            >
              {busy ? (otpMode ? 'Verifying...' : 'Processing...') : (otpMode ? 'Verify OTP' : 'Continue with Email / Phone')}
            </button>
          </form>

          {error && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(220,38,38,0.08)',
                border: '1px solid rgba(220,38,38,0.2)',
                color: '#f87171',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          <p style={{ marginTop: '20px', fontSize: '12px', color: 'rgba(247,248,248,0.28)', lineHeight: 1.6, textAlign: 'center' }}>
            By continuing, you agree to our{' '}
            <Link href="/terms" style={{ color: 'rgba(247,248,248,0.55)', textDecoration: 'underline' }}>Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" style={{ color: 'rgba(247,248,248,0.55)', textDecoration: 'underline' }}>Privacy Policy</Link>.
          </p>

          <div
            style={{
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              textAlign: 'center',
              fontSize: '13px',
              color: 'rgba(247,248,248,0.4)',
            }}
          >
            Already have an account₹{' '}
            <Link href="/login" style={{ color: '#f7f8f8', fontWeight: 700, textDecoration: 'none' }}>
              Sign in
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '12px',
            fontFamily: FM,
            color: 'rgba(247,248,248,0.22)',
            letterSpacing: '0.04em',
          }}
        >
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}> Back to home</Link>
          <span style={{ margin: '0 10px', opacity: 0.4 }}></span>
          <span>Credentials never stored on Certifyd servers</span>
        </div>
      </motion.div>

      {/* Consent Modal */}
      <AnimatePresence>
        {showConsent && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', fontFamily: FS,
          }}>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
              onClick={() => setShowConsent(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{
                position: 'relative', width: '100%', maxWidth: '500px',
                background: '#0a0a0b', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
              }}
            >
              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={18} color="#f7f8f8" />
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f7f8f8', margin: 0 }}>Data Protection & Consent</h2>
                </div>
                <button onClick={() => setShowConsent(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div
                onScroll={handleScroll}
                style={{
                  padding: '24px', maxHeight: '40vh', overflowY: 'auto',
                  fontSize: '13px', lineHeight: 1.6, color: 'rgba(255,255,255,0.6)',
                  background: 'rgba(0,0,0,0.2)'
                }}
              >
                <h3 style={{ color: '#f7f8f8', fontSize: '14px', marginBottom: '8px', marginTop: 0 }}>Why we need your consent</h3>
                <p style={{ marginBottom: '16px' }}>
                  Under the Digital Personal Data Protection (DPDP) Act, we must be absolutely transparent about what data we collect, why we collect it, and how you can delete it. By creating an account, you are acknowledging our practices below.
                </p>

                <h3 style={{ color: '#f7f8f8', fontSize: '14px', marginBottom: '8px' }}>1. What we collect & why</h3>
                <p style={{ marginBottom: '16px' }}>
                  We collect your profile details, career background, and compensation data purely for the purpose of <strong>generating personalized ROI calculations and career recommendations.</strong> We do not use this data for building recruiter intelligence tools or external marketing without additional, separate consent.
                </p>

                <h3 style={{ color: '#f7f8f8', fontSize: '14px', marginBottom: '8px' }}>2. Document storage</h3>
                <p style={{ marginBottom: '16px' }}>
                  When you upload resumes or offer letters, <strong>we process them entirely in-memory</strong>. We strictly extract the data required for analysis, anonymize Personally Identifiable Information (PII), and discard the raw file. We do not store raw PDFs or offer letters on our servers.
                </p>

                <h3 style={{ color: '#f7f8f8', fontSize: '14px', marginBottom: '8px' }}>3. Institutional data sharing</h3>
                <p style={{ marginBottom: '16px' }}>
                  We do not share your individual-level tracking data with colleges, institutions, or employers. Any institutional reports generated are strictly based on cohort-level, aggregated data.
                </p>

                <h3 style={{ color: '#f7f8f8', fontSize: '14px', marginBottom: '8px' }}>4. Right to Erasure</h3>
                <p style={{ marginBottom: '0' }}>
                  You have the right to request the deletion of your account and data at any time. We provide a self-serve <strong>Delete Account</strong> mechanism in your profile settings, which permanently anonymizes your data in our systems within the statutory 90-day period.
                </p>
              </div>

              {/* Footer / Actions */}
              <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}>
                {!hasScrolledToBottom ? (
                  <div style={{ fontSize: '12px', color: 'var(--accent)', fontFamily: FM, textAlign: 'center', padding: '10px 0' }}>
                    ↓ Please read to the bottom to continue
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={consentChecked}
                        onChange={(e) => setConsentChecked(e.target.checked)}
                        style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: '13px', color: '#f7f8f8', lineHeight: 1.4 }}>
                        I confirm I am 18 years or older, and I consent to the collection and processing of my data specifically for ROI analysis as stated above.
                      </span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={marketingChecked}
                        onChange={(e) => setMarketingChecked(e.target.checked)}
                        style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                        Send me certification market updates and salary insights (Optional)
                      </span>
                    </label>
                  </div>
                )}

                <button
                  onClick={executePendingAction}
                  disabled={!hasScrolledToBottom || !consentChecked}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                    background: (!hasScrolledToBottom || !consentChecked) ? 'rgba(255,255,255,0.1)' : 'var(--accent)',
                    color: (!hasScrolledToBottom || !consentChecked) ? 'rgba(255,255,255,0.4)' : 'var(--bg)',
                    fontSize: '14px', fontWeight: 700, fontFamily: FS, cursor: (!hasScrolledToBottom || !consentChecked) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Accept & Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
