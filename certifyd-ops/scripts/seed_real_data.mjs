import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function seedRealData() {
  console.log('🌱 Seeding real production test data into Supabase...');

  // 1. Resume Submissions
  const resumes = [
    {
      city: 'Bengaluru',
      domain: 'Cloud Engineering',
      certs_found: ['AWS Certified Solutions Architect - Professional', 'HashiCorp Certified: Terraform Associate'],
      exp_band: '5-8 yrs',
      pii_scan: { pass: true, name_detected: false, email_detected: false, phone_detected: false },
      anomaly_score: 12,
      status: 'pending',
      extracted_data: { role_category: 'Cloud Architecture', education_tier: 'Tier 1', employer_type: 'Product / SaaS' },
      internal_notes: ['Strong multi-cloud cert profile']
    },
    {
      city: 'Hyderabad',
      domain: 'Data Science & AI',
      certs_found: ['Google Cloud Professional Data Engineer', 'Databricks Certified Data Engineer Professional'],
      exp_band: '3-5 yrs',
      pii_scan: { pass: true, name_detected: false, email_detected: false, phone_detected: false },
      anomaly_score: 28,
      status: 'approved',
      extracted_data: { role_category: 'ML Engineering', education_tier: 'Tier 2', employer_type: 'Fintech' },
      internal_notes: []
    },
    {
      city: 'Pune',
      domain: 'Cybersecurity',
      certs_found: ['Certified Information Systems Security Professional (CISSP)', 'OffSec Certified Professional (OSCP)'],
      exp_band: '8-12 yrs',
      pii_scan: { pass: false, name_detected: true, email_detected: false, phone_detected: true },
      anomaly_score: 85,
      status: 'flagged',
      rejection_reason: 'PII Leak: Candidate full name and mobile number found in header',
      extracted_data: { role_category: 'Security Architecture', education_tier: 'Tier 1', employer_type: 'Banking' },
      internal_notes: ['Flagged by automated PII scan']
    }
  ];

  for (const r of resumes) {
    await supabase.from('resume_submissions').insert(r);
  }
  console.log('✅ Seeded resume_submissions');

  // 2. Offer Letter Submissions
  const offers = [
    {
      city: 'Bengaluru',
      domain: 'Cloud Engineering',
      ctc_band: '₹28-35L',
      role_category: 'Senior Cloud Architect',
      employer_sector: 'Product / SaaS',
      trap_flags: ['CTC Inflation: 22% variable ESOP vesting over 4 years', '90-Day Notice Period'],
      counter_offer_shown: '₹32.5L Fixed CTC + 10% Annual Performance Bonus',
      negotiation_email: 'Dear HR,\n\nThank you for extending the offer for Senior Cloud Architect. Based on current compensation benchmarks in Bengaluru for AWS Professional certified architects, I request a restructuring to ₹32.5L fixed CTC with a 60-day notice period.\n\nBest regards,\nCandidate',
      anomaly_score: 35,
      status: 'pending',
      extracted_data: { headline_ctc: '₹34.0L', gross_takehome: '₹26.5L', pf_inclusion: true, notice_period_days: 90 },
      internal_notes: ['Typical ESOP inflation pattern']
    },
    {
      city: 'Mumbai',
      domain: 'DevOps & SRE',
      ctc_band: '₹18-22L',
      role_category: 'Site Reliability Engineer',
      employer_sector: 'Fintech / Banking',
      trap_flags: ['Clawback Clause: 100% signing bonus return if exiting before 18 months'],
      counter_offer_shown: '₹20.0L Fixed CTC without signing bonus retention lock',
      negotiation_email: 'Dear Hiring Team,\n\nI am excited about the SRE role. I would like to discuss removing the 18-month signing bonus clawback clause or rolling it into standard base pay.\n\nSincerely,\nCandidate',
      anomaly_score: 42,
      status: 'flagged',
      extracted_data: { headline_ctc: '₹21.5L', gross_takehome: '₹18.0L', pf_inclusion: false, notice_period_days: 60 },
      internal_notes: []
    }
  ];

  for (const o of offers) {
    await supabase.from('offer_letter_submissions').insert(o);
  }
  console.log('✅ Seeded offer_letter_submissions');

  // 3. Market Jobs
  const jobs = [
    { cert_name: 'AWS Certified Solutions Architect - Associate', city: 'Bengaluru', open_roles: 1420, yoy_change: 22, heat_factor: 'High', sources_count: { Naukri: 850, LinkedIn: 420, Foundit: 150 }, data_quality: 92, status: 'live' },
    { cert_name: 'Google Cloud Certified Professional Data Engineer', city: 'Hyderabad', open_roles: 840, yoy_change: 35, heat_factor: 'High', sources_count: { Naukri: 510, LinkedIn: 280, Foundit: 50 }, data_quality: 89, status: 'live' },
    { cert_name: 'Certified Information Systems Security Professional (CISSP)', city: 'Mumbai', open_roles: 610, yoy_change: 15, heat_factor: 'Medium', sources_count: { Naukri: 390, LinkedIn: 180, Foundit: 40 }, data_quality: 95, status: 'live' },
    { cert_name: 'Certified Kubernetes Administrator (CKA)', city: 'Bengaluru', open_roles: 1150, yoy_change: 41, heat_factor: 'High', sources_count: { Naukri: 680, LinkedIn: 380, Foundit: 90 }, data_quality: 91, status: 'live' }
  ];

  for (const j of jobs) {
    await supabase.from('market_jobs').insert(j);
    await supabase.from('market_jobs_staging').insert({ ...j, open_roles: j.open_roles + 85, yoy_change: j.yoy_change + 3 });
  }
  console.log('✅ Seeded market_jobs and market_jobs_staging');

  // 4. Contact Submissions
  const contacts = [
    {
      name: 'Dr. Ramesh Sharma (Head of Placement)',
      email: 'placements@iitb.ac.in',
      category: 'Placement Cell',
      subject: 'Institutional Partnership for Batch 2026 CS Placement Intelligence',
      message: 'We want to integrate Certifyd ROI and compensation benchmarking tools into our placement preparation workflow for 180 Computer Science students.',
      priority: 'HIGH',
      status: 'New',
      tag: 'Tier-1 University Lead',
      internal_notes: ['Priority outreach required within 24 hours']
    },
    {
      name: 'Ananya Verma (Talent Acquisition Lead)',
      email: 'ananya.v@razorpay.com',
      category: 'Enterprise HR',
      subject: 'API Access for Verified Certification Verification',
      message: 'Looking to explore an enterprise subscription to cross-reference candidate certification claims against your verified benchmark dataset.',
      priority: 'MEDIUM',
      status: 'In Progress',
      tag: 'Corporate Buyer Lead',
      internal_notes: []
    }
  ];

  for (const c of contacts) {
    await supabase.from('contact_submissions').insert(c);
  }
  console.log('✅ Seeded contact_submissions');

  // 5. Feature Flags
  const flags = [
    { flag_name: 'enable_ai_analyzer', enabled: true, updated_by: 'tanuj@example.com', description: 'Enables Groq llama3-70b AI extraction on resume and offer letter uploads.' },
    { flag_name: 'enable_pii_strict', enabled: true, updated_by: 'tanuj@example.com', description: 'Strict PII Rejection Mode: Immediately auto-rejects submissions with phone numbers or email patterns.' },
    { flag_name: 'enable_counter_offers', enabled: true, updated_by: 'tanuj@example.com', description: 'Generates automated negotiation response drafts for candidates with trap offer flags.' },
    { flag_name: 'enable_live_scraping', enabled: true, updated_by: 'system', description: 'Controls background scraper jobs pulling salary medians from regional portals.' },
    { flag_name: 'maintenance_mode', enabled: false, updated_by: 'tanuj@example.com', description: 'Puts certifyd.in into read-only maintenance mode with top warning banner.' }
  ];

  for (const f of flags) {
    await supabase.from('feature_flags').upsert(f);
  }
  console.log('✅ Seeded feature_flags');

  // 6. Audit Log
  const audits = [
    {
      admin_email: 'tanuj@example.com',
      admin_role: 'SUPER_ADMIN',
      action_type: 'PUSH_CERTIFICATIONS_TO_LIVE',
      target_table: 'certifications',
      target_id: 'Bulk Push (211 records)',
      ip_address: '103.21.244.12',
      old_value: { staging_count: 3522, version: 'v2.3.0' },
      new_value: { live_count: 211, version: 'v2.4.0', status: 'deployed' }
    },
    {
      admin_email: 'tanuj@example.com',
      admin_role: 'SUPER_ADMIN',
      action_type: 'TOGGLE_FEATURE_FLAG',
      target_table: 'feature_flags',
      target_id: 'enable_counter_offers',
      ip_address: '103.21.244.12',
      old_value: { enabled: false },
      new_value: { enabled: true }
    }
  ];

  for (const a of audits) {
    await supabase.from('audit_log').insert(a);
  }
  console.log('✅ Seeded audit_log');

  console.log('🎉 Real Supabase database seeding complete!');
}

seedRealData();
