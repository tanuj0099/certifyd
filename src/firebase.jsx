// ============================================================
// CertifyROI Firebase Configuration
// ============================================================

import { initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  GithubAuthProvider,
  GoogleAuthProvider,
  RecaptchaVerifier,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const PLACEHOLDER_VALUES = new Set([
  'YOUR_API_KEY',
  'YOUR_AUTH_DOMAIN',
  'YOUR_PROJECT_ID',
  'YOUR_STORAGE_BUCKET',
  'YOUR_SENDER_ID',
  'YOUR_APP_ID',
])

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

function hasValidConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    !PLACEHOLDER_VALUES.has(firebaseConfig.apiKey) &&
    !PLACEHOLDER_VALUES.has(firebaseConfig.authDomain) &&
    !PLACEHOLDER_VALUES.has(firebaseConfig.projectId)
  )
}

export const isFirebaseConfigured = hasValidConfig

let app = null
let auth = null
let db = null

if (hasValidConfig()) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
  } catch (error) {
    console.error('Firebase initialization failed:', error)
  }
} else if (import.meta.env.DEV) {
  console.warn(
    'Firebase is not configured. Add VITE_FIREBASE_* variables to .env.local and enable Google + Email/Password in Firebase Console.'
  )
}

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

const githubProvider = new GithubAuthProvider()
githubProvider.addScope('read:user')
githubProvider.addScope('user:email')

function assertAuth() {
  if (!auth) {
    throw new Error(
      'Firebase is not configured. Add VITE_FIREBASE_API_KEY and related keys to .env.local, then restart the dev server.'
    )
  }
}

export const signInWithGoogle = async () => {
  assertAuth()
  return signInWithPopup(auth, googleProvider)
}

export const signInWithGithub = async () => {
  assertAuth()
  return signInWithPopup(auth, githubProvider)
}

export const signInWithEmail = async (email, password) => {
  assertAuth()
  return signInWithEmailAndPassword(auth, email, password)
}

export const signUpWithEmail = async (email, password, displayName = '') => {
  assertAuth()
  const result = await createUserWithEmailAndPassword(auth, email, password)
  if (displayName) {
    await updateProfile(result.user, { displayName })
  }
  return result
}

export const sendPasswordReset = async (email) => {
  assertAuth()
  return sendPasswordResetEmail(auth, email)
}

export const setupRecaptcha = (elementId) => {
  assertAuth()
  return new RecaptchaVerifier(auth, elementId, {
    size: 'invisible',
    callback: () => {},
  })
}

export const sendPhoneOTP = async (phoneNumber, appVerifier) => {
  assertAuth()
  return signInWithPhoneNumber(auth, phoneNumber, appVerifier)
}

export const signOutUser = async () => {
  assertAuth()
  return signOut(auth)
}

export { auth, db }
export default app
