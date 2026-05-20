import { getSupabase } from '../_supabase.js'
import { verifyFirebaseAdmin } from '../_verifyFirebase.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await verifyFirebaseAdmin(req.headers.authorization)
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error })

  const supabase = getSupabase()
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured on server' })
  }

  const [profilesRes, feedbackRes] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(250),
    supabase
      .from('feedback_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(150),
  ])

  if (profilesRes.error) {
    return res.status(500).json({ error: profilesRes.error.message })
  }
  if (feedbackRes.error) {
    return res.status(500).json({ error: feedbackRes.error.message })
  }

  const profiles = profilesRes.data || []
  const feedback = feedbackRes.data || []

  return res.status(200).json({
    profiles,
    feedback,
    stats: {
      totalUsers: profiles.length,
      totalFeedback: feedback.length,
      usersWithSalary: profiles.filter((row) => row.current_salary).length,
      recentUsers7d: profiles.filter((row) => {
        if (!row.updated_at) return false
        const updated = new Date(row.updated_at).getTime()
        return Date.now() - updated < 7 * 24 * 60 * 60 * 1000
      }).length,
    },
  })
}
