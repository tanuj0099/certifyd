import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

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

  return children
}
