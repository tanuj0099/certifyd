import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase Service Role or Server Client for logging events server-side
 * (API Routes, Server Actions, Background Pipelines).
 */
function getServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}

/**
 * Server-side equivalent of logEvent for backend flows (e.g. AI extraction / server API).
 */
export async function logEventServer(eventType, eventCategory, properties = {}, opts = {}) {
  try {
    const supabaseServer = getServerSupabaseClient()
    if (!supabaseServer) return

    const payload = {
      user_id: opts.userId || null,
      session_id: opts.sessionId || 'server_session',
      anonymous_id: opts.anonymousId || null,
      event_type: eventType,
      event_category: eventCategory,
      tool_name: opts.toolName || null,
      entity_type: opts.entityType || null,
      entity_id: opts.entityId || null,
      properties: properties || {},
      city: opts.city || null,
      device_type: opts.deviceType || 'server',
      referrer: opts.referrer || null,
      consent_ml_training: Boolean(opts.consentMlTraining),
    }

    const { error } = await supabaseServer.from('events').insert(payload)
    if (error && process.env.NODE_ENV === 'development') {
      console.warn('logEventServer Supabase insert error:', error.message)
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('logEventServer unexpected error:', err)
    }
  }
}

/**
 * Server-side absolute detail certification comparison tracking.
 */
export async function logCertComparisonServer({ certA, certB, userContext = {}, consentMlTraining = false, userId = null, sessionId = 'server_session' }) {
  if (!certA && !certB) return

  const normalizeCertPayload = (c) => {
    if (!c) return null
    return {
      id: c.id || null,
      name: c.name || c.cert_name || 'Unknown Cert',
      domain: c.domain || c.vendor_id || 'All',
      demand_level: c.demand || c.difficulty || 'Medium',
      avg_hike_pct: Number(c.avgHike ?? c.median_roi_percent ?? 0),
      cost_inr: Number(c.avgCost ?? c.cost_inr ?? 0),
      cost_usd: Number(c.avgCostUSD ?? c.cost_usd ?? 0),
      time_months: Number(c.timeMonths ?? c.time_commitment_months ?? 1),
      slug: c.slug || null,
    }
  }

  const certDataA = normalizeCertPayload(certA)
  const certDataB = normalizeCertPayload(certB)

  const properties = {
    comparison_type: certDataA && certDataB ? 'dual_cert_comparison' : 'single_cert_view',
    cert_a: certDataA,
    cert_b: certDataB,
    user_context: userContext,
    compared_at_timestamp: new Date().toISOString(),
  }

  await logEventServer('cert_comparison_performed', 'tool_usage', properties, {
    toolName: 'cert_compare',
    entityType: 'comparison',
    entityId: certDataA?.id || certDataB?.id || null,
    userId,
    sessionId,
    consentMlTraining,
  })
}
