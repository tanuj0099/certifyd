import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    // Render a loading indicator while the auth state is being determined.
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-body)' }}>Loading session...</div>
  }

  if (!user) {
    // User is not authenticated, redirect to the home page.
    // The `authRequired: true` state will be caught by App.jsx to trigger the sign-in modal.
    return <Navigate to="/" state={{ from: location, authRequired: true }} replace />
  }

  return children
}

export default ProtectedRoute