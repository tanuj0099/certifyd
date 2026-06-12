-- Fix the fragmented cost columns by explicitly splitting into INR and USD

ALTER TABLE public.certifications RENAME COLUMN cost TO cost_inr;
ALTER TABLE public.certifications ADD COLUMN IF NOT EXISTS cost_usd NUMERIC DEFAULT 0;

-- Optional: ensure these columns never throw null errors
ALTER TABLE public.certifications ALTER COLUMN cost_inr SET DEFAULT 0;
