-- CertifyROI user/profile surfaces used by the Vite frontend.
-- Apply this in Supabase SQL editor before relying on profile/feedback persistence.

create table if not exists public.user_profiles (
  user_id text primary key,
  email text,
  full_name text,
  avatar_url text,
  provider text,
  city text,
  current_role text,
  current_salary numeric,
  target_domain text,
  preferences jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_profiles_email_idx on public.user_profiles (email);
create index if not exists user_profiles_updated_at_idx on public.user_profiles (updated_at desc);

create table if not exists public.feedback_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  source text not null default 'contact_page',
  created_at timestamptz not null default now()
);

create index if not exists feedback_messages_created_at_idx on public.feedback_messages (created_at desc);

-- Security note:
-- This app currently authenticates users with Firebase while Supabase is used as a data plane.
-- If Row Level Security is enabled, write profile/feedback rows through a server/Edge Function
-- that verifies the Firebase ID token, then writes with SUPABASE_SERVICE_ROLE_KEY.
