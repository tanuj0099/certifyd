import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase.js'
import SkeletonLoader from './SkeletonLoader.jsx'

/**
 * OnboardingGate — wraps protected routes that require a completed profile.
 *
 * Flow:
 *  1. User must be signed in (else → /)
 *  2. Supabase 'profiles' table is checked for onboarding_complete = true
 *  3. If profile is missing or incomplete → /onboarding
 *  4. If complete → render children
 *
 * Does NOT redirect if Supabase is unavailable (graceful degradation).
 * Does NOT redirect to /onboarding if already on /onboarding (prevents ping-pong loops).
 *
 * CRITICAL: useEffect dependency uses user.uid (a stable string) NOT the user object
 * reference — using the object would cause infinite re-renders because Firebase/Supabase
 * re-creates the user object on every auth state subscription tick.
 */
export default function OnboardingGate({ children }) {
  const { user, loading: authLoading } = useAuth()
  const location = useLocation()

  const [profileChecked, setProfileChecked] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  // Stable user identity string — avoids object reference churn in deps
  const userId = user?.uid || user?.id || null

  // Track the last userId we ran a check for — skip duplicate runs
  const lastCheckedRef = useRef(null)

  useEffect(() => {
    // Wait for auth to settle
    if (authLoading) return
    // No user — nothing to check
    if (!userId) return
    // Already checked this exact user — prevent re-fire
    if (lastCheckedRef.current === userId) return
    // Supabase not configured — pass user through without blocking
    if (!supabase) {
      lastCheckedRef.current = userId
      setProfileChecked(true)
      return
    }

    let cancelled = false
    lastCheckedRef.current = userId

    async function checkProfile() {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (cancelled) return

        if (error || !data) {
          if (!cancelled) setNeedsOnboarding(true)
        } else {
          // If data exists, check if onboarding is strictly marked incomplete if we had such a flag,
          // else simply presence of profile implies not needing onboarding.
          if (!cancelled) setNeedsOnboarding(false)
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Profile gate check exception:", err)
        }
      } finally {
        if (!cancelled) {
          setProfileChecked(true)
        }
      }
    }

    checkProfile()
    return () => {
      cancelled = true
      lastCheckedRef.current = null
    }
  }, [userId, authLoading]) // stable primitives only — no object references

  // Auth still loading
  if (authLoading) {
    return <SkeletonLoader type="dashboard" />
  }

  // Not signed in → root (preserve the attempted path in state)
  if (!user) {
    return <Navigate to="/" replace state={{ authRequired: true, from: location.pathname }} />
  }

  // Profile check still in-flight
  if (!profileChecked) {
    return <SkeletonLoader type="dashboard" />
  }

  // New user needs onboarding — but never redirect to /onboarding from /onboarding itself
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
