-- ============================================================================
-- Certifyd Security Hardening Migration: Concurrent Session Control
-- Category 1.2 — Limits concurrent sessions to 5 per user & revokes oldest
-- ============================================================================

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent_hash TEXT,
  is_revoked BOOLEAN NOT NULL DEFAULT false
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id) WHERE is_revoked = false;
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON public.user_sessions(session_token_hash);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
CREATE POLICY "Users can view own sessions"
  ON public.user_sessions
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Users can update/revoke their own sessions
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;
CREATE POLICY "Users can update own sessions"
  ON public.user_sessions
  FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Enforce Max 5 Active Sessions per User
CREATE OR REPLACE FUNCTION public.enforce_max_concurrent_sessions()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM public.user_sessions
  WHERE user_id = NEW.user_id AND is_revoked = false;

  IF active_count > 5 THEN
    -- Revoke the oldest active session(s) exceeding the limit of 5
    UPDATE public.user_sessions
    SET is_revoked = true
    WHERE id IN (
      SELECT id FROM public.user_sessions
      WHERE user_id = NEW.user_id AND is_revoked = false
      ORDER BY last_active ASC
      LIMIT (active_count - 5)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on insert
DROP TRIGGER IF EXISTS trg_enforce_max_sessions ON public.user_sessions;
CREATE TRIGGER trg_enforce_max_sessions
AFTER INSERT ON public.user_sessions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_max_concurrent_sessions();
