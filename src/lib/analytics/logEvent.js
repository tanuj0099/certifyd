import { supabase } from '../supabase.js'
import { isClientTestMode } from '../testMode.js'

// ============================================================================
// COOKIE & SESSION HELPERS FOR FUNNEL TRACKING (ANONYMOUS -> AUTHENTICATED)
// ============================================================================

const ANON_COOKIE_NAME = 'certifyd_anon_id'
const SESSION_STORAGE_KEY = 'certifyd_session_id'

function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Reads or creates a persistent anonymous_id stored in a 1-year cookie.
 * Links pre-signup behavior to post-signup auth.users(id).
 */
export function getAnonymousId() {
  if (typeof document === 'undefined') return null

  // 1. Try reading cookie
  const match = document.cookie.match(new RegExp('(^| )' + ANON_COOKIE_NAME + '=([^;]+)'))
  if (match && match[2]) {
    return match[2]
  }

  // 2. Otherwise generate new UUID and persist for 1 year
  const newAnonId = generateUUID()
  const oneYearSeconds = 60 * 60 * 24 * 365
  document.cookie = `${ANON_COOKIE_NAME}=${newAnonId}; max-age=${oneYearSeconds}; path=/; SameSite=Lax`
  return newAnonId
}

/**
 * Reads or creates a stable session_id stored in sessionStorage (per browser tab session).
 */
export function getSessionId() {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return 'server_session'
  }
  let sid = sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (!sid) {
    sid = 'sess_' + Date.now().toString(36) + '_' + generateUUID().slice(0, 8)
    sessionStorage.setItem(SESSION_STORAGE_KEY, sid)
  }
  return sid
}

/**
 * Categorizes device type as 'mobile' | 'tablet' | 'desktop'.
 */
function getDeviceType() {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent.toLowerCase()
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile'
  }
  return 'desktop'
}

// ============================================================================
// CORE CLIENT EVENT INSTRUMENTATION (BLACK BOX RECORDER LAYER 1)
// ============================================================================

/**
 * Appends a structured telemetry event to public.events table.
 * Fire-and-forget, non-blocking, fail-silent in production.
 *
 * @param {string} eventType - Unique action identifier (e.g. 'cert_comparison_performed')
 * @param {string} eventCategory - 'tool_usage' | 'profile' | 'navigation' | 'consent'
 * @param {object} properties - Structured JSONB payload
 * @param {object} opts - Optional metadata { toolName, entityType, entityId, city, consentMlTraining }
 */
export async function logEvent(eventType, eventCategory, properties = {}, opts = {}) {
  try {
    if (isClientTestMode()) return

    const anonymousId = getAnonymousId()
    const sessionId = getSessionId()
    const deviceType = getDeviceType()
    const referrer = typeof document !== 'undefined' ? document.referrer || null : null

    // Get current authenticated user ID non-blocking (null if anonymous)
    let userId = null
    try {
      const { data } = await supabase.auth.getSession()
      userId = data?.session?.user?.id || null
    } catch {
      userId = null
    }

    const payload = {
      user_id: userId,
      session_id: sessionId,
      anonymous_id: anonymousId,
      event_type: eventType,
      event_category: eventCategory,
      tool_name: opts.toolName || null,
      entity_type: opts.entityType || null,
      entity_id: opts.entityId || null,
      properties: properties || {},
      city: opts.city || null,
      device_type: deviceType,
      referrer: referrer,
      consent_ml_training: Boolean(opts.consentMlTraining),
    }

    // Non-blocking fire-and-forget insert
    supabase
      .from('events')
      .insert(payload)
      .then(({ error }) => {
        if (error && process.env.NODE_ENV === 'development') {
          console.warn('logEvent Supabase insert error:', error.message, error)
        }
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('logEvent request failed:', err)
        }
      })
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('logEvent unexpected error:', err)
    }
  }
}

// ============================================================================
// TOP PRIORITY: ABSOLUTE DETAIL CERTIFICATION COMPARISON LOGGING
// ============================================================================

/**
 * Logs in absolute detail what certifications the user is comparing.
 * Captures full normalized attributes for Cert A and Cert B, delta comparisons,
 * and user context to build high-quality ML training records.
 *
 * @param {object} params
 * @param {object} params.certA - Normalized Cert A object
 * @param {object} params.certB - Normalized Cert B object
 * @param {object} [params.userContext] - { currentSalaryLakhs, city, experienceYears, role }
 * @param {boolean} [params.consentMlTraining] - Whether user opted into ML training
 */
export function logCertComparison({ certA, certB, userContext = {}, consentMlTraining = false } = {}) {
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

  // Compute precise delta between compared certifications
  const comparisonDelta =
    certDataA && certDataB
      ? {
          cost_diff_inr: certDataB.cost_inr - certDataA.cost_inr,
          hike_diff_pct: certDataB.avg_hike_pct - certDataA.avg_hike_pct,
          time_diff_months: certDataB.time_months - certDataA.time_months,
          higher_roi_cert:
            certDataB.avg_hike_pct > certDataA.avg_hike_pct
              ? certDataB.name
              : certDataA.avg_hike_pct > certDataB.avg_hike_pct
              ? certDataA.name
              : 'Equal',
        }
      : null

  const properties = {
    comparison_type: certDataA && certDataB ? 'dual_cert_comparison' : 'single_cert_view',
    cert_a: certDataA,
    cert_b: certDataB,
    comparison_delta: comparisonDelta,
    user_context: {
      current_salary_lakhs: Number(userContext.currentSalaryLakhs || 0) || null,
      city: userContext.city || null,
      experience_years: Number(userContext.experienceYears || 0) || null,
      target_role: userContext.targetRole || null,
    },
    compared_at_timestamp: new Date().toISOString(),
  }

  logEvent('cert_comparison_performed', 'tool_usage', properties, {
    toolName: 'cert_compare',
    entityType: 'comparison',
    entityId: certDataA?.id || certDataB?.id || null,
    city: userContext.city || null,
    consentMlTraining,
  })
}

// ============================================================================
// TOP PRIORITY: ABSOLUTE DETAIL ROI CALCULATION LOGGING
// ============================================================================

/**
 * Logs in absolute detail what certification the user calculated ROI for,
 * including exact inputs and predicted outcomes.
 */
export function logRoiCalculation({ cert, inputs = {}, results = {}, consentMlTraining = false } = {}) {
  if (!cert) return

  const properties = {
    certification: {
      id: cert.id || null,
      name: cert.name || cert.cert_name || 'Unknown Cert',
      domain: cert.domain || cert.vendor_id || null,
      cost_inr: Number(cert.avgCost ?? cert.cost_inr ?? 0),
      expected_hike_pct: Number(cert.avgHike ?? cert.median_roi_percent ?? 0),
      time_months: Number(cert.timeMonths ?? cert.time_commitment_months ?? 1),
      demand_level: cert.demand || cert.difficulty || null,
    },
    user_inputs: {
      current_salary_lakhs: Number(inputs.currentSalaryLakhs ?? inputs.salary ?? 0),
      experience_years: Number(inputs.experienceYears ?? 0),
      study_hours_per_week: Number(inputs.studyHoursPerWeek ?? 10),
      city: inputs.city || null,
      is_student: Boolean(inputs.isStudent),
    },
    predicted_results: {
      payback_months: Number(results.paybackMonths ?? results.payback ?? 0) || null,
      five_year_gain_inr: Number(results.fiveYearGain ?? results.gain5Yr ?? 0) || null,
      predicted_hike_pct: Number(results.predictedHike ?? cert.avgHike ?? 0) || null,
      model_version: results.modelVersion || 'roi-heuristic-v1',
    },
  }

  logEvent('roi_calc_submitted', 'tool_usage', properties, {
    toolName: 'roi_calculator',
    entityType: 'certification',
    entityId: cert.id || null,
    city: inputs.city || null,
    consentMlTraining,
  })
}

/**
 * Links anonymous_id to authenticated user upon signup / login.
 */
export function logAnonymousToUserLinked(userId, consentMlTraining = false) {
  const anonymousId = getAnonymousId()
  logEvent(
    'anonymous_to_user_linked',
    'session',
    {
      anonymous_id: anonymousId,
      new_user_id: userId,
    },
    {
      entityType: 'profile',
      entityId: userId,
      consentMlTraining,
    }
  )
}
