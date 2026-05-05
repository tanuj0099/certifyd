import { createClient } from '@supabase/supabase-js'

// Vite uses import.meta.env, NOT process.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is missing in .env.local')
}

// Prevent multiple GoTrueClient instances in dev/HMR.
const globalKey = '__croi_supabase__'
export const supabase = globalThis[globalKey] || createClient(supabaseUrl, supabaseKey)
globalThis[globalKey] = supabase