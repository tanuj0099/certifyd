import { supabase } from '../supabase.js'
import { isClientTestMode } from '../testMode.js'

/**
 * Layer 2: Saves a versioned structured entity snapshot (no raw file/PII text).
 * Returns the created snapshot record ID for linking with predictions.
 */
export async function saveEntitySnapshot({
  entityType,
  entityId = null,
  structuredData = {},
  rawFileHash = null,
  modelUsed = 'heuristic-v1',
  extractionConfidence = 1.0,
  consentMlTraining = false,
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
      entity_type: entityType,
      entity_id: entityId || null,
      version: 1,
      structured_data: structuredData || {},
      raw_file_hash: rawFileHash || null,
      model_used: modelUsed,
      extraction_confidence: extractionConfidence,
      consent_ml_training: Boolean(consentMlTraining),
    }

    const { data, error } = await supabase
      .from('entity_snapshots')
      .insert(payload)
      .select('id')
      .single()

    if (error && process.env.NODE_ENV === 'development') {
      console.warn('saveEntitySnapshot error:', error.message)
    }
    return data?.id || null
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('saveEntitySnapshot unexpected error:', err)
    }
    return null
  }
}

/**
 * Layer 2: Logs an exact prediction rendered by a tool (linked to an entity snapshot).
 * Returns the prediction record ID so Layer 3 (outcomes) can link to it later.
 */
export async function logPrediction({
  toolName,
  snapshotId = null,
  prediction = {},
  modelVersion = 'roi-heuristic-v1',
  consentMlTraining = false,
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
      tool_name: toolName,
      snapshot_id: snapshotId || null,
      prediction: prediction || {},
      model_version: modelVersion,
    }

    const { data, error } = await supabase
      .from('predictions')
      .insert(payload)
      .select('id')
      .single()

    if (error && process.env.NODE_ENV === 'development') {
      console.warn('logPrediction error:', error.message)
    }
    return data?.id || null
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('logPrediction unexpected error:', err)
    }
    return null
  }
}
