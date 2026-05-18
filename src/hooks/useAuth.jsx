import { useState, useEffect, createContext, useContext } from 'react'

// Auth context
const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    let unsubscribe = () => {}

    const initAuth = async () => {
      try {
        const { auth } = await import('../firebase.js')
        if (!auth) {
          setLoading(false)
          return
        }
        const { onAuthStateChanged } = await import('firebase/auth')
        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          setUser(firebaseUser)
          setLoading(false)
          if (firebaseUser) {
            import('../services/userProfileService.js')
              .then(({ syncUserProfile }) => syncUserProfile(firebaseUser))
              .catch((error) => {
                console.warn('Supabase profile sync failed', error)
              })
          }
        })
      } catch (e) {
        console.warn('Auth init failed — Firebase not configured')
        setLoading(false)
      }
    }

    initAuth()
    return () => unsubscribe()
  }, [])

  const signInGoogle = async () => {
    setAuthError(null)
    try {
      const { signInWithGoogle } = await import('../firebase.jsx')
      if (!signInWithGoogle) throw new Error('Firebase not configured — add VITE_FIREBASE_API_KEY to .env')
      const result = await signInWithGoogle()
      return result.user
    } catch (e) {
      const msg = e.code === 'auth/popup-closed-by-user'
        ? 'Sign-in cancelled'
        : e.message || 'Sign-in failed'
      setAuthError(msg)
      throw e
    }
  }

  const signInEmail = async (email, password) => {
    setAuthError(null)
    try {
      const { signInWithEmail } = await import('../firebase.jsx')
      const result = await signInWithEmail(email, password)
      return result.user
    } catch (e) {
      const msg = friendlyAuthError(e)
      setAuthError(msg)
      throw new Error(msg)
    }
  }

  const signUpEmail = async (email, password, displayName) => {
    setAuthError(null)
    try {
      const { signUpWithEmail } = await import('../firebase.jsx')
      const result = await signUpWithEmail(email, password, displayName)
      return result.user
    } catch (e) {
      const msg = friendlyAuthError(e)
      setAuthError(msg)
      throw new Error(msg)
    }
  }

  const resetPassword = async (email) => {
    setAuthError(null)
    try {
      const { sendPasswordReset } = await import('../firebase.jsx')
      await sendPasswordReset(email)
      return true
    } catch (e) {
      const msg = friendlyAuthError(e)
      setAuthError(msg)
      throw new Error(msg)
    }
  }

  const signOut = async () => {
    try {
      const { signOutUser } = await import('../firebase.jsx')
      await signOutUser()
      setUser(null)
    } catch (e) {
      console.error('Sign out error:', e)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, authError, signInGoogle, signInEmail, signUpEmail, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

function friendlyAuthError(error) {
  const code = error?.code || ''
  if (code.includes('invalid-email')) return 'Enter a valid email address.'
  if (code.includes('weak-password')) return 'Use at least 6 characters for your password.'
  if (code.includes('email-already-in-use')) return 'That email already has an account. Try signing in.'
  if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
    return 'Email or password is incorrect.'
  }
  if (code.includes('too-many-requests')) return 'Too many attempts. Please wait and try again.'
  return error?.message || 'Authentication failed.'
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default useAuth
