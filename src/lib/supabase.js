import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const SUPABASE_SINGLETON_KEY = '__certifyd_supabase_client__'

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the root .env file.'
  )
}

const safeFetch = async (url, options) => {
  try {
    return await fetch(url, options)
  } catch (error) {
    console.warn('Supabase fetch handled safely:', error?.message || 'Failed to fetch')
    return new Response(
      JSON.stringify({
        error: 'network_error',
        error_description: error?.message || 'Failed to fetch from Supabase network'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export const supabase =
  supabaseUrl && supabaseKey
    ? globalThis[SUPABASE_SINGLETON_KEY] ||
      (globalThis[SUPABASE_SINGLETON_KEY] = createClient(supabaseUrl, supabaseKey, {
        auth: {
          storageKey: 'certifyd-auth-v2',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        global: {
          fetch: safeFetch,
        },
      }))
    : null

