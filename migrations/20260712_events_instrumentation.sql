-- ============================================================================
-- CERTIFYD ML INSTRUMENTATION: LAYER 1 APPEND-ONLY LOG (EVENTS TABLE)
-- Migration: 20260712_events_instrumentation.sql
-- Description: Creates the events table, indexes, and strict append-only RLS policies
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Who
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- null if anonymous/pre-signup
  session_id TEXT NOT NULL,                                   -- stable per browser tab session
  anonymous_id TEXT,                                          -- cookie-based id, links pre-signup behavior to post-signup user

  -- What
  event_type TEXT NOT NULL,                                   -- e.g. 'cert_comparison_performed', 'roi_calc_submitted'
  event_category TEXT NOT NULL,                               -- 'tool_usage' | 'profile' | 'navigation' | 'consent'

  -- Context
  tool_name TEXT,                                             -- 'roi_calculator' | 'cert_compare' | 'offer_letter_analyzer' | 'market_pulse'
  entity_type TEXT,                                           -- 'certification' | 'comparison' | 'resume' | 'offer_letter' | 'profile'
  entity_id UUID,                                             -- FK/reference to specific entity

  -- Structured payload (JSONB for evolving schema without migrations)
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Device/Environment telemetry
  city TEXT,
  device_type TEXT,                                           -- 'desktop' | 'mobile' | 'tablet'
  referrer TEXT,

  -- Consent Gate (DPDP purpose-specific consent for ML training)
  consent_ml_training BOOLEAN NOT NULL DEFAULT false
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON public.events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_entity ON public.events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at);

-- GIN Index on properties for fast query extraction (e.g. searching compared certs by name/domain)
CREATE INDEX IF NOT EXISTS idx_events_properties ON public.events USING gin (properties);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — APPEND-ONLY BLACK BOX RECORDER
-- ============================================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 1. INSERT POLICY:
-- Authenticated users can insert rows where user_id = auth.uid() OR user_id IS NULL.
-- Anonymous users (anon role) can insert rows where user_id IS NULL.
CREATE POLICY "Users and anon can insert events" ON public.events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

-- 2. SELECT POLICY:
-- Authenticated users can only read their own events.
CREATE POLICY "Users can select own events" ON public.events
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Note: No UPDATE or DELETE policies are granted to anon or authenticated.
-- The events table acts as an immutable append-only ledger.
