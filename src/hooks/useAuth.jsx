import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const configured = !!supabase

  useEffect(() => {
    if (!configured) {
      setAuthError('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.')
      setLoading(false)
      return
    }

    // Get initial session safely
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.warn('Supabase session error:', error.message)
          setAuthError(error.message)
        }
        setUser(session?.user || null)
      } catch (err) {
        console.warn('Auth initialization exception:', err)
        setAuthError(err.message)
      } finally {
        setLoading(false)
      }
    }
    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setLoading(false)
      
      if (_event === 'SIGNED_IN') {
        window.history.replaceState(null, '', window.location.pathname);
      }

      // Auto-sync profile to Supabase on login
      if (session?.user) {
        import('../services/userProfileService.js')
          .then(({ syncUserProfile }) => syncUserProfile(session.user))
          .catch((error) => console.warn('Supabase profile sync failed', error))
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [configured])

  const signInGoogle = async () => {
    setAuthError(null)
    if (!configured) throw new Error('Supabase not configured')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      if (error) throw error
    } catch (e) {
      const msg = e?.message || 'Google sign-in failed.'
      setAuthError(msg)
      throw new Error(msg)
    }
  }

  const signInGithub = async () => {
    setAuthError(null)
    if (!configured) throw new Error('Supabase not configured')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      if (error) throw error
    } catch (e) {
      const msg = e?.message || 'GitHub sign-in failed.'
      setAuthError(msg)
      throw new Error(msg)
    }
  }

  const signInEmail = async (email, password) => {
    setAuthError(null)
    if (!configured) throw new Error('Supabase not configured')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (e) {
      const msg = e?.message || 'Email sign-in failed.'
      setAuthError(msg)
      throw new Error(msg)
    }
  }

  const signUpEmail = async (email, password) => {
    setAuthError(null)
    if (!configured) throw new Error('Supabase not configured')
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
    } catch (e) {
      const msg = e?.message || 'Email sign-up failed.'
      setAuthError(msg)
      throw new Error(msg)
    }
  }

  const signInPhone = async (phone) => {
    setAuthError(null)
    if (!configured) throw new Error('Supabase not configured')
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone })
      if (error) throw error
    } catch (e) {
      const msg = e?.message || 'Phone OTP generation failed.'
      setAuthError(msg)
      throw new Error(msg)
    }
  }

  const verifyPhoneOtp = async (phone, token) => {
    setAuthError(null)
    if (!configured) throw new Error('Supabase not configured')
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
      if (error) throw error
    } catch (e) {
      const msg = e?.message || 'OTP verification failed.'
      setAuthError(msg)
      throw new Error(msg)
    }
  }

  const resetPassword = async () => { throw new Error('Password reset is not implemented.') }

  const signOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut()
      }
      setUser(null)
    } catch (e) {
      console.error('Sign out error:', e)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      authError,
      configured,
      signInGoogle,
      signInGithub,
      signInPhone,
      verifyPhoneOtp,
      signInEmail,
      signUpEmail,
      resetPassword,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default useAuth
