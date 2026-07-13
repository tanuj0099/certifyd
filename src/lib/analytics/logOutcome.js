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

    const payload = {
      user_id: userId,
      prediction_id: predictionId || null,
      entity_type: entityType,
      actual_outcome: actualOutcome || {},
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
