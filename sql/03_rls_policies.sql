-- OSINT Dashboard Row Level Security Policies
-- This file contains all row-level security policies for authentication tables

-- Create RLS policies for otp_verifications
DO $$
BEGIN
    -- Policy for users to manage their own verifications
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'otp_manage_own') THEN
        CREATE POLICY otp_manage_own ON public.otp_verifications
        FOR ALL
        TO authenticated
        USING (email = auth.jwt() ->> 'email')
        WITH CHECK (email = auth.jwt() ->> 'email');
    END IF;

    -- Policy for service role to manage all verifications
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'otp_service_role_all') THEN
        CREATE POLICY otp_service_role_all ON public.otp_verifications
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
    END IF;
END
$$;

-- Create RLS policies for user_registration_requests
DO $$
BEGIN
    -- Policy for users to view their own requests
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'registration_view_own') THEN
        CREATE POLICY registration_view_own ON public.user_registration_requests
        FOR SELECT
        TO authenticated
        USING (email = auth.jwt() ->> 'email');
    END IF;

    -- Policy for service role to manage all requests
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'registration_service_role_all') THEN
        CREATE POLICY registration_service_role_all ON public.user_registration_requests
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
    END IF;
END
$$;

-- Create RLS policies for password_reset_verifications
DO $$
BEGIN
    -- Policy for service role to manage all password reset verifications
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'password_reset_service_role_all') THEN
        CREATE POLICY password_reset_service_role_all
        ON public.password_reset_verifications
        FOR ALL
        TO service_role
        USING (true);
    END IF;

    -- Policy for users to view their own password reset verifications
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'password_reset_view_own') THEN 
        CREATE POLICY password_reset_view_own
        ON public.password_reset_verifications
        FOR SELECT 
        USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
    END IF;
END
$$;

-- Grant appropriate permissions
GRANT ALL ON public.password_reset_verifications TO service_role;
GRANT ALL ON public.password_reset_verifications TO postgres; 