-- ==============================================================================
-- CERTIFYROI & CERTIFYD-OPS: DEMAND DATA & ATTRIBUTION HONESTY MIGRATION
-- Run this script in your Supabase SQL Editor
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PART A: Demand Data Schema
-- ------------------------------------------------------------------------------

-- A1. Manual demand observations table
CREATE TABLE IF NOT EXISTS public.market_demand_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cert_name TEXT NOT NULL,
  city TEXT NOT NULL,
  role TEXT NOT NULL,
  open_roles_count INT,
  source TEXT NOT NULL,              -- 'adzuna_api' | 'manual_pull' | 'user_aggregate'
  observed_at DATE NOT NULL,         -- the date this count reflects, not created_at
  notes TEXT
);

DROP POLICY IF EXISTS "Public read access for market_demand_observations" ON public.market_demand_observations;
CREATE POLICY "Public read access for market_demand_observations" 
  ON public.market_demand_observations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated and service role on market_demand_observations" ON public.market_demand_observations;
CREATE POLICY "Allow all operations for authenticated and service role on market_demand_observations" 
  ON public.market_demand_observations FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_mdo_cert_city_role ON public.market_demand_observations(cert_name, city, role);
CREATE INDEX IF NOT EXISTS idx_mdo_observed_at ON public.market_demand_observations(observed_at);

-- A3. Add confidence and last_observed_at columns to demand_scores (and create table if missing)
CREATE TABLE IF NOT EXISTS public.demand_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cert_name TEXT,
  slug TEXT,
  city TEXT,
  role TEXT,
  score NUMERIC,
  sample_confidence TEXT DEFAULT 'low',
  last_observed_at TIMESTAMPTZ,
  source TEXT
);

ALTER TABLE public.demand_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for demand_scores" ON public.demand_scores;
CREATE POLICY "Public read access for demand_scores" 
  ON public.demand_scores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated and service role on demand_scores" ON public.demand_scores;
CREATE POLICY "Allow all operations for authenticated and service role on demand_scores" 
  ON public.demand_scores FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.demand_scores ADD COLUMN IF NOT EXISTS sample_confidence TEXT DEFAULT 'low';
ALTER TABLE public.demand_scores ADD COLUMN IF NOT EXISTS last_observed_at TIMESTAMPTZ;
ALTER TABLE public.demand_scores ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.demand_scores ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.demand_scores ADD COLUMN IF NOT EXISTS score NUMERIC;
ALTER TABLE public.demand_scores ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.demand_scores ADD COLUMN IF NOT EXISTS cert_name TEXT;
ALTER TABLE public.demand_scores ADD COLUMN IF NOT EXISTS slug TEXT;

-- ------------------------------------------------------------------------------
-- PART B: Attribution Honesty Schema
-- ------------------------------------------------------------------------------

-- B1 & B2. Add contributing_factors, outcome_data, and months_since_cert to outcomes (and create table if missing)
CREATE TABLE IF NOT EXISTS public.outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID,
  prediction_id UUID,
  entity_type TEXT,
  actual_outcome JSONB DEFAULT '{}'::jsonb,
  outcome_data JSONB DEFAULT '{}'::jsonb,
  contributing_factors JSONB DEFAULT '[]'::jsonb,
  months_since_cert NUMERIC,
  verification_method TEXT DEFAULT 'self_reported',
  confidence_weight NUMERIC DEFAULT 0.8
);

ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own outcomes" ON public.outcomes;
CREATE POLICY "Users can read own outcomes" 
  ON public.outcomes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own outcomes" ON public.outcomes;
CREATE POLICY "Users can insert own outcomes" 
  ON public.outcomes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.outcomes ADD COLUMN IF NOT EXISTS contributing_factors JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.outcomes ADD COLUMN IF NOT EXISTS outcome_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.outcomes ADD COLUMN IF NOT EXISTS months_since_cert NUMERIC;

-- Create predictions table if missing
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID,
  outcome_id UUID,
  outcome_captured_at TIMESTAMPTZ
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access on predictions" ON public.predictions;
CREATE POLICY "Allow all access on predictions" ON public.predictions FOR ALL USING (true) WITH CHECK (true);

-- Update stored procedure record_outcome_and_link_prediction to accept new fields if used by RPC
CREATE OR REPLACE FUNCTION public.record_outcome_and_link_prediction(
  p_prediction_id UUID,
  p_entity_type TEXT,
  p_actual_outcome JSONB,
  p_verification_method TEXT,
  p_confidence_weight NUMERIC,
  p_contributing_factors JSONB DEFAULT '[]'::jsonb,
  p_outcome_data JSONB DEFAULT '{}'::jsonb,
  p_months_since_cert NUMERIC DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_outcome_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  INSERT INTO public.outcomes (
    user_id,
    prediction_id,
    entity_type,
    actual_outcome,
    outcome_data,
    contributing_factors,
    months_since_cert,
    verification_method,
    confidence_weight
  )
  VALUES (
    v_user_id,
    p_prediction_id,
    COALESCE(p_entity_type, 'certification_roi'),
    COALESCE(p_actual_outcome, '{}'::jsonb),
    COALESCE(p_outcome_data, p_actual_outcome, '{}'::jsonb),
    COALESCE(p_contributing_factors, '[]'::jsonb),
    p_months_since_cert,
    COALESCE(p_verification_method, 'self_reported'),
    COALESCE(p_confidence_weight, 0.8)
  )
  RETURNING id INTO v_outcome_id;

  IF p_prediction_id IS NOT NULL THEN
    UPDATE public.predictions
    SET outcome_id = v_outcome_id,
        outcome_captured_at = now()
    WHERE id = p_prediction_id;
  END IF;

  RETURN v_outcome_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
