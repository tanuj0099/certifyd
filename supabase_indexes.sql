-- Performance Optimization: Database Indexes
-- Run this script in your Supabase SQL Editor to improve query performance

-- 1. Index on certifications for domain lookups (frequently used in filtering)
CREATE INDEX IF NOT EXISTS idx_certifications_domain_id ON certifications (domain_id);

-- 2. Index on certifications for name (used for lookups and search)
CREATE INDEX IF NOT EXISTS idx_certifications_name ON certifications (name);

-- 3. Index on domains for label/name
CREATE INDEX IF NOT EXISTS idx_domains_name ON domains (name);

-- 4. Index on market_intelligence for fast domain salary lookups
CREATE INDEX IF NOT EXISTS idx_market_intelligence_domain ON market_intelligence (domain_name);

-- 5. Index on demand_scores for certification string lookups
CREATE INDEX IF NOT EXISTS idx_demand_scores_certification ON demand_scores (certification);

-- 6. Index on user_profiles for user ID (already indexed by default if it's a primary key, but good to ensure if it's just a foreign key)
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles (user_id);
