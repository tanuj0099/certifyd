import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { useState, useEffect } from 'react'

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(null)

  useEffect(() => {
    if (user && user.email) {
      fetch('/api/admin-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })
      .then(res => res.json())
      .then(data => setIsAdmin(data.isAdmin))
      .catch(() => setIsAdmin(false))
    } else {
      setIsAdmin(false)
    }
  }, [user])

  if (loading || isAdmin === null) {
    return (
    <div
        className="dash-page"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}
      >
        <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }}>
          Verifying admin access...
        </span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace state={{ authRequired: true, from: '/admin' }} />
  }

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
