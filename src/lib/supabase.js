import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const SUPABASE_SINGLETON_KEY = '__certifyroi_supabase_client__'

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the root .env file.'
  )
}

export const supabase =
  supabaseUrl && supabaseKey
    ? globalThis[SUPABASE_SINGLETON_KEY] ||
      (globalThis[SUPABASE_SINGLETON_KEY] = createClient(supabaseUrl, supabaseKey, {
        auth: {
          storageKey: 'certifyroi-auth-v2',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }))
    : null
