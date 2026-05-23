import { supabase } from '../lib/supabase.js'

const PROFILE_TABLE = 'user_profiles'

export function buildUserProfilePayload(user, values = {}) {
  const provider = user?.app_metadata?.provider || user?.providerData?.[0]?.providerId || 'password'
  const now = new Date().toISOString()
  const payload = {
    user_id: user?.id || user?.uid,
    email: values.email || user?.email || '',
    full_name: values.full_name || values.name || user?.user_metadata?.full_name || user?.displayName || '',
    avatar_url: values.avatar_url || user?.user_metadata?.avatar_url || user?.photoURL || '',
    provider,
    last_seen_at: now,
    updated_at: now,
  }

  if ('city' in values) payload.city = values.city || ''
  if ('job_role' in values || 'role' in values) payload.job_role = values.job_role || values.role || ''
  if ('current_salary' in values) payload.current_salary = values.current_salary ? Number(values.current_salary) : null
  if ('target_domain' in values || 'domain' in values) payload.target_domain = values.target_domain || values.domain || ''
  if ('preferences' in values) payload.preferences = values.preferences || {}

  return payload
}

export async function upsertUserProfile(user, values = {}) {
  if (!user?.id && !user?.uid) throw new Error('No authenticated user available.')
  if (!supabase) throw new Error('Supabase is not configured.')

  const payload = buildUserProfilePayload(user, values)
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .maybeSingle()

  if (error) throw error
  return data || payload
}

export async function fetchUserProfile(userId) {
  if (!userId) return null
  if (!supabase) throw new Error('Supabase is not configured.')

  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function syncUserProfile(user) {
  if ((!user?.id && !user?.uid) || !supabase) return null
  return upsertUserProfile(user)
}
