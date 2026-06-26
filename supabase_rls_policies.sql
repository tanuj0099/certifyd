-- Supabase Row Level Security (RLS) Policies
-- Run this script in your Supabase SQL Editor

-- 1. Enable RLS on all tables
ALTER TABLE IF EXISTS api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feedback_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS demand_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS demand_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS journey_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS offer_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS market_intelligence ENABLE ROW LEVEL SECURITY;

-- 2. Public / Global Data (Readable by everyone, writable by service_role/admins)
-- Drop existing policies first to prevent conflicts (optional, safe approach)

-- certifications
CREATE POLICY "Public read access for certifications" ON certifications FOR SELECT USING (true);
-- domains
CREATE POLICY "Public read access for domains" ON domains FOR SELECT USING (true);
-- demand_scores
CREATE POLICY "Public read access for demand_scores" ON demand_scores FOR SELECT USING (true);
-- demand_counts
CREATE POLICY "Public read access for demand_counts" ON demand_counts FOR SELECT USING (true);
-- market_intelligence
CREATE POLICY "Public read access for market_intelligence" ON market_intelligence FOR SELECT USING (true);

-- 3. User Private Data (Users can only read/write their own records)

-- user_profiles (assuming foreign key 'user_id' -> auth.users)
CREATE POLICY "Users can view own user_profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_profile" ON user_profiles FOR DELETE USING (auth.uid() = user_id);

-- profiles (assuming primary key 'id' -> auth.users)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- journey_tracking
CREATE POLICY "Users can view own journey" ON journey_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journey" ON journey_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journey" ON journey_tracking FOR UPDATE USING (auth.uid() = user_id);

-- offer_analyses
CREATE POLICY "Users can view own offers" ON offer_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own offers" ON offer_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own offers" ON offer_analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own offers" ON offer_analyses FOR DELETE USING (auth.uid() = user_id);

-- 4. Public Submissions (Anyone can insert, but only admins/service_role can view)

-- feedback_messages
CREATE POLICY "Anyone can insert feedback" ON feedback_messages FOR INSERT WITH CHECK (true);
-- no SELECT policy means anon/authenticated users cannot read feedback

-- contact_submissions
CREATE POLICY "Anyone can insert contact submissions" ON contact_submissions FOR INSERT WITH CHECK (true);
-- no SELECT policy means anon/authenticated users cannot read submissions

-- api_rate_limits
CREATE POLICY "Anyone can insert rate limits" ON api_rate_limits FOR INSERT WITH CHECK (true);
-- (Admin service might need to read this using service_role key, which bypasses RLS)

-- NOTE: Supabase 'service_role' key bypasses all RLS policies automatically.
-- Ensure that your backend API routes use the service_role key for administrative tasks (like updating domains/certs).
-- resumes
ALTER TABLE IF EXISTS resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert resumes" ON resumes FOR INSERT WITH CHECK (true);
