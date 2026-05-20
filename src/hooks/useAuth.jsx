import { useState, useEffect, createContext, useContext } from 'react'
import { auth, isFirebaseConfigured } from '../firebase.jsx'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const [configured, setConfigured] = useState(isFirebaseConfigured())

  useEffect(() => {
    if (!configured || !auth) {
      setLoading(false)
      if (!configured) {
        setAuthError('Firebase is not configured. Add VITE_FIREBASE_* keys to .env.local.')
      }
      return undefined
    }

    let unsubscribe = () => {}

    const initAuth = async () => {
      try {
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
      } catch (error) {
        console.warn('Auth init failed', error)
        setAuthError('Authentication could not be initialized.')
        setLoading(false)
      }
    }

    initAuth()
    return () => unsubscribe()
  }, [configured])

  const signInGoogle = async () => {
    setAuthError(null)
    try {
      const { signInWithGoogle } = await import('../firebase.jsx')
      const result = await signInWithGoogle()
      return result.user
    } catch (e) {
      const msg = e.code === 'auth/popup-closed-by-user'
        ? 'Sign-in cancelled'
        : friendlyAuthError(e)
      setAuthError(msg)
      throw new Error(msg)
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
    <AuthContext.Provider value={{
      user,
      loading,
      authError,
      configured,
      signInGoogle,
      signInEmail,
      signUpEmail,
      resetPassword,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

function friendlyAuthError(error) {
  const code = error?.code || ''
  if (code.includes('invalid-api-key')) {
    return 'Firebase API key is invalid. Check VITE_FIREBASE_API_KEY in .env.local.'
  }
  if (code.includes('unauthorized-domain')) {
    return 'This domain is not authorized in Firebase Console.'
  }
  if (code.includes('operation-not-allowed')) {
    return 'This sign-in method is disabled in Firebase Console.'
  }
  if (code.includes('invalid-email')) return 'Enter a valid email address.'
  if (code.includes('weak-password')) return 'Use at least 6 characters for your password.'
  if (code.includes('email-already-in-use')) return 'That email already has an account. Try signing in.'
  if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
    return 'Email or password is incorrect.'
  }
  if (code.includes('too-many-requests')) return 'Too many attempts. Please wait and try again.'
  if (code.includes('popup-blocked')) return 'Popup was blocked. Allow popups for this site and try again.'
  return error?.message || 'Authentication failed.'
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default useAuth
