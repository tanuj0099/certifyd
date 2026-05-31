// Admin emails should not be bundled in the client code for security reasons.
// Real admin checks should rely on Supabase RLS policies and server-side validation.
// This is a stub that returns false to prevent UI bypass; update UI to fetch role from server.

export function isAdminEmail(email) {
  return false
}

export function getAdminEmails() {
  return []
}
