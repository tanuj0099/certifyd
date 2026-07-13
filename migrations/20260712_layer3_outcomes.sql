-- ============================================================================
-- CERTIFYD ML INSTRUMENTATION: LAYER 3 (GROUND TRUTH OUTCOMES)
-- Migration: 20260712_layer3_outcomes.sql
-- Description: Ground truth outcomes table to build the ML training data moat
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  prediction_id UUID REFERENCES public.predictions(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL DEFAULT 'certification_roi',   -- 'certification_roi' | 'offer_negotiation'

  -- Exact ground truth outcome metrics
  actual_outcome JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- e.g. {
  --   "completed_cert": true,
  --   "cert_name": "AWS Solutions Architect",
  --   "actual_salary_hike_pct": 28,
  --   "actual_timeline_months": 5,
  --   "verified_via_offer_letter": false
  -- }

  verification_method TEXT NOT NULL DEFAULT 'self_reported', -- 'self_reported' | 'offer_upload' | 'email_followup' | 'admin_verified'
  confidence_weight NUMERIC NOT NULL DEFAULT 0.8             -- 1.0 = verified offer letter, 0.8 = self-reported
);

CREATE INDEX IF NOT EXISTS idx_outcomes_prediction ON public.outcomes(prediction_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_user ON public.outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_created_at ON public.outcomes(created_at);

-- ============================================================================
-- RLS POLICIES FOR OUTCOMES
-- ============================================================================
ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users and anon can insert outcomes" ON public.outcomes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can view own outcomes" ON public.outcomes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- STORED FUNCTION TO RECORD OUTCOME & AUTOMATICALLY LINK PREDICTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.record_outcome_and_link_prediction(
  p_prediction_id UUID,
  p_entity_type TEXT,
  p_actual_outcome JSONB,
  p_verification_method TEXT,
  p_confidence_weight NUMERIC
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
    verification_method,
    confidence_weight
  )
  VALUES (
    v_user_id,
    p_prediction_id,
    COALESCE(p_entity_type, 'certification_roi'),
    COALESCE(p_actual_outcome, '{}'::jsonb),
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
