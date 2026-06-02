import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SINGLETON_KEY = '__certifyroi_supabase_client__';

// This creates a single, reusable connection to your Postgres database
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? ((globalThis as any)[SUPABASE_SINGLETON_KEY] ||
      ((globalThis as any)[SUPABASE_SINGLETON_KEY] = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storageKey: 'certifyroi-auth-v2',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })))
    : null;
