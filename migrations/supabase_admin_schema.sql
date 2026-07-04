-- Supabase Admin Dashboard Schema Additions
-- cert_ops_admin_schema.sql

-- 1. Ensure core tables exist with all required columns
CREATE TABLE IF NOT EXISTS resume_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  city TEXT DEFAULT 'Bengaluru',
  domain TEXT DEFAULT 'Cloud Engineering',
  certs_found JSONB DEFAULT '["AWS Certified Solutions Architect"]'::jsonb,
  exp_band TEXT DEFAULT '3-5 yrs',
  pii_scan JSONB DEFAULT '{"pass": true, "name_detected": false, "email_detected": false, "phone_detected": false, "pan_detected": false}'::jsonb,
  anomaly_score INTEGER DEFAULT 15,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','flagged')),
  extracted_data JSONB DEFAULT '{"role_category": "Cloud Eng", "education_tier": "Tier 2", "employer_type": "Product", "cert_stack": ["AWS SAA"]}'::jsonb,
  user_id UUID DEFAULT gen_random_uuid(),
  rejection_reason TEXT,
  internal_notes JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS offer_letter_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  city TEXT DEFAULT 'Bengaluru',
  domain TEXT DEFAULT 'Cloud Engineering',
  ctc_band TEXT DEFAULT '₹8-12L',
  role_category TEXT DEFAULT 'Cloud Eng',
  employer_sector TEXT DEFAULT 'Product / SaaS',
  trap_flags JSONB DEFAULT '["CTC Inflation", "90-Day Notice"]'::jsonb,
  counter_offer_shown TEXT DEFAULT '₹9.2L',
  negotiation_email TEXT DEFAULT 'Dear HR,\n\nThank you for the offer. Based on current market standards in Bengaluru for certified Solutions Architects, I would like to request a revision to ₹9.2L fixed CTC.\n\nBest regards,\nCandidate',
  anomaly_score INTEGER DEFAULT 22,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','flagged')),
  extracted_data JSONB DEFAULT '{"headline_ctc": "₹8.5L", "gross_takehome": "₹7.96L", "pf_inclusion": true, "notice_period_days": 90}'::jsonb,
  user_id UUID DEFAULT gen_random_uuid(),
  rejection_reason TEXT,
  internal_notes JSONB DEFAULT '[]'::jsonb
);

-- Add status column if existing tables lacked it
ALTER TABLE resume_submissions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

ALTER TABLE offer_letter_submissions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add status column to resumes and offer_letters if they exist
ALTER TABLE IF EXISTS resumes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE IF EXISTS offer_letters ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 2. Certifications Table and Staging Table
CREATE TABLE IF NOT EXISTS certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cert_name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  exam_fee INTEGER DEFAULT 12500,
  prep_cost INTEGER DEFAULT 5000,
  study_hours INTEGER DEFAULT 120,
  validity TEXT DEFAULT '3 Years',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  changed_by TEXT DEFAULT 'system',
  diff_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS certifications_staging (
  LIKE certifications INCLUDING ALL,
  staged_at TIMESTAMPTZ DEFAULT NOW(),
  staged_by TEXT,
  change_summary TEXT
);

-- 3. Market Jobs Table and Staging Table
CREATE TABLE IF NOT EXISTS market_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cert_name TEXT NOT NULL,
  city TEXT DEFAULT 'Bengaluru',
  open_roles INTEGER DEFAULT 1423,
  yoy_change INTEGER DEFAULT 18,
  heat_factor TEXT DEFAULT 'High',
  sources_count JSONB DEFAULT '{"Naukri": 1200, "TimesJobs": 445, "Indeed": 234, "Foundit": 178}'::jsonb,
  data_quality INTEGER DEFAULT 87,
  last_scraped TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'live'
);

CREATE TABLE IF NOT EXISTS market_jobs_staging (
  LIKE market_jobs INCLUDING ALL,
  staged_at TIMESTAMPTZ DEFAULT NOW(),
  staged_by TEXT
);

-- 4. Feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
  flag_name TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT,
  description TEXT
);

INSERT INTO feature_flags VALUES
('offer_letter_analyzer', true, NOW(), 'system', 'Toggle Offer Letter Analyzer on public site'),
('roi_calculator', true, NOW(), 'system', 'Toggle ROI Calculator on public site'),
('resume_analysis', true, NOW(), 'system', 'Toggle Resume Analysis on public site'),
('market_pulse', true, NOW(), 'system', 'Toggle Market Pulse on public site'),
('new_signups', true, NOW(), 'system', 'Allow new user registrations')
ON CONFLICT DO NOTHING;

-- 5. Audit log (append only — no update or delete RLS)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  admin_email TEXT NOT NULL,
  admin_role TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_table TEXT,
  target_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT
);

-- RLS on audit_log: insert only, no updates or deletes
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insert_only" ON audit_log;
CREATE POLICY "insert_only" ON audit_log FOR INSERT WITH CHECK (true);

-- 6. Feedback Messages and Contact Submissions tables
CREATE TABLE IF NOT EXISTS feedback_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tool_used TEXT DEFAULT 'ROI Calculator',
  rating INTEGER DEFAULT 5,
  category TEXT DEFAULT 'Positive',
  excerpt TEXT DEFAULT 'Extremely accurate ROI breakdown for AWS SAA!',
  full_feedback TEXT DEFAULT 'Extremely accurate ROI breakdown for AWS SAA! Helped me negotiate a 25% hike in Bengaluru.',
  session_context JSONB DEFAULT '{"cert_analyzed": "AWS Certified Solutions Architect", "city": "Bengaluru", "role": "Cloud Eng"}'::jsonb,
  assigned_to TEXT,
  status TEXT DEFAULT 'New',
  internal_notes JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT DEFAULT 'Placement Officer',
  email TEXT DEFAULT 'placement@tier1college.edu.in',
  category TEXT DEFAULT 'Placement Cell',
  subject TEXT DEFAULT 'Inquiry regarding batch certification analysis pilot',
  message TEXT DEFAULT 'We would like to run a pilot program for our 150 final year CS students using Certifyd ROI tools.',
  priority TEXT DEFAULT 'HIGH',
  status TEXT DEFAULT 'New',
  follow_up_date DATE DEFAULT (CURRENT_DATE + INTERVAL '3 days'),
  internal_notes JSONB DEFAULT '[]'::jsonb,
  tag TEXT DEFAULT 'Hot Lead'
);

-- Seed initial sample data if tables are empty
INSERT INTO certifications (cert_name, vendor, exam_fee, prep_cost, study_hours, validity)
SELECT 'AWS Certified Solutions Architect', 'Amazon Web Services', 12500, 5000, 120, '3 Years'
WHERE NOT EXISTS (SELECT 1 FROM certifications WHERE cert_name = 'AWS Certified Solutions Architect');

INSERT INTO certifications (cert_name, vendor, exam_fee, prep_cost, study_hours, validity)
SELECT 'Microsoft Certified: Azure Administrator Associate', 'Microsoft', 11000, 4500, 100, '1 Year'
WHERE NOT EXISTS (SELECT 1 FROM certifications WHERE cert_name = 'Microsoft Certified: Azure Administrator Associate');

INSERT INTO market_jobs (cert_name, city, open_roles, yoy_change, heat_factor, data_quality)
SELECT 'AWS Certified Solutions Architect', 'Bengaluru', 1423, 18, 'High', 87
WHERE NOT EXISTS (SELECT 1 FROM market_jobs WHERE cert_name = 'AWS Certified Solutions Architect');

INSERT INTO market_jobs (cert_name, city, open_roles, yoy_change, heat_factor, data_quality)
SELECT 'Microsoft Certified: Azure Administrator Associate', 'Bengaluru', 1105, 14, 'High', 91
WHERE NOT EXISTS (SELECT 1 FROM market_jobs WHERE cert_name = 'Microsoft Certified: Azure Administrator Associate');
