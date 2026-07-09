-- ============================================================================
-- Certifyd Trust & Loyalty Phase 4: DPDP Act 2023 Consent & Audit Trail
-- Table storing explicit versioned user consents
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hash TEXT NULL,
  consent_text_version TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_consents_user_id ON public.consents(user_id);
CREATE INDEX IF NOT EXISTS idx_consents_type_version ON public.consents(consent_type, consent_text_version);

ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consents"
  ON public.consents
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert consent logs"
  ON public.consents
  FOR INSERT
  WITH CHECK (true);
