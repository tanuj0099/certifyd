import { createClient } from '@supabase/supabase-js'

let supabaseClient = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl) {
      throw new Error('Missing VITE_SUPABASE_URL environment variable')
    }

    if (!supabaseKey) {
      throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey)
  }

  return supabaseClient
}

export const supabase = getSupabaseClient()
