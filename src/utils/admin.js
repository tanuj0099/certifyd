const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

export function isAdminEmail(email) {
  if (!email || !ADMIN_EMAILS.length) return false
  return ADMIN_EMAILS.includes(email.trim().toLowerCase())
}

export function getAdminEmails() {
  return ADMIN_EMAILS
}
