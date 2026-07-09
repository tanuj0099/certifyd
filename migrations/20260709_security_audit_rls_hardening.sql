-- ==============================================================================
-- CERTIFYD SECURITY AUDIT — CATEGORY 2: AUTHORIZATION & RLS HARDENING
-- Date: 2026-07-09
-- Purpose: Enforce strict Row Level Security (RLS) policies across all tables.
-- Uses explicit text casts (auth.uid()::text = user_id::text) to prevent operator mismatch errors.
-- ==============================================================================

-- 1. Enable RLS explicitly on all core and application tables
ALTER TABLE IF EXISTS public.offer_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.offer_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.offer_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.journey_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leverage_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quick_checks ENABLE ROW LEVEL SECURITY;

-- 2. Hardening offer_analyses (UPDATE / DELETE restricted to owner)
DROP POLICY IF EXISTS "Users can update own offers" ON public.offer_analyses;
CREATE POLICY "Users can update own offers" ON public.offer_analyses
  FOR UPDATE USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete own offers" ON public.offer_analyses;
CREATE POLICY "Users can delete own offers" ON public.offer_analyses
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- 3. Hardening offer_letters (UPDATE / DELETE restricted to owner)
DROP POLICY IF EXISTS "Users can update own offer letters" ON public.offer_letters;
CREATE POLICY "Users can update own offer letters" ON public.offer_letters
  FOR UPDATE USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete own offer letters" ON public.offer_letters;
CREATE POLICY "Users can delete own offer letters" ON public.offer_letters
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- 4. Hardening user_profiles & profiles
DROP POLICY IF EXISTS "Users can manage own user_profiles" ON public.user_profiles;
CREATE POLICY "Users can manage own user_profiles" ON public.user_profiles
  FOR ALL USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can manage own profiles" ON public.profiles;
CREATE POLICY "Users can manage own profiles" ON public.profiles
  FOR ALL USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- 5. Hardening resumes & journey_tracking
DROP POLICY IF EXISTS "Users can manage own resumes" ON public.resumes;
CREATE POLICY "Users can manage own resumes" ON public.resumes
  FOR ALL USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can manage own journey_tracking" ON public.journey_tracking;
CREATE POLICY "Users can manage own journey_tracking" ON public.journey_tracking
  FOR ALL USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);
