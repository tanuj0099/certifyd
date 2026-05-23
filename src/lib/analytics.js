import posthog from 'posthog-js'

function safeCapture(eventName, properties = {}) {
  try {
    if (posthog && typeof posthog.capture === 'function') {
      posthog.capture(eventName, properties)
    }
  } catch (e) {
    // swallow errors to avoid breaking the app when analytics fails
    // eslint-disable-next-line no-console
    console.debug('PostHog capture failed', e)
  }
}

export function trackCertSelected({ certId, certName } = {}) {
  return safeCapture('cert_selected', { certId, certName })
}

export function trackRoiCalculated(payload = {}) {
  return safeCapture('roi_calculated', payload)
}

export function trackAiAnalysisRun(payload = {}) {
  return safeCapture('ai_analysis_run', payload)
}

export function trackResumeUploaded({ filename, sizeBytes } = {}) {
  return safeCapture('resume_uploaded', { filename, sizeBytes })
}

export function trackShareCardGenerated(payload = {}) {
  return safeCapture('share_card_generated', payload)
}

const analytics = {
  trackCertSelected,
  trackRoiCalculated,
  trackAiAnalysisRun,
  trackResumeUploaded,
  trackShareCardGenerated,
}

export default analytics
