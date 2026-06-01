import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { MarketingFooter } from '../components/MarketingPageShell.jsx'

const F_SANS = "'Inter', 'DM Sans', sans-serif"
const F_MONO = "'JetBrains Mono', 'IBM Plex Mono', monospace"

export default function UnauthorizedPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <main style={{ width: 'min(100%, 760px)', margin: '0 auto', padding: '132px 24px 72px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', width: '56px', height: '56px', borderRadius: '999px', border: '1px solid var(--border)', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <ShieldAlert size={24} />
        </div>
        <p style={{ margin: '0 0 12px', color: 'var(--text-4)', fontFamily: F_MONO, fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          401 / Unauthorized
        </p>
        <h1 style={{ margin: 0, color: 'var(--text)', fontFamily: F_SANS, fontSize: '36px', lineHeight: 1.08, letterSpacing: 0, fontWeight: 900 }}>
          Sign in to access this page.
        </h1>
        <p style={{ margin: '16px auto 28px', maxWidth: '54ch', color: 'var(--text-2)', fontFamily: F_SANS, fontSize: '15px', lineHeight: 1.75 }}>
          The page exists, but it needs an authenticated Certify account before we can show personal data.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '48px',
            padding: '0 22px',
            borderRadius: '999px',
            border: '1px solid var(--text)',
            background: 'var(--text)',
            color: 'var(--bg)',
            textDecoration: 'none',
            fontFamily: F_SANS,
            fontSize: '13px',
            fontWeight: 900,
          }}
        >
          Back to Home
        </Link>
      </main>
      <MarketingFooter />
    </div>
  )
}
