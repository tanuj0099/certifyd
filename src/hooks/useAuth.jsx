import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase.js'

// Auth context
const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isPro, setIsPro] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    // 1. Check for initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_pro, role')
          .eq('id', session.user.id)
          .single()
        setIsPro(profile?.is_pro || false)
        setIsAdmin(profile?.role === 'admin')
      }
      setLoading(false)
    }
    getInitialSession()

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_pro, role')
          .eq('id', session.user.id)
          .single()
        setIsPro(profile?.is_pro || false)
        setIsAdmin(profile?.role === 'admin')
      } else {
        setIsPro(false)
        setIsAdmin(false)
      }
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const signInGoogle = async () => {
    setAuthError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) {
      setAuthError(error.message)
      throw error
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
    } else {
      setUser(null)
      setIsPro(false)
      setIsAdmin(false)
    }
  }

  const value = { user, isPro, isAdmin, loading, authError, signInGoogle, signOut }

  return (
    <AuthContext.Provider value={value}>
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
