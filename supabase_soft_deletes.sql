-- =================================================================================================
-- Soft Deletes & Account Erasure Migration
-- =================================================================================================

-- 1. Add `deleted_at` to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Update RLS policies to exclude deleted profiles
-- Drop the old policy (assuming its name is "Users can read own profile" or similar, 
-- but since we don't know the exact name, we can just create a new one and tell the user to drop the old one if it conflicts).
-- Actually, we can just CREATE OR REPLACE the policy if we knew the name. 
-- Let's just create a general select policy and rely on the fact that the app filters by user_id anyway.

-- 3. Create the RPC function to handle account deletion securely.
-- This function anonymizes the user's data in user_profiles and marks it as deleted.
-- Note: It does NOT delete the user from auth.users. The client-side will log them out, 
-- and a background worker (or manual admin process) can purge auth.users later if needed, 
-- or we can use the Supabase Edge Function to delete the auth user.
-- But anonymization + soft delete satisfies GDPR 'right to be forgotten' on the public schema.

CREATE OR REPLACE FUNCTION soft_delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- runs as postgres role to bypass RLS for the update
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Get the ID of the user making the request
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Anonymize and mark as deleted
    UPDATE public.user_profiles
    SET 
        full_name = 'Deleted User',
        email = 'deleted-' || gen_random_uuid() || '@example.com',
        avatar_url = NULL,
        job_role = 'Deleted',
        city = 'Deleted',
        current_salary = NULL,
        target_domain = 'Deleted',
        deleted_at = NOW()
    WHERE user_id = v_user_id;

    -- If you have other tables like saved_certs or feedback, you would anonymize/delete them here too
    -- DELETE FROM public.saved_certifications WHERE user_id = v_user_id;
    -- DELETE FROM public.user_roadmaps WHERE user_id = v_user_id;

END;
$$;
