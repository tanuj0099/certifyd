import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase.js'

/**
 * OnboardingGate — wraps protected routes that require a completed profile.
 *
 * Flow:
 *  1. User must be signed in (else → /)
 *  2. Supabase profiles table is checked for onboarding_complete = true
 *  3. If profile is missing or incomplete → /onboarding
 *  4. If complete → render children
 *
 * Does NOT redirect if Supabase is unavailable (graceful degradation).
 */
export default function OnboardingGate({ children }) {
  const { user, loading: authLoading } = useAuth()
  const location = useLocation()
  const [profileChecked, setProfileChecked] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    if (authLoading || !user) return
    if (!supabase) {
      // Supabase not configured — skip onboarding check, let user through
      setProfileChecked(true)
      return
    }

    let cancelled = false

    async function checkProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', user.uid || user.id)
          .maybeSingle()

        if (cancelled) return
        if (error) {
          // Network error — don't block the user
          console.warn('OnboardingGate: profile check failed', error)
          setProfileChecked(true)
          return
        }

        const complete = data?.onboarding_complete === true
        setNeedsOnboarding(!complete)
        setProfileChecked(true)
      } catch (err) {
        if (!cancelled) {
          console.warn('OnboardingGate: unexpected error', err)
          setProfileChecked(true)
        }
      }
    }

    checkProfile()
    return () => { cancelled = true }
  }, [user, authLoading])

  // Auth still loading
  if (authLoading) {
    return (
      <div style={{
        minHeight: '40vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-3)',
        fontFamily: 'var(--font-sans)',
      }}>
        Loading account...
      </div>
    )
  }

  // Not signed in → root
  if (!user) {
    return <Navigate to="/" replace state={{ authRequired: true, from: location.pathname }} />
  }

  // Profile check still in-flight
  if (!profileChecked) {
    return (
      <div style={{
        minHeight: '40vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-3)',
        fontFamily: 'var(--font-sans)',
      }}>
        Preparing your workspace...
      </div>
    )
  }

  // New user — redirect to onboarding
  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
