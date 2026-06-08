-- Pitch Consolidation Schema Updates
-- Run these in your Supabase SQL Editor

-- 1. Add fields to offer_letters table for AI Negotiator
ALTER TABLE offer_letters ADD COLUMN IF NOT EXISTS esop_units INT DEFAULT 0;
ALTER TABLE offer_letters ADD COLUMN IF NOT EXISTS notice_period_days INT DEFAULT 90;

-- 2. Add education_history to resumes table for strict tracking
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS education_history JSONB;

-- 3. (Optional but recommended) Ensure user_id constraint exists if it wasn't applied earlier
ALTER TABLE resumes ADD CONSTRAINT resumes_user_id_key UNIQUE (user_id);
