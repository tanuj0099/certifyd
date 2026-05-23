import { supabase } from '../lib/supabase.js'

export async function fetchAdminDashboard(user) {
  if (!user?.getIdToken) throw new Error('Not signed in')
  const token = await user.getIdToken()
  const response = await fetch('/api/admin/data', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || `Admin API error (${response.status})`)
  }
  return payload
}

export async function checkRateLimit(userId, actionType, sourceIp = null) {
  if (!userId && !sourceIp) {
    throw new Error('Rate limit requires a user or IP identifier.')
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  let query = supabase.from('api_rate_limits').select('id', { count: 'exact' }).gte('created_at', oneHourAgo).eq('action_type', actionType)

  if (userId && sourceIp) {
    query = query.or(`user_id.eq.${userId},ip.eq.${sourceIp}`)
  } else if (userId) {
    query = query.eq('user_id', userId)
  } else {
    query = query.eq('ip', sourceIp)
  }

  const { count, error: countError } = await query
  if (countError) {
    console.warn('Rate limit count lookup failed', countError)
  }

  const existing = typeof count === 'number' ? count : 0
  if (existing >= 5) {
    return { allowed: false, retryAfterSeconds: 3600 }
  }

  const { error: insertError } = await supabase.from('api_rate_limits').insert({
    user_id: userId || null,
    action_type: actionType,
    ip: sourceIp || null,
    created_at: new Date().toISOString(),
  })

  if (insertError) {
    console.warn('Failed to log API rate limit event', insertError)
  }

  return { allowed: true, remaining: Math.max(0, 5 - existing - 1) }
}
