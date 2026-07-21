import { supabase } from '../supabase.js'
import { isClientTestMode } from '../testMode.js'

/**
 * Layer 3: Records a verified or self-reported ground truth outcome and links it back
 * to the original Layer 2 prediction record if predictionId is provided.
 */
export async function recordOutcome({
  predictionId = null,
  entityType = 'certification_roi',
  actualOutcome = {},
  contributingFactors = [],
  monthsSinceCert = null,
  verificationMethod = 'self_reported',
  confidenceWeight = 0.8,
}) {
  try {
    if (isClientTestMode()) return null

    let userId = null
    try {
      const { data } = await supabase.auth.getSession()
      userId = data?.session?.user?.id || null
    } catch {
      userId = null
    }

    // B2: Calculate months_since_cert automatically when an outcome is recorded
    // if predictionId is provided and we haven't been explicitly passed monthsSinceCert
    let computedMonthsSinceCert = monthsSinceCert !== null ? Number(monthsSinceCert) : null
    if (predictionId && computedMonthsSinceCert === null) {
      try {
        const { data: predData } = await supabase
          .from('predictions')
          .select('created_at, snapshot_id, entity_snapshots(created_at)')
          .eq('id', predictionId)
          .maybeSingle()

        const snapshotDateStr = predData?.entity_snapshots?.created_at || predData?.created_at
        if (snapshotDateStr) {
          const snapshotDate = new Date(snapshotDateStr)
          const now = new Date()
          const diffMs = now.getTime() - snapshotDate.getTime()
          // Proximity signal: calculate gap between snapshot date and confirmation date in months.
          // NOTE FOR ANALYSTS: If diff is < 30 days (< 1 month), the cert is likely too recent to be causal, treat as noise.
          computedMonthsSinceCert = Number((diffMs / (1000 * 60 * 60 * 24 * 30.4375)).toFixed(2))
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Could not compute monthsSinceCert from prediction:', e.message)
        }
      }
    }

    const outcomeDataObj = {
      ...actualOutcome,
      contributing_factors: contributingFactors,
      months_since_cert: computedMonthsSinceCert !== null ? computedMonthsSinceCert : actualOutcome.actual_timeline_months || null,
    }

    const payload = {
      user_id: userId,
      prediction_id: predictionId || null,
      entity_type: entityType,
      actual_outcome: actualOutcome || {},
      outcome_data: outcomeDataObj,
      contributing_factors: contributingFactors,
      months_since_cert: computedMonthsSinceCert !== null ? computedMonthsSinceCert : (actualOutcome.actual_timeline_months || null),
      verification_method: verificationMethod,
      confidence_weight: confidenceWeight,
    }

    const { data, error } = await supabase
      .from('outcomes')
      .insert(payload)
      .select('id')
      .single()

    if (error && process.env.NODE_ENV === 'development') {
      console.warn('recordOutcome insert error:', error.message)
    }

    // Link back to prediction if predictionId exists
    if (data?.id && predictionId) {
      await supabase
        .from('predictions')
        .update({
          outcome_id: data.id,
          outcome_captured_at: new Date().toISOString(),
        })
        .eq('id', predictionId)
    }

    return data?.id || null
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('recordOutcome unexpected error:', err)
    }
    return null
  }
}

