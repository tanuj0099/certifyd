-- ============================================================================
-- Certifyd Phase 5 & 6: Leverage Tokens & Double-Sided Referrals
-- Minimal, non-gamified balance ledger and referral tracking
-- ============================================================================

-- 1. LEVERAGE TOKENS LEDGER
CREATE TABLE IF NOT EXISTS public.leverage_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'profile_complete' | 'roi_calc_run' | 'cert_logged' | 'redeemed_market_pulse_early' | 'referral_signup' | 'referral_converted'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leverage_tokens_user_id ON public.leverage_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_leverage_tokens_reason_created ON public.leverage_tokens(user_id, reason, created_at DESC);

ALTER TABLE public.leverage_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own token ledger"
  ON public.leverage_tokens
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can insert token transactions"
  ON public.leverage_tokens
  FOR INSERT
  WITH CHECK (true);

-- 2. USER REWARD FLAGS
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS market_pulse_early_access BOOLEAN DEFAULT FALSE;

-- 3. REFERRALS TABLE
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  referee_email TEXT,
  referee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending', -- 'pending' | 'signed_up' | 'converted'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON public.referrals(referee_id);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own referrals"
  ON public.referrals
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert or update referrals"
  ON public.referrals
  FOR ALL
  USING (true)
  WITH CHECK (true);
