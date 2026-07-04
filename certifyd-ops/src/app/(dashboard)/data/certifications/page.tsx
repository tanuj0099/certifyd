import React from 'react';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { CertificationsClient, CertRecord } from '@/components/data/CertificationsClient';

export const revalidate = 0;

export default async function CertificationsPage() {
  const session = await getSession();
  const userRole = session?.role || 'SUPER_ADMIN';

  let liveList: CertRecord[] = [];
  let stagingList: CertRecord[] = [];

  try {
    const [liveRes, stagingRes] = await Promise.all([
      supabaseAdmin.from('certifications').select('*').limit(50),
      supabaseAdmin.from('certifications_staging').select('*').limit(50),
    ]);

    if (liveRes.data && liveRes.data.length > 0) {
      liveList = liveRes.data.map((c) => ({
        id: c.id,
        name: c.cert_name || c.name || 'AWS Certified Solutions Architect',
        vendor: c.vendor || 'Amazon Web Services',
        domain: c.domain || c.vendor || 'Cloud Architecture',
        avg_salary_lift: c.avg_salary_lift || '32%',
        demand_score: c.demand_score || 9,
        difficulty: c.difficulty || 'Intermediate',
        last_verified: c.last_updated || c.last_verified || new Date().toISOString(),
        serving_status: c.serving_status || 'serving',
        career_stage: c.career_stage || 'Mid-Level (3-6 yrs)',
        skills: Array.isArray(c.skills) ? c.skills : ['VPC', 'EC2', 'S3', 'IAM', 'RDS'],
      }));
    }

    if (stagingRes.data && stagingRes.data.length > 0) {
      stagingList = stagingRes.data.map((c) => ({
        id: c.id,
        name: c.cert_name || c.name || 'AWS Certified Solutions Architect',
        vendor: c.vendor || 'Amazon Web Services',
        domain: c.domain || c.vendor || 'Cloud Architecture',
        avg_salary_lift: c.avg_salary_lift || '34%',
        demand_score: c.demand_score || 9,
        difficulty: c.difficulty || 'Intermediate',
        last_verified: c.last_updated || c.last_verified || new Date().toISOString(),
        serving_status: c.serving_status || 'serving',
        career_stage: c.career_stage || 'Mid-Level (3-6 yrs)',
        skills: Array.isArray(c.skills) ? c.skills : ['VPC', 'EC2', 'S3', 'IAM', 'RDS'],
        diff_summary: c.diff_summary || [],
      }));
    }
  } catch (e) {
    console.warn('Certifications fetch error:', e);
  }

  return <CertificationsClient initialLive={liveList} initialStaging={stagingList} userRole={userRole} />;
}
