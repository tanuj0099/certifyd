-- Tracking Ops Member Time
CREATE TABLE IF NOT EXISTS public.ops_time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_ping TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    active_seconds INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_email, session_date)
);

-- Index for querying attendance records quickly
CREATE INDEX IF NOT EXISTS idx_ops_time_logs_user_date ON public.ops_time_logs(user_email, session_date);
CREATE INDEX IF NOT EXISTS idx_ops_time_logs_date ON public.ops_time_logs(session_date);

-- Enable RLS
ALTER TABLE public.ops_time_logs ENABLE ROW LEVEL SECURITY;

-- Allow super admins to view all, and users to view their own
CREATE POLICY "Users can view own time logs" ON public.ops_time_logs
    FOR SELECT USING (
        auth.jwt() ->> 'email' = user_email OR
        EXISTS (
            SELECT 1 FROM public.admin_users_allowlist 
            WHERE email = auth.jwt() ->> 'email' AND role = 'SUPER_ADMIN'
        )
    );

-- Allow service role or authenticated ops user to upsert time logs
CREATE POLICY "Users can upsert own time logs" ON public.ops_time_logs
    FOR ALL USING (auth.jwt() ->> 'email' = user_email) WITH CHECK (auth.jwt() ->> 'email' = user_email);
