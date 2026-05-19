function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS || ''
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export async function verifyFirebaseToken(authHeader) {
  const token = authHeader?.replace(/^Bearer\s+/i, '')
  if (!token) return { ok: false, status: 401, error: 'Missing authorization token' }

  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY
  if (!apiKey) return { ok: false, status: 500, error: 'Firebase API key not configured on server' }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    }
  )

  if (!response.ok) {
    return { ok: false, status: 401, error: 'Invalid or expired session' }
  }

  const data = await response.json()
  const user = data.users?.[0]
  if (!user) return { ok: false, status: 401, error: 'User not found' }

  return {
    ok: true,
    uid: user.localId,
    email: (user.email || '').toLowerCase(),
    displayName: user.displayName || '',
  }
}

export async function verifyFirebaseAdmin(authHeader) {
  const session = await verifyFirebaseToken(authHeader)
  if (!session.ok) return session

  const admins = getAdminEmails()
  if (!admins.length) {
    return { ok: false, status: 503, error: 'Admin allowlist not configured (ADMIN_EMAILS)' }
  }
  if (!admins.includes(session.email)) {
    return { ok: false, status: 403, error: 'Not authorized for admin access' }
  }

  return session
}
