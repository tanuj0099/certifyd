-- ==============================================================================
-- CERTIFYROI: FIX ROW-LEVEL SECURITY (RLS) FOR DATA FLYWHEEL
-- Run this script in your Supabase SQL Editor to allow guest/anonymous offer analysis submissions
-- ==============================================================================

-- 1. Enable RLS
ALTER TABLE IF EXISTS public.offer_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.offer_letters ENABLE ROW LEVEL SECURITY;

-- 2. Drop old restrictive INSERT policies that blocked guest/unauthenticated users
DROP POLICY IF EXISTS "Users can insert own offers" ON public.offer_analyses;
DROP POLICY IF EXISTS "Anyone can insert offers" ON public.offer_analyses;
DROP POLICY IF EXISTS "Users can insert own offer letters" ON public.offer_letters;
DROP POLICY IF EXISTS "Anyone can insert offer letters" ON public.offer_letters;

-- 3. Create new INSERT policies allowing ANYONE (guest or logged-in) to contribute to the compensation Data Flywheel
CREATE POLICY "Anyone can insert offers" ON public.offer_analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert offer letters" ON public.offer_letters FOR INSERT WITH CHECK (true);

-- 4. Ensure SELECT/UPDATE/DELETE remain restricted to the user who owns the record
DROP POLICY IF EXISTS "Users can view own offers" ON public.offer_analyses;
CREATE POLICY "Users can view own offers" ON public.offer_analyses FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own offer letters" ON public.offer_letters;
CREATE POLICY "Users can view own offer letters" ON public.offer_letters FOR SELECT USING (auth.uid() = user_id);
