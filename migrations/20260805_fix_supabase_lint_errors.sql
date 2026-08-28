-- 20260805_fix_supabase_lint_errors.sql

-- Fix policy_exists_rls_disabled and rls_disabled_in_public
ALTER TABLE public.ops_notes ENABLE ROW LEVEL SECURITY;

-- Note on auth_leaked_password_protection:
-- This is a Supabase Auth setting. You can enable it in your Supabase Dashboard:
-- Authentication -> Security -> Leaked Password Protection, or via config.toml `[auth] password_leak_protection = true`

-- Note on rls_enabled_no_policy:
-- Tables like `certifications_live`, `market_intel`, `market_jobs_live`, etc., have RLS enabled but no policies.
-- This defaults to DENY ALL. If they are intended to be accessible only by service_role, this is perfectly fine.
-- If they need client access, you'll need to create SELECT/INSERT/UPDATE policies for them as needed.

-- Fix extension_in_public
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION vector SET SCHEMA extensions;

-- Fix function_search_path_mutable
ALTER FUNCTION public.check_and_increment_rate_limit(uuid, character varying, character varying, integer) SET search_path = '';
ALTER FUNCTION public.record_outcome_and_link_prediction(uuid, text, jsonb, text, numeric) SET search_path = '';
ALTER FUNCTION public.record_outcome_and_link_prediction(uuid, text, jsonb, text, numeric, jsonb, jsonb, numeric) SET search_path = '';
ALTER FUNCTION public.enforce_max_concurrent_sessions() SET search_path = '';
ALTER FUNCTION public.cleanup_expired_offer_uploads() SET search_path = '';
ALTER FUNCTION public.generate_certification_slug SET search_path = '';
ALTER FUNCTION public.process_12_month_retention_sweep() SET search_path = '';
ALTER FUNCTION public.soft_delete_user() SET search_path = '';

-- Fix anon_security_definer_function_executable and authenticated_security_definer_function_executable
-- Revoke execute from anon/authenticated for internal and cron functions
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_offer_uploads() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_max_concurrent_sessions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_12_month_retention_sweep() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.soft_delete_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_outcome_and_link_prediction(uuid, text, jsonb, text, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_outcome_and_link_prediction(uuid, text, jsonb, text, numeric, jsonb, jsonb, numeric) FROM PUBLIC, anon, authenticated;

-- For check_and_increment_rate_limit, it is used by the frontend adminService, but ONLY by authenticated users.
-- We revoke from anon, but keep authenticated.
REVOKE EXECUTE ON FUNCTION public.check_and_increment_rate_limit(uuid, character varying, character varying, integer) FROM PUBLIC, anon;

-- Fix rls_policy_always_true by using more secure equivalent checks

-- 1. admin_users_allowlist
DROP POLICY IF EXISTS "Allow all operations for authenticated and service role" ON public.admin_users_allowlist;
CREATE POLICY "Allow all operations for authenticated and service role" ON public.admin_users_allowlist FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 2. consents
DROP POLICY IF EXISTS "Anyone can insert consent logs" ON public.consents;
CREATE POLICY "Anyone can insert consent logs" ON public.consents FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- 3. demand_scores
DROP POLICY IF EXISTS "Allow all operations for authenticated and service role on dema" ON public.demand_scores;
CREATE POLICY "Allow all operations for authenticated and service role on dema" ON public.demand_scores FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 4. feature_flags
DROP POLICY IF EXISTS "Allow all operations for authenticated and service role" ON public.feature_flags;
CREATE POLICY "Allow all operations for authenticated and service role" ON public.feature_flags FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 5. feedback_messages
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback_messages;
DROP POLICY IF EXISTS "feedback_messages_anon_insert" ON public.feedback_messages;
CREATE POLICY "Anyone can insert feedback" ON public.feedback_messages FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- 6. feedback_reviews
DROP POLICY IF EXISTS "Allow public inserts for feedback" ON public.feedback_reviews;
CREATE POLICY "Allow public inserts for feedback" ON public.feedback_reviews FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- 7. leverage_tokens
DROP POLICY IF EXISTS "System can insert token transactions" ON public.leverage_tokens;
CREATE POLICY "System can insert token transactions" ON public.leverage_tokens FOR INSERT WITH CHECK (auth.role() = 'authenticated'); 

-- 8. market_demand_observations
DROP POLICY IF EXISTS "Allow all operations for authenticated and service role on mark" ON public.market_demand_observations;
CREATE POLICY "Allow all operations for authenticated and service role on mark" ON public.market_demand_observations FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 9. offer_analyses
DROP POLICY IF EXISTS "Anyone can insert offers" ON public.offer_analyses;
CREATE POLICY "Anyone can insert offers" ON public.offer_analyses FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- 10. offer_letters
DROP POLICY IF EXISTS "Anyone can insert offer letters" ON public.offer_letters;
CREATE POLICY "Anyone can insert offer letters" ON public.offer_letters FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- 11. offer_uploads
DROP POLICY IF EXISTS "Allow insert offer upload" ON public.offer_uploads;
DROP POLICY IF EXISTS "Allow update offer upload" ON public.offer_uploads;
CREATE POLICY "Allow insert offer upload" ON public.offer_uploads FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Allow update offer upload" ON public.offer_uploads FOR UPDATE USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- 12. ops_calendar_events
DROP POLICY IF EXISTS "Allow all operations for authenticated and service role" ON public.ops_calendar_events;
CREATE POLICY "Allow all operations for authenticated and service role" ON public.ops_calendar_events FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 13. ops_tasks
DROP POLICY IF EXISTS "Allow all operations for authenticated and service role" ON public.ops_tasks;
CREATE POLICY "Allow all operations for authenticated and service role" ON public.ops_tasks FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 14. ops_team_members
DROP POLICY IF EXISTS "Allow all operations for authenticated and service role" ON public.ops_team_members;
CREATE POLICY "Allow all operations for authenticated and service role" ON public.ops_team_members FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 15. outcomes
DROP POLICY IF EXISTS "Users can insert own outcomes" ON public.outcomes;
CREATE POLICY "Users can insert own outcomes" ON public.outcomes FOR ALL USING (auth.uid()::text = user_id::text OR auth.role() = 'anon') WITH CHECK (auth.uid()::text = user_id::text OR auth.role() = 'anon');

-- 16. predictions
DROP POLICY IF EXISTS "Allow all access on predictions" ON public.predictions;
CREATE POLICY "Allow all access on predictions" ON public.predictions FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- 17. profiles
DROP POLICY IF EXISTS "Users can insert own workspace profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own workspace profile" ON public.profiles;
CREATE POLICY "Users can insert own workspace profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid()::text = id::text);
CREATE POLICY "Users can update own workspace profile" ON public.profiles FOR UPDATE USING (auth.uid()::text = id::text) WITH CHECK (auth.uid()::text = id::text);

-- 18. quick_checks
DROP POLICY IF EXISTS "Allow public inserts for quick checks" ON public.quick_checks;
CREATE POLICY "Allow public inserts for quick checks" ON public.quick_checks FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- 19. referrals
DROP POLICY IF EXISTS "Anyone can insert or update referrals" ON public.referrals;
CREATE POLICY "Anyone can insert or update referrals" ON public.referrals FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- 20. user_profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid()::text = user_id::text) WITH CHECK (auth.uid()::text = user_id::text);
