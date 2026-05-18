import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { upsertUserProfile } from '../services/userProfileService.js'

// ── Local storage key ──────────────────────────────────────
const LS_KEY = 'croi_profile'

function getLocalProfile() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function setLocalProfile(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {}
}

// ── useProfile ────────────────────────────────────────────
// Returns: { profile, loading, startCert, completeCert, updateProfile }
//
// `profile` shape:
//   { name, city, company, currentSalary, activeCert, certHistory: [] }
//
// Works with Firebase Firestore when the user is signed in.
// Gracefully degrades to localStorage if Firebase is not configured.
//
export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)

  // ── Load profile ────────────────────────────────────────
  useEffect(function() {
    var cancelled = false
    setLoading(true)

    async function load() {
      // Authenticated — try Firestore first
      if (user) {
        try {
          const { db } = await import('../firebase.js')
          if (db) {
            const { doc, getDoc } = await import('firebase/firestore')
            const snap = await getDoc(doc(db, 'profiles', user.uid))
            if (!cancelled) {
              var data = snap.exists() ? snap.data() : buildDefaultProfile(user)
              setProfile(data)
              setLoading(false)
              return
            }
          }
        } catch (e) {
          console.warn('Firestore read failed — using localStorage fallback', e)
        }

        // Firestore failed — use localStorage with display name from auth
        if (!cancelled) {
          var local = getLocalProfile() || buildDefaultProfile(user)
          setProfile(local)
          setLoading(false)
        }
        return
      }

      // Not signed in — localStorage only
      if (!cancelled) {
        setProfile(getLocalProfile())
        setLoading(false)
      }
    }

    load()
    return function() { cancelled = true }
  }, [user])

  // ── Persist helper ──────────────────────────────────────
  var persist = useCallback(async function(updated) {
    setProfile(updated)
    setLocalProfile(updated)

    if (user) {
      try {
        await upsertUserProfile(user, updated)
      } catch (e) {
        console.warn('Supabase profile write failed - continuing with Firebase/local copy', e)
      }

      try {
        const { db } = await import('../firebase.js')
        if (db) {
          const { doc, setDoc } = await import('firebase/firestore')
          await setDoc(doc(db, 'profiles', user.uid), updated, { merge: true })
        }
      } catch (e) {
        console.warn('Firestore write failed — saved locally only', e)
      }
    }
  }, [user])

  // ── updateProfile ───────────────────────────────────────
  var updateProfile = useCallback(function(fields) {
    var updated = Object.assign({}, profile || {}, fields)
    persist(updated)
  }, [profile, persist])

  // ── startCert ───────────────────────────────────────────
  // Marks a cert as actively being studied
  var startCert = useCallback(function(certName) {
    var updated = Object.assign({}, profile || {}, {
      activeCert: {
        certName: certName,
        startedAt: new Date().toISOString(),
      }
    })
    persist(updated)
  }, [profile, persist])

  // ── completeCert ─────────────────────────────────────────
  // Moves activeCert → certHistory with hike data
  var completeCert = useCallback(function({ certName, salaryBefore, salaryAfter, hikeAchieved }) {
    var history = (profile?.certHistory || []).filter(function(h) {
      return h.certName?.toLowerCase() !== certName?.toLowerCase()
    })
    history.push({
      certName:      certName,
      salaryBefore:  salaryBefore,
      salaryAfter:   salaryAfter,
      hikeAchieved:  hikeAchieved,
      completedAt:   new Date().toISOString(),
    })
    var updated = Object.assign({}, profile || {}, {
      certHistory: history,
      activeCert:  null,
    })
    persist(updated)
  }, [profile, persist])

  return { profile, loading, updateProfile, startCert, completeCert }
}

// ── Default profile from Firebase auth user ───────────────
function buildDefaultProfile(user) {
  return {
    name:          user?.displayName || '',
    email:         user?.email       || '',
    city:          '',
    company:       '',
    currentSalary: null,
    activeCert:    null,
    certHistory:   [],
  }
}

export default useProfile
