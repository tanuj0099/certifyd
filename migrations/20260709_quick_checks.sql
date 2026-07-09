-- ============================================================================
-- Certifyd Trust & Loyalty Phase 1: Quick CTC Check (Lead Magnet)
-- Table for storing anonymous quick check submissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quick_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  base NUMERIC NOT NULL,
  variable NUMERIC NOT NULL,
  city TEXT NOT NULL,
  role TEXT,
  percentile_result INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_hash TEXT
);

-- Index for analytics and rate-limiting lookups
CREATE INDEX IF NOT EXISTS idx_quick_checks_created_at ON public.quick_checks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quick_checks_ip_hash_created ON public.quick_checks(ip_hash, created_at DESC);

-- Enable RLS
ALTER TABLE public.quick_checks ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts from the API / public lead magnet
DROP POLICY IF EXISTS "Allow public inserts for quick checks" ON public.quick_checks;
CREATE POLICY "Allow public inserts for quick checks"
  ON public.quick_checks
  FOR INSERT
  WITH CHECK (true);

-- Only service role / admins can read all quick checks
DROP POLICY IF EXISTS "Allow admins to read quick checks" ON public.quick_checks;
CREATE POLICY "Allow admins to read quick checks"
  ON public.quick_checks
  FOR SELECT
  USING (false);
