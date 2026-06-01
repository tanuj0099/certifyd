'use client';

import { useRouter } from 'next/navigation';

import Link from 'next/link';
import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'

export default function WorkspaceHeader({ title, breadcrumb = [] }) {
  const { user } = useAuth()
  const router = useRouter()

  return (
    <div style={{ position: 'sticky', top: 12, zIndex: 40, display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0' }}>
      <button
        type="button"
        onClick={() => router.push('/')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 38,
          height: 38,
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'transparent',
          cursor: 'pointer',
        }}
        aria-label="Go home"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 13v6a1 1 0 001 1h3v-5h8v5h3a1 1 0 001-1v-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <nav style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-3)', fontSize: 13 }} aria-label="Breadcrumb">
        <Link href="/" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>Workspace</Link>
        {breadcrumb.map((b, i) => (
          <span key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ opacity: 0.5 }}>/</span>
            {b.href ? <Link href={b.href} style={{ color: 'var(--text-3)', textDecoration: 'none' }}>{b.label}</Link> : <span style={{ color: 'var(--text)' }}>{b.label}</span>}
          </span>
        ))}
      </nav>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: 8, fontSize: 12, color: 'var(--text-3)' }}>K</div>
      </div>
    </div>
  )
}
