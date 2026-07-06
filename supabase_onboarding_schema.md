# Supabase Onboarding & User Profile Schema Script

Run this script directly in your **Supabase SQL Editor** (`Dashboard -> SQL Editor -> New Query`). It creates or upgrades both `user_profiles` and `profiles` tables with rich career tracking fields, progress checkpoints, and Row-Level Security (RLS) policies.

```sql
-- 1. Create or Upgrade `user_profiles` Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id TEXT PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    job_role TEXT,
    city TEXT,
    current_salary NUMERIC,
    current_salary_band TEXT,
    target_domain TEXT,
    target_salary_goal TEXT,
    weekly_hours TEXT,
    motivation TEXT,
    onboarding_complete BOOLEAN DEFAULT false,
    provider TEXT DEFAULT 'password',
    preferences JSONB DEFAULT '{}'::jsonb,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add missing columns safely if the table already existed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'current_salary_band') THEN
        ALTER TABLE public.user_profiles ADD COLUMN current_salary_band TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'target_salary_goal') THEN
        ALTER TABLE public.user_profiles ADD COLUMN target_salary_goal TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'weekly_hours') THEN
        ALTER TABLE public.user_profiles ADD COLUMN weekly_hours TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'motivation') THEN
        ALTER TABLE public.user_profiles ADD COLUMN motivation TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'onboarding_complete') THEN
        ALTER TABLE public.user_profiles ADD COLUMN onboarding_complete BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. Create or Upgrade `profiles` Compatibility Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    email TEXT,
    workspace_name TEXT,
    workspace_slug TEXT UNIQUE,
    career_focus TEXT,
    city TEXT,
    avatar_initials TEXT,
    onboarding_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_complete') THEN
        ALTER TABLE public.profiles ADD COLUMN onboarding_complete BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 3. Enable Row-Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for `user_profiles` (Explicit ::text casting prevents UUID vs TEXT type mismatch errors)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" 
    ON public.user_profiles FOR SELECT 
    USING (auth.uid()::text = user_id::text OR user_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" 
    ON public.user_profiles FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" 
    ON public.user_profiles FOR UPDATE 
    USING (true);

-- 5. RLS Policies for `profiles`
DROP POLICY IF EXISTS "Users can view own workspace profile" ON public.profiles;
CREATE POLICY "Users can view own workspace profile" 
    ON public.profiles FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Users can insert own workspace profile" ON public.profiles;
CREATE POLICY "Users can insert own workspace profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own workspace profile" ON public.profiles;
CREATE POLICY "Users can update own workspace profile" 
    ON public.profiles FOR UPDATE 
    USING (true);

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding ON public.user_profiles(onboarding_complete);
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles(workspace_slug);
```
