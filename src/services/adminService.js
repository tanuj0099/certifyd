export async function fetchAdminDashboard(user) {
  if (!user?.getIdToken) throw new Error('Not signed in')
  const token = await user.getIdToken()
  const response = await fetch('/api/admin/data', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || `Admin API error (${response.status})`)
  }
  return payload
}
