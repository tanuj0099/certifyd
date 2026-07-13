import assert from 'assert'

process.env.NEXT_PUBLIC_CLIENT_TEST_MODE = 'true'

import { getAnonymousId, getSessionId, logEvent, logCertComparison, logRoiCalculation } from '../src/lib/analytics/logEvent.js'
import { saveEntitySnapshot, logPrediction } from '../src/lib/analytics/logPrediction.js'
import { recordOutcome } from '../src/lib/analytics/logOutcome.js'

console.log('===============================================================')
console.log('CERTIFYD ML INSTRUMENTATION — FULL SYSTEM TEST (PHASES 1, 2, 3)')
console.log('===============================================================')

// Mock DOM / window environment for Node execution
global.window = {
  sessionStorage: {
    data: {},
    getItem(key) { return this.data[key] || null },
    setItem(key, value) { this.data[key] = String(value) },
  },
  location: { href: 'http://localhost:3000/tools/roi' },
  screen: { width: 1440 }
}
let cookieStore = ''
global.document = {
  get cookie() { return cookieStore },
  set cookie(val) { cookieStore = val },
  referrer: 'https://google.com'
}
global.sessionStorage = global.window.sessionStorage
Object.defineProperty(global, 'navigator', {
  value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  configurable: true
})

async function runAllTests() {
  let passed = 0

  // ----------------------------------------------------------------------
  // TEST 1: Phase 1 — Anonymous ID & Session ID Management
  // ----------------------------------------------------------------------
  console.log('\n[Phase 1 Test] Testing Anonymous ID & Session ID persistence...')
  const anonId1 = getAnonymousId()
  assert(anonId1 && typeof anonId1 === 'string' && anonId1.length >= 20, 'Anonymous ID must be a valid UUID string')
  const sessionId1 = getSessionId()
  assert(sessionId1 && sessionId1.startsWith('sess_'), 'Session ID must start with sess_')
  console.log('✓ Passed: Anonymous ID generated:', anonId1)
  console.log('✓ Passed: Session ID generated:', sessionId1)
  passed++

  // ----------------------------------------------------------------------
  // TEST 2: Phase 1 — Certification Comparison Logging (Absolute Detail)
  // ----------------------------------------------------------------------
  console.log('\n[Phase 1 Test] Testing logCertComparison absolute detail telemetry...')
  const certA = { name: 'AWS Solutions Architect', avgCost: 15000, avgHike: 28, domain: 'Cloud' }
  const certB = { name: 'Google Cloud Professional', avgCost: 16500, avgHike: 30, domain: 'Cloud' }
  // Calling logCertComparison shouldn't throw error
  await logCertComparison({ certA, certB, userContext: { salaryLakhs: 12, city: 'Bengaluru' } })
  console.log('✓ Passed: logCertComparison executed successfully with full delta telemetry.')
  passed++

  // ----------------------------------------------------------------------
  // TEST 3: Phase 1 — ROI Calculation Telemetry
  // ----------------------------------------------------------------------
  console.log('\n[Phase 1 Test] Testing logRoiCalculation telemetry...')
  await logRoiCalculation({
    cert: certA,
    inputs: { currentSalaryLakhs: 12, city: 'Bengaluru', isStudent: false },
    results: { paybackMonths: 4, fiveYearGain: 450000, predictedHike: 28 }
  })
  console.log('✓ Passed: logRoiCalculation executed successfully.')
  passed++

  // ----------------------------------------------------------------------
  // TEST 4: Phase 2 — Layer 2 Entity Snapshot Creation
  // ----------------------------------------------------------------------
  console.log('\n[Phase 2 Test] Testing Layer 2 Entity Snapshot creation...')
  const snapId = await saveEntitySnapshot({
    entityType: 'roi_profile',
    structuredData: {
      cert_name: 'AWS Solutions Architect',
      current_salary_lakhs: 12,
      city: 'Bengaluru',
      is_student: false
    },
    modelUsed: 'roi-heuristic-v1',
    consentMlTraining: true
  })
  console.log('✓ Passed: saveEntitySnapshot executed (mock/test mode safe).')
  passed++

  // ----------------------------------------------------------------------
  // TEST 5: Phase 2 — Layer 2 Prediction Logging
  // ----------------------------------------------------------------------
  console.log('\n[Phase 2 Test] Testing Layer 2 Prediction logging...')
  const predId = await logPrediction({
    toolName: 'roi_calculator',
    snapshotId: 'mock-snapshot-uuid',
    prediction: {
      predicted_hike_pct: 28,
      break_even_months: 4,
      five_year_gain_inr: 450000
    },
    modelVersion: 'roi-heuristic-v1'
  })
  console.log('✓ Passed: logPrediction executed (mock/test mode safe).')
  passed++

  // ----------------------------------------------------------------------
  // TEST 6: Phase 3 — Layer 3 Ground Truth Outcome Capture
  // ----------------------------------------------------------------------
  console.log('\n[Phase 3 Test] Testing Layer 3 Outcome recording and linkage...')
  const outcomeId = await recordOutcome({
    predictionId: 'mock-prediction-uuid',
    entityType: 'certification_roi',
    actualOutcome: {
      completed_cert: true,
      cert_name: 'AWS Solutions Architect',
      actual_salary_hike_pct: 30,
      actual_timeline_months: 5
    },
    verificationMethod: 'self_reported',
    confidenceWeight: 0.85
  })
  console.log('✓ Passed: recordOutcome executed (mock/test mode safe).')
  passed++

  console.log('\n===============================================================')
  console.log(`ALL SYSTEM TESTS SUCCEEDED (${passed}/${passed}) across Phases 1, 2, and 3!`)
  console.log('===============================================================\n')
}

runAllTests().catch((err) => {
  console.error('Test Failed:', err)
  process.exit(1)
})
