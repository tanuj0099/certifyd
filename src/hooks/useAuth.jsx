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

    const clearStaleSession = async (message) => {
      if (!/refresh token|invalid refresh|not found|network_error|failed to fetch/i.test(message || '')) return false

      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch (_) {}

      setUser(null)
      setAuthError(null)
      return true
    }

    // Get initial session safely
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          if (await clearStaleSession(error.message)) return
          console.warn('Supabase session error:', error.message)
          setAuthError(error.message)
        }
        setUser(session?.user || null)
      } catch (err) {
        if (await clearStaleSession(err?.message)) return
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

  const checkRateLimitBeforeAuth = async (endpoint, fallbackMsg) => {
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      if (res.status === 429) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || fallbackMsg);
      }
    } catch (e) {
      if (e?.message?.includes('Too many') || e?.message?.includes('attempts')) throw e;
    }
  };

  const signInGoogle = async (options = {}) => {
    setAuthError(null)
    if (!configured) throw new Error('Supabase not configured')
    try {
      await checkRateLimitBeforeAuth('/api/auth/login-check', 'Too many login attempts.');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: options.redirectTo || `${window.location.origin}/dashboard`
        }
      })
      if (error) throw error
    } catch (e) {
      const msg = e?.message || 'Google sign-in failed.'
      setAuthError(msg)
      throw new Error(msg)
    }
  }

  const signInGithub = async (options = {}) => {
    setAuthError(null)
    if (!configured) throw new Error('Supabase not configured')
    try {
      await checkRateLimitBeforeAuth('/api/auth/login-check', 'Too many login attempts.');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: options.redirectTo || `${window.location.origin}/dashboard`
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
      await checkRateLimitBeforeAuth('/api/auth/login-check', 'Too many login attempts.');
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (e) {
      let msg = e?.message || 'Email sign-in failed.'
      if (msg.toLowerCase().includes('email not confirmed')) {
        msg = 'Your email address is not confirmed yet! Please check your inbox and click the verification link.'
      } else if (msg.includes('Invalid login credentials')) {
        msg = 'Invalid email or password. Please try again.'
      } else if (msg.includes('Failed to fetch')) {
        msg = 'Network connection failed. Please check your internet connection or disable adblockers.'
      }
      setAuthError(msg)
      throw new Error(msg)
    }
  }

  const signUpEmail = async (email, password) => {
    setAuthError(null)
    if (!configured) throw new Error('Supabase not configured')
    try {
      await checkRateLimitBeforeAuth('/api/auth/signup-check', 'Too many signup attempts.');
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        if (error.message?.toLowerCase().includes('already registered') || error.message?.toLowerCase().includes('already exists') || error.status === 400 || error.status === 422) {
          throw new Error('This email account is already registered! Please switch to Sign In.');
        }
        throw error;
      }
      if (data?.user && data?.user?.identities && data.user.identities.length === 0) {
        throw new Error('This email account is already registered! Please switch to Sign In.');
      }
    } catch (e) {
      let msg = e?.message || 'Email sign-up failed.'
      if (msg.includes('Failed to fetch')) {
        msg = 'Network connection failed. Please check your internet connection or disable adblockers.'
      }
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

  const checkEmailExists = async (email) => {
    if (!email) return false;
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        const payload = await res.json();
        return Boolean(payload.exists);
      }
    } catch (e) {
      console.warn('checkEmailExists error:', e);
    }
    return false;
  };

  const resetPassword = async (email) => {
    setAuthError(null);
    if (!configured) throw new Error('Supabase not configured');
    try {
      await checkRateLimitBeforeAuth('/api/auth/login-check', 'Too many password reset requests.');
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`,
      });
      if (error) throw error;
    } catch (e) {
      const msg = e?.message || 'Failed to send password reset email.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

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
      checkEmailExists,
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
