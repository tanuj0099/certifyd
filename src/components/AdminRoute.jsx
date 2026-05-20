import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { isAdminEmail } from '../utils/admin.js'

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
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

  if (!isAdminEmail(user.email)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
