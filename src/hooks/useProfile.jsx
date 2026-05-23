import { useState, useEffect } from 'react'
import { useAuth } from './useAuth.jsx'
import { fetchUserProfile, upsertUserProfile } from '../services/userProfileService.js'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    async function load() {
      try {
        const data = await fetchUserProfile(user.uid || user.id)
        if (!cancelled) setProfile(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [user])

  const updateProfile = async (updates) => {
    if (!user) throw new Error('Not authenticated')
    const updated = await upsertUserProfile(user, updates)
    setProfile(updated)
    return updated
  }

  return { profile, loading, error, updateProfile }
}

export default useProfile
