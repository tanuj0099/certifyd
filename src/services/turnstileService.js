export function isTurnstileEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
}

export async function verifyTurnstileToken(token) {
  if (!isTurnstileEnabled()) return true

  try {
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
  } catch (err) {
    throw new Error(err.message || 'Verification service unreachable')
  }
}
