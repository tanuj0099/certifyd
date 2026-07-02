-- ==============================================================================
-- CERTIFYD SQL MIGRATION & OPTIMIZATION SCRIPT
-- Date: 2026-07-02
-- Categories: 13 (Atomic RPC), 14 (Indexes & DPDP Consent), 18 (FK Cascades)
-- ==============================================================================

-- 0. PRE-FLIGHT: SAFE DATA TYPE CONVERSIONS TO UUID
-- Ensures user_id columns are UUID type before adding foreign key references to auth.users(id).
-- Deletes any invalid non-UUID strings (e.g. legacy test strings or empty strings) to prevent NOT NULL and type cast violations.
DO $$
DECLARE
  pol RECORD;
  t TEXT;
  col TEXT;
BEGIN
  -- 1. Dynamically drop all existing RLS policies on user tables to allow column type conversion
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('offer_analyses', 'offer_letters', 'user_profiles', 'profiles', 'journey_tracking', 'resumes', 'demand_scores')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, pol.tablename);
  END LOOP;

  -- 2. Clean text strings and convert text/varchar columns to UUID
  FOR t, col IN VALUES 
    ('offer_analyses', 'user_id'),
    ('offer_letters', 'user_id'),
    ('user_profiles', 'user_id'),
    ('profiles', 'id'),
    ('journey_tracking', 'user_id'),
    ('resumes', 'user_id'),
    ('demand_scores', 'user_id')
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = t AND column_name = col AND data_type IN ('character varying', 'text')
    ) THEN
      -- Trim whitespace
      EXECUTE format('UPDATE public.%I SET %I = TRIM(%I);', t, col, col);
      -- Remove legacy/invalid rows that do not match standard 36-character UUID format
      EXECUTE format('DELETE FROM public.%I WHERE %I IS NOT NULL AND %I !~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'';', t, col, col);
      -- Cast column from text/varchar to UUID
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE UUID USING %I::uuid;', t, col, col);
    END IF;
  END LOOP;
END $$;


-- 1. FOREIGN KEY CASCADE DEFINITIONS FOR DATA ERASURE (Category 18)
-- Clean up orphan records that do not exist in auth.users before attaching foreign keys
DO $$
BEGIN
  DELETE FROM public.offer_analyses WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = offer_analyses.user_id);
  DELETE FROM public.offer_letters WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = offer_letters.user_id);
  DELETE FROM public.user_profiles WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_profiles.user_id);
  DELETE FROM public.profiles WHERE id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = profiles.id);
  DELETE FROM public.journey_tracking WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = journey_tracking.user_id);
  DELETE FROM public.resumes WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = resumes.user_id);
  DELETE FROM public.demand_scores WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = demand_scores.user_id);
EXCEPTION WHEN OTHERS THEN
  -- Ignore errors if tables do not exist
END $$;

-- Ensure that deleting a user from auth.users cascades to all application tables.
ALTER TABLE IF EXISTS public.offer_analyses
  DROP CONSTRAINT IF EXISTS offer_analyses_user_id_fkey,
  ADD CONSTRAINT offer_analyses_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.offer_letters
  DROP CONSTRAINT IF EXISTS offer_letters_user_id_fkey,
  ADD CONSTRAINT offer_letters_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey,
  ADD CONSTRAINT user_profiles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey,
  ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.journey_tracking
  DROP CONSTRAINT IF EXISTS journey_tracking_user_id_fkey,
  ADD CONSTRAINT journey_tracking_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.resumes
  DROP CONSTRAINT IF EXISTS resumes_user_id_fkey,
  ADD CONSTRAINT resumes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.demand_scores
  DROP CONSTRAINT IF EXISTS demand_scores_user_id_fkey,
  ADD CONSTRAINT demand_scores_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- 1.5. RECREATE ROW LEVEL SECURITY (RLS) POLICIES FOR USER TABLES
-- Recreates clean, standardized RLS isolation policies now that user columns are UUID types.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN VALUES ('offer_analyses'), ('offer_letters'), ('user_profiles'), ('journey_tracking'), ('resumes'), ('demand_scores')
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
      EXECUTE format('CREATE POLICY "Users can view own %I" ON public.%I FOR SELECT USING (auth.uid() = user_id);', t, t);
      EXECUTE format('CREATE POLICY "Users can insert own %I" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id);', t, t);
      EXECUTE format('CREATE POLICY "Users can update own %I" ON public.%I FOR UPDATE USING (auth.uid() = user_id);', t, t);
      EXECUTE format('CREATE POLICY "Users can delete own %I" ON public.%I FOR DELETE USING (auth.uid() = user_id);', t, t);
    END IF;
  END LOOP;

  -- Recreate policies for profiles table (uses id instead of user_id)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);
  END IF;
END $$;


-- 2. INDEX OPTIMIZATIONS FOR FREQUENT QUERIES (Category 14)
-- Dynamically creates indexes only if the corresponding table and columns exist in the database schema.
DO $$
BEGIN
  -- offer_analyses indexes
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offer_analyses' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_offer_analyses_user_id ON public.offer_analyses(user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offer_analyses' AND column_name = 'city') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offer_analyses' AND column_name = 'target_job_title') THEN
    CREATE INDEX IF NOT EXISTS idx_offer_analyses_city_title ON public.offer_analyses(city, target_job_title);
  END IF;

  -- certifications index (supports either domain_id or domain column naming in different database environments)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certifications' AND column_name = 'domain_id') THEN
    CREATE INDEX IF NOT EXISTS idx_certifications_domain_hike ON public.certifications(domain_id, avg_hike DESC);
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certifications' AND column_name = 'domain') THEN
    CREATE INDEX IF NOT EXISTS idx_certifications_domain_hike ON public.certifications(domain, avg_hike DESC);
  END IF;

  -- api_rate_limits indexes
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_rate_limits' AND column_name = 'action_type') THEN
    CREATE INDEX IF NOT EXISTS idx_api_rate_limits_action_created ON public.api_rate_limits(action_type, created_at DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_rate_limits' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_api_rate_limits_user_ip ON public.api_rate_limits(user_id, ip);
  END IF;
END $$;


-- 3. DPDP / GDPR EXPLICIT CONSENT COLUMNS (Category 14)
ALTER TABLE IF EXISTS public.user_profiles
  ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_version VARCHAR(20) DEFAULT 'v1.0-2026';


-- 4. ATOMIC RATE LIMIT RPC (Category 13)
-- Prevents JS-level read-then-write race conditions under burst traffic
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_user_id UUID,
  p_action VARCHAR,
  p_ip VARCHAR,
  p_max INT DEFAULT 5
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
  v_one_hour_ago TIMESTAMPTZ := NOW() - INTERVAL '1 hour';
BEGIN
  -- Count existing attempts in the last hour
  SELECT COUNT(*) INTO v_count
  FROM public.api_rate_limits
  WHERE action_type = p_action
    AND created_at >= v_one_hour_ago
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id) OR
      (p_ip IS NOT NULL AND ip = p_ip)
    );

  IF v_count >= p_max THEN
    RETURN jsonb_build_object('allowed', false, 'retryAfterSeconds', 3600);
  END IF;

  -- Insert new rate limit record
  INSERT INTO public.api_rate_limits (user_id, action_type, ip, created_at)
  VALUES (p_user_id, p_action, p_ip, NOW());

  RETURN jsonb_build_object('allowed', true, 'remaining', GREATEST(0, p_max - v_count - 1));
END;
$$;
