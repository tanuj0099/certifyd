-- ============================================================================
-- Certifyd Trust & Loyalty Phase 2: "Analyze & Auto-Delete" Upload Flow
-- Table tracking verifiable synchronous auto-deletion of offer letters
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.offer_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  deleted_at TIMESTAMPTZ NULL,
  extracted_data JSONB NULL,
  error TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offer_uploads_status ON public.offer_uploads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offer_uploads_user_id ON public.offer_uploads(user_id);

ALTER TABLE public.offer_uploads ENABLE ROW LEVEL SECURITY;

-- Allow users or anonymous sessions to insert/select their upload by ID
DROP POLICY IF EXISTS "Allow read offer upload by ID" ON public.offer_uploads;
CREATE POLICY "Allow read offer upload by ID"
  ON public.offer_uploads
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert offer upload" ON public.offer_uploads;
CREATE POLICY "Allow insert offer upload"
  ON public.offer_uploads
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update offer upload" ON public.offer_uploads;
CREATE POLICY "Allow update offer upload"
  ON public.offer_uploads
  FOR UPDATE
  USING (true);

-- Backstop cleanup function to ensure no orphaned temp records remain over 5 minutes
CREATE OR REPLACE FUNCTION public.cleanup_expired_offer_uploads()
RETURNS void AS $$
BEGIN
  UPDATE public.offer_uploads
  SET status = 'error',
      error = 'Upload processing timed out and file was purged.',
      deleted_at = COALESCE(deleted_at, NOW())
  WHERE status = 'processing'
    AND created_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
