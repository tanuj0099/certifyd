-- ==============================================================================
-- CERTIFYD SECURITY AUDIT — CATEGORY 2: AUTHORIZATION & RLS HARDENING
-- Date: 2026-07-09
-- Purpose: Enforce strict Row Level Security (RLS) policies across all tables.
-- Uses safe table existence checks and explicit text casts (auth.uid()::text = user_id::text).
-- ==============================================================================

-- 0. Ensure base tables exist before attaching policies
CREATE TABLE IF NOT EXISTS public.journey_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT,
  parsed_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Safely enable RLS and apply strict ownership policies across all tables
DO $$
BEGIN
  -- offer_analyses
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'offer_analyses') THEN
    ALTER TABLE public.offer_analyses ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can update own offers" ON public.offer_analyses;
    CREATE POLICY "Users can update own offers" ON public.offer_analyses
      FOR UPDATE USING (auth.uid()::text = user_id::text)
      WITH CHECK (auth.uid()::text = user_id::text);

    DROP POLICY IF EXISTS "Users can delete own offers" ON public.offer_analyses;
    CREATE POLICY "Users can delete own offers" ON public.offer_analyses
      FOR DELETE USING (auth.uid()::text = user_id::text);
  END IF;

  -- offer_letters
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'offer_letters') THEN
    ALTER TABLE public.offer_letters ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can update own offer letters" ON public.offer_letters;
    CREATE POLICY "Users can update own offer letters" ON public.offer_letters
      FOR UPDATE USING (auth.uid()::text = user_id::text)
      WITH CHECK (auth.uid()::text = user_id::text);

    DROP POLICY IF EXISTS "Users can delete own offer letters" ON public.offer_letters;
    CREATE POLICY "Users can delete own offer letters" ON public.offer_letters
      FOR DELETE USING (auth.uid()::text = user_id::text);
  END IF;

  -- offer_uploads
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'offer_uploads') THEN
    ALTER TABLE public.offer_uploads ENABLE ROW LEVEL SECURITY;
  END IF;

  -- user_profiles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage own user_profiles" ON public.user_profiles;
    CREATE POLICY "Users can manage own user_profiles" ON public.user_profiles
      FOR ALL USING (auth.uid()::text = user_id::text)
      WITH CHECK (auth.uid()::text = user_id::text);
  END IF;

  -- profiles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage own profiles" ON public.profiles;
    CREATE POLICY "Users can manage own profiles" ON public.profiles
      FOR ALL USING (auth.uid()::text = id::text)
      WITH CHECK (auth.uid()::text = id::text);
  END IF;

  -- resumes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'resumes') THEN
    ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage own resumes" ON public.resumes;
    CREATE POLICY "Users can manage own resumes" ON public.resumes
      FOR ALL USING (auth.uid()::text = user_id::text)
      WITH CHECK (auth.uid()::text = user_id::text);
  END IF;

  -- journey_tracking
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'journey_tracking') THEN
    ALTER TABLE public.journey_tracking ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage own journey_tracking" ON public.journey_tracking;
    CREATE POLICY "Users can manage own journey_tracking" ON public.journey_tracking
      FOR ALL USING (auth.uid()::text = user_id::text)
      WITH CHECK (auth.uid()::text = user_id::text);
  END IF;

  -- leverage_tokens
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leverage_tokens') THEN
    ALTER TABLE public.leverage_tokens ENABLE ROW LEVEL SECURITY;
  END IF;

  -- referrals
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referrals') THEN
    ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
  END IF;

  -- consents
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consents') THEN
    ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
  END IF;

  -- quick_checks
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quick_checks') THEN
    ALTER TABLE public.quick_checks ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
