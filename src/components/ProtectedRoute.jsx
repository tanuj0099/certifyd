'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.jsx'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = { pathname: usePathname() }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '40vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-3)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Loading account...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace state={{ authRequired: true, from: location.pathname }} />
  }

  // If user signed up via email, block access until they verify
  if (user.email && !user.email_confirmed_at && user.app_metadata?.provider === 'email') {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 400, padding: 32, textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(217, 72, 72, 0.1)', color: 'var(--err)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 18, color: 'var(--text)' }}>Verify your email</h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6 }}>
            We've sent a confirmation link to <strong>{user.email}</strong>. Please check your inbox (and spam folder) to activate your account.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--accent)', color: 'var(--bg)', border: 'none', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}
          >
            I've verified my email
          </button>
        </div>
      </div>
    )
  }

  return children
}
