import { createClient } from '@supabase/supabase-js';

// Bypass local SSL inspection proxy on Windows in dev environment if not using system CA
if (process.env.NODE_ENV !== 'production' && !process.env.NODE_OPTIONS?.includes('--use-system-ca')) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key';

// Admin client using service role key (Bypasses RLS - use strictly in Server Actions / Server Components)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
