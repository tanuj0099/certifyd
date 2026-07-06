-- ==============================================================================
-- CERTIFYROI & CERTIFYD-OPS: PERMANENT DATABASE SCHEMA MIGRATION
-- Run this script in your Supabase SQL Editor to permanently store all ops
-- tasks, team events, department notes, and team allowlists in Postgres.
-- ==============================================================================

-- 1. OPS TEAM MEMBERS
CREATE TABLE IF NOT EXISTS public.ops_team_members (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'TEAM_MEMBER' CHECK (role IN ('SUPER_ADMIN', 'TEAM_MEMBER')),
  permissions JSONB DEFAULT '{"access_marketing": true, "access_technical": true, "access_database": true, "access_verifications": true, "access_content": true, "access_admin": false}'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. OPS TASKS & WORKFLOW ITEMS
CREATE TABLE IF NOT EXISTS public.ops_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  section TEXT DEFAULT 'marketing' CHECK (section IN ('marketing', 'technical', 'database', 'verifications', 'content', 'admin')),
  assignee TEXT,
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Urgent', 'High', 'Medium', 'Low')),
  deadline TEXT,
  status TEXT DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'In Review', 'Completed')),
  checklist JSONB DEFAULT '[]'::jsonb,
  notes JSONB DEFAULT '[]'::jsonb,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. OPS CALENDAR EVENTS
CREATE TABLE IF NOT EXISTS public.ops_calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT,
  section TEXT DEFAULT 'marketing' CHECK (section IN ('marketing', 'technical', 'database', 'verifications', 'content', 'admin')),
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. OPS DEPARTMENT NOTES & DISCUSSION THREADS
CREATE TABLE IF NOT EXISTS public.ops_notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  section TEXT DEFAULT 'marketing' CHECK (section IN ('marketing', 'technical', 'database', 'verifications', 'content', 'admin')),
  is_private BOOLEAN DEFAULT false,
  pinned BOOLEAN DEFAULT false,
  comments JSONB DEFAULT '[]'::jsonb,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. FEATURE FLAGS
CREATE TABLE IF NOT EXISTS public.feature_flags (
  flag_key TEXT PRIMARY KEY,
  flag_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ADMIN USERS ALLOWLIST
CREATE TABLE IF NOT EXISTS public.admin_users_allowlist (
  email TEXT PRIMARY KEY,
  role TEXT DEFAULT 'SUPER_ADMIN',
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY (RLS) & OPEN ACCESS FOR ADMIN SERVICE ROLE
ALTER TABLE public.ops_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users_allowlist ENABLE ROW LEVEL SECURITY;

-- CREATE POLICIES FOR FULL ACCESS
CREATE POLICY "Allow all operations for authenticated and service role" ON public.ops_team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated and service role" ON public.ops_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated and service role" ON public.ops_calendar_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated and service role" ON public.ops_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated and service role" ON public.feature_flags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated and service role" ON public.admin_users_allowlist FOR ALL USING (true) WITH CHECK (true);
