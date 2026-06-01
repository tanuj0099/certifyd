import { useCallback, useEffect, useState } from 'react'
import { MessageSquare, RefreshCw, Users, Database } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'
import { fetchAdminDashboard } from '../services/adminService.js'
import DashboardShell, { DashPanel, DashStat } from '../components/DashboardShell.jsx'

const F_MONO = "'JetBrains Mono', monospace"

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return value
  }
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const payload = await fetchAdminDashboard(user)
      setData(payload)
    } catch (err) {
      setError(err?.message || 'Could not load admin data')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const stats = data?.stats || {}

  return (
    <DashboardShell
      eyebrow="Admin console"
      title="Certify operations"
      subtitle="Live user profiles and feedback from Supabase. Access is restricted to allowlisted admin emails."
      actions={
        <button type="button" className="dash-btn dash-btn--ghost" onClick={load} disabled={loading}>
          <RefreshCw size={14} />
          Refresh
        </button>
      }
    >
      {error ? (
        <DashPanel>
          <p style={{ margin: 0, color: 'var(--err)', fontFamily: F_MONO, fontSize: 13 }}>{error}</p>
        </DashPanel>
      ) : null}

      <div className="dash-grid-4">
        <DashStat label="Registered users" value={loading ? '…' : stats.totalUsers ?? 0} />
        <DashStat label="Active (7 days)" value={loading ? '…' : stats.recentUsers7d ?? 0} />
        <DashStat label="With salary data" value={loading ? '…' : stats.usersWithSalary ?? 0} />
        <DashStat label="Feedback messages" value={loading ? '…' : stats.totalFeedback ?? 0} />
      </div>

      <DashPanel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Users size={16} style={{ color: 'var(--text-3)' }} />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>User profiles</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F_MONO, fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-3)', textAlign: 'left' }}>
                {['Name', 'Email', 'City', 'Role', 'Domain', 'Updated'].map((h) => (
                  <th key={h} style={{ padding: '10px 8px', fontWeight: 600, letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.profiles || []).map((row) => (
                <tr key={row.user_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 8px', color: 'var(--text)' }}>{row.full_name || '—'}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--text-2)' }}>{row.email || '—'}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--text-2)' }}>{row.city || '—'}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--text-2)' }}>{row.job_role || '—'}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--text-2)' }}>{row.target_domain || '—'}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--text-3)' }}>{formatDate(row.updated_at)}</td>
                </tr>
              ))}
              {!loading && !(data?.profiles?.length) ? (
                <tr>
                  <td colSpan={6} style={{ padding: 20, color: 'var(--text-3)', textAlign: 'center' }}>
                    No profiles in Supabase yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </DashPanel>

      <DashPanel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <MessageSquare size={16} style={{ color: 'var(--text-3)' }} />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Feedback & suggestions</h2>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {(data?.feedback || []).map((row) => (
            <div
              key={row.id}
              style={{
                padding: 14,
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13 }}>{row.subject}</span>
                <span style={{ color: 'var(--text-4)', fontSize: 10, fontFamily: F_MONO }}>{row.source} · {formatDate(row.created_at)}</span>
              </div>
              <div style={{ color: 'var(--text-3)', fontSize: 12, marginBottom: 8 }}>
                {row.name} ({row.email})
              </div>
              <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6 }}>{row.message}</p>
            </div>
          ))}
          {!loading && !(data?.feedback?.length) ? (
            <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13 }}>No feedback messages yet.</p>
          ) : null}
        </div>
      </DashPanel>

      <DashPanel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Database size={16} style={{ color: 'var(--text-3)' }} />
          <p style={{ margin: 0, color: 'var(--text-3)', fontFamily: F_MONO, fontSize: 11 }}>
            Signed in as {user?.email} · Data via service role API
          </p>
        </div>
      </DashPanel>
    </DashboardShell>
  )
}
