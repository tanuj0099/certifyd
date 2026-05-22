import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth.jsx'

const FS = "'Inter', 'DM Sans', sans-serif"
const FM = "'JetBrains Mono', 'IBM Plex Mono', monospace"

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  const { signInGoogle, loading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  async function handleGoogleSignIn() {
    setError(null)
    try {
      await signInGoogle()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err?.message || 'Sign-in failed. Please try again.')
    }
  }

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
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
        style={{
          width: '100%',
          maxWidth: '400px',
        }}
      >
        {/* Logo / wordmark */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
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
              <path d="M12 2L2 7l10 5 10-5-10-5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f7f8f8' }} />
              <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f7f8f8' }} />
              <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f7f8f8' }} />
            </svg>
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#f7f8f8',
              letterSpacing: '-0.02em',
            }}
          >
            CertifyROI
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            padding: '32px',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.025)',
          }}
        >
          <h1
            style={{
              margin: '0 0 8px',
              fontSize: '20px',
              fontWeight: 800,
              color: '#f7f8f8',
              letterSpacing: '-0.02em',
            }}
          >
            Welcome back
          </h1>
          <p
            style={{
              margin: '0 0 28px',
              fontSize: '14px',
              color: 'rgba(247,248,248,0.5)',
              lineHeight: 1.6,
            }}
          >
            Sign in to access your workspace and certification tracker.
          </p>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '13px 20px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: loading ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
              color: '#f7f8f8',
              fontFamily: FS,
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'background 180ms ease, opacity 180ms ease',
            }}
          >
            <GoogleIcon />
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>

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

          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              textAlign: 'center',
              fontSize: '13px',
              color: 'rgba(247,248,248,0.4)',
            }}
          >
            Don't have an account?{' '}
            <Link
              to="/signup"
              style={{
                color: '#f7f8f8',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Sign up
            </Link>
          </div>
        </div>

        <div
          style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '12px',
            fontFamily: FM,
            color: 'rgba(247,248,248,0.25)',
            letterSpacing: '0.04em',
          }}
        >
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>← Back to home</Link>
        </div>
      </motion.div>
    </div>
  )
}
