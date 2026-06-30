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

  // TODO(SECURITY): RACE CONDITION VULNERABILITY DETECTED
  // This JS-level read-then-write is vulnerable to concurrent burst requests.
  // The backend engineer MUST migrate this to a raw Postgres RPC function:
  // e.g., SELECT check_and_increment_rate_limit(p_user_id, p_action, p_max)
  // which uses SELECT FOR UPDATE or an atomic counter table.
  // Below is the vulnerable client-side fallback until the RPC is deployed.

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
    console.error('Rate limit count lookup failed - Failsafe triggered to block bypass', countError)
    // Defense in Depth: Fail securely. Do not allow bypass if DB is down or erroring.
    throw new Error('Internal validation error during rate limit check.')
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
