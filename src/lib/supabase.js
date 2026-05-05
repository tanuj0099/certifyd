import { createClient } from '@supabase/supabase-js'

// Vite uses import.meta.env, NOT process.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is missing in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseKey)