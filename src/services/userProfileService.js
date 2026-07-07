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
  if ('job_role' in values || 'role' in values || 'career_stage' in values) {
    payload.job_role = values.job_role || values.role || values.career_stage || ''
  }
  if ('current_salary' in values) payload.current_salary = values.current_salary ? Number(values.current_salary) : null
  if ('current_salary_band' in values) payload.current_salary_band = values.current_salary_band || ''
  if ('target_domain' in values || 'domain' in values) payload.target_domain = values.target_domain || values.domain || ''
  if ('target_salary_goal' in values) payload.target_salary_goal = values.target_salary_goal || ''
  if ('weekly_hours' in values) payload.weekly_hours = values.weekly_hours || ''
  if ('motivation' in values) payload.motivation = values.motivation || ''
  if ('onboarding_complete' in values) payload.onboarding_complete = Boolean(values.onboarding_complete)

  // Put fields without dedicated SQL columns into preferences JSONB
  const preferences = { ...(values.preferences || {}) };
  if ('career_stage' in values) preferences.career_stage = values.career_stage || '';
  if ('primary_intent' in values) preferences.primary_intent = values.primary_intent || '';
  if ('profile_completion_pct' in values) preferences.profile_completion_pct = Number(values.profile_completion_pct);
  if ('is_remote' in values) preferences.is_remote = Boolean(values.is_remote);
  payload.preferences = preferences;

  return payload
}

function formatProfileResponse(data) {
  if (!data) return null;
  return {
    ...data,
    career_stage: data.preferences?.career_stage || data.job_role || '',
    primary_intent: data.preferences?.primary_intent || '',
    profile_completion_pct: data.preferences?.profile_completion_pct || 0,
    is_remote: data.preferences?.is_remote || false
  };
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
  return formatProfileResponse(data || payload)
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
  return formatProfileResponse(data)
}

export async function syncUserProfile(user) {
  if ((!user?.id && !user?.uid) || !supabase) return null
  return upsertUserProfile(user)
}

export async function updateUserAvatar(user, avatarUrl) {
  if (!user || !supabase) return;
  
  // Update Supabase Auth user metadata
  const { error: authError } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl }
  });
  if (authError) throw authError;

  // Update user_profiles table
  const { error: dbError } = await supabase
    .from(PROFILE_TABLE)
    .update({ avatar_url: avatarUrl })
    .eq('user_id', user.id || user.uid);
    
  if (dbError) throw dbError;
}
