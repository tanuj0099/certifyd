// ============================================================
// CertifyROI Firebase Configuration
// ============================================================
// Setup instructions:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project named "certifyroi"
// 3. Add a Web app (</> icon)
// 4. Copy the firebaseConfig object below
// 5. Enable Authentication → Sign-in methods:
//    - Google (easy, 2 clicks)
//    - Phone (requires billing account for SMS)
// 6. Enable Firestore Database (start in test mode)
// ============================================================

import { initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
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

// TODO: Replace with your Firebase config from console.firebase.google.com
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
}

// Initialize Firebase
let app, auth, db

try {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
} catch (error) {
  console.warn('Firebase not configured yet. Auth features will be disabled.')
  console.warn('See firebase.jsx for setup instructions.')
}

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

// Sign in with Google
export const signInWithGoogle = async () => {
  if (!auth) throw new Error('Firebase not configured')
  return signInWithPopup(auth, googleProvider)
}

export const signInWithEmail = async (email, password) => {
  if (!auth) throw new Error('Firebase not configured')
  return signInWithEmailAndPassword(auth, email, password)
}

export const signUpWithEmail = async (email, password, displayName = '') => {
  if (!auth) throw new Error('Firebase not configured')
  const result = await createUserWithEmailAndPassword(auth, email, password)
  if (displayName) {
    await updateProfile(result.user, { displayName })
  }
  return result
}

export const sendPasswordReset = async (email) => {
  if (!auth) throw new Error('Firebase not configured')
  return sendPasswordResetEmail(auth, email)
}

// Setup reCAPTCHA for phone auth (call this once, passing the button element ID)
export const setupRecaptcha = (elementId) => {
  if (!auth) throw new Error('Firebase not configured')
  return new RecaptchaVerifier(auth, elementId, {
    size: 'invisible',
    callback: () => {},
  })
}

// Send OTP to phone number
export const sendPhoneOTP = async (phoneNumber, appVerifier) => {
  if (!auth) throw new Error('Firebase not configured')
  return signInWithPhoneNumber(auth, phoneNumber, appVerifier)
}

// Sign out
export const signOutUser = async () => {
  if (!auth) throw new Error('Firebase not configured')
  return signOut(auth)
}

export { auth, db }
export default app
