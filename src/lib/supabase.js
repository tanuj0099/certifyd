import { createClient } from '@supabase/supabase-js'

// Vite-specific environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// This singleton prevents the "Multiple GoTrueClient instances" error
export const supabase = createClient(supabaseUrl, supabaseKey)