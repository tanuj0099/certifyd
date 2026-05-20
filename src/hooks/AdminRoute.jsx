import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth.jsx'

const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    // Render a loading indicator while the auth state is being determined.
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-body)' }}>Loading session...</div>
  }

  if (!user) {
    // User is not authenticated, redirect to the home page to trigger sign-in.
    return <Navigate to="/" state={{ from: location, authRequired: true }} replace />
  }

  if (!isAdmin) {
    // User is authenticated but not an admin, redirect to an unauthorized page.
    return <Navigate to="/unauthorized" state={{ from: location }} replace />
  }

  return children
}

export default AdminRoute