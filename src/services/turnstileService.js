import { isTurnstileEnabled } from '../components/TurnstileWidget.jsx'

export async function verifyTurnstileToken(token) {
  if (!isTurnstileEnabled()) return true

  const response = await fetch('/api/verify-turnstile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || 'Human verification failed')
  }
  return true
}
