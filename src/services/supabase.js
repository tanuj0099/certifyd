// Single source of truth for Supabase client.
// This file is kept for backwards compatibility with older imports.
export { supabase } from '../lib/supabase.js'

export function isSupabaseConfigured() {
  return true
}
