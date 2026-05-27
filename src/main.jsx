import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import posthog from 'posthog-js'
import { isClientTestMode } from './lib/testMode.js'

// Initialize PostHog (single init as requested). Set env vars in .env:
// VITE_POSTHOG_KEY and optional VITE_POSTHOG_API_HOST (defaults to https://app.posthog.com)
const TEST_MODE = isClientTestMode()
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY
const POSTHOG_API_HOST = import.meta.env.VITE_POSTHOG_API_HOST ?? 'https://app.posthog.com'

if (POSTHOG_KEY && !TEST_MODE) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_API_HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
    autocapture: false,
  })
} else if (import.meta.env.PROD) {
  // eslint-disable-next-line no-console
  console.warn('PostHog not initialized in production: set VITE_POSTHOG_KEY in your .env')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
