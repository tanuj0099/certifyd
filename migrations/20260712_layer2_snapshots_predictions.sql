-- ============================================================================
-- CERTIFYD ML INSTRUMENTATION: LAYER 2 (ENTITY SNAPSHOTS & PREDICTIONS)
-- Migration: 20260712_layer2_snapshots_predictions.sql
-- Description: Versioned structured input snapshots & tool prediction ledger
-- ============================================================================

-- 1. ENTITY SNAPSHOTS TABLE
-- Stores structured features extracted from inputs (resume, offer letter, ROI profile).
-- NEVER stores raw PDF text or PII. Stores file hash for deduplication.
CREATE TABLE IF NOT EXISTS public.entity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  entity_type TEXT NOT NULL,                  -- 'offer_letter' | 'resume' | 'roi_profile' | 'cert_comparison'
  entity_id UUID,                             -- groups versions of the same entity together
  version INT NOT NULL DEFAULT 1,

  -- Structured feature payload (no raw file text per ML privacy rule)
  structured_data JSONB NOT NULL DEFAULT '{}'::jsonb,

  raw_file_hash TEXT,                         -- SHA256 of original file for deduplication
  model_used TEXT,                             -- e.g. 'groq-llama-3.3-70b-v2' or 'heuristic-v1'
  extraction_confidence NUMERIC,              -- parse confidence score (low confidence = exclude from initial training)

  -- Purpose-specific DPDP consent
  consent_ml_training BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_snapshots_entity ON public.entity_snapshots(entity_type, entity_id, version);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_id ON public.entity_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON public.entity_snapshots(created_at);

-- 2. PREDICTIONS TABLE
-- Logs exact predictions given to users by our tools paired with snapshot_id.
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  tool_name TEXT NOT NULL,                    -- 'roi_calculator' | 'offer_letter_analyzer' | 'cert_compare' | 'market_pulse'
  snapshot_id UUID REFERENCES public.entity_snapshots(id) ON DELETE SET NULL,

  prediction JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- e.g. { "predicted_salary_bump_pct": 22, "predicted_timeline_months": 8, "confidence": "medium" }

  model_version TEXT NOT NULL,                 -- e.g. 'roi-heuristic-v3' — versioned for grading accuracy

  -- Filled in later once ground truth outcome arrives (Layer 3 linkage)
  outcome_id UUID,
  outcome_captured_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_predictions_tool ON public.predictions(tool_name, model_version);
CREATE INDEX IF NOT EXISTS idx_predictions_snapshot ON public.predictions(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON public.predictions(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR LAYER 2
-- ============================================================================
ALTER TABLE public.entity_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- entity_snapshots policies:
CREATE POLICY "Users and anon can insert snapshots" ON public.entity_snapshots
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can select own snapshots" ON public.entity_snapshots
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- predictions policies:
CREATE POLICY "Users and anon can insert predictions" ON public.predictions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can select own predictions" ON public.predictions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
