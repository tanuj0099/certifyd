-- =========================================================================================
-- Phase 2 DPDP Compliance: 12-Month Automated Data Retention Policy
-- This script leverages Supabase's built-in pg_cron extension to automatically 
-- sweep the database and anonymize inactive accounts older than 12 months.
-- =========================================================================================

-- 1. Enable the pg_cron extension
-- NOTE: In Supabase, this extension can also be enabled via the Dashboard (Database -> Extensions).
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create the Retention Sweep Function
-- This function mimics `soft_delete_user` but targets users based on inactivity.
-- We check `user_profiles.updated_at` to determine inactivity.
CREATE OR REPLACE FUNCTION process_12_month_retention_sweep()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update all user_profiles where the last update was more than 12 months ago
    -- We blank out the PII and sensitive career data, leaving a tombstone record
    UPDATE public.user_profiles
    SET 
        full_name = 'Anonymized due to inactivity',
        current_salary = NULL,
        job_role = 'Data Erased (Retention Policy)',
        technical_skills = '[]'::jsonb,
        applied_projects = '[]'::jsonb,
        updated_at = NOW()
    WHERE 
        updated_at < (NOW() - INTERVAL '12 months')
        AND full_name != 'Anonymized due to inactivity' -- prevent running on already deleted rows
        AND full_name != 'Deleted User'; -- prevent running on manual soft deletes
END;
$$;

-- 3. Schedule the Cron Job
-- Schedule the sweep to run once a day at midnight.
-- Format: min hour dom mon dow
SELECT cron.schedule(
    'dpdp_12_month_retention_sweep', -- Job Name
    '0 0 * * *',                     -- Run daily at 00:00
    'SELECT process_12_month_retention_sweep();'
);

-- Note: You can view scheduled jobs with:
-- SELECT * FROM cron.job;
--
-- You can unschedule this job later with:
-- SELECT cron.unschedule('dpdp_12_month_retention_sweep');
