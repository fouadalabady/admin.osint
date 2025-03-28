-- OSINT Dashboard Complete Database Setup Script
-- Run this script in your Supabase SQL Editor to set up the database

-- Step 1: Create the exec_sql function
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the function creator
AS $$
DECLARE
    result jsonb := '[]'::jsonb;
    err_context text;
    err_detail text;
    err_hint text;
    err_message text;
    err_position text;
    err_sqlstate text;
BEGIN
    BEGIN
        EXECUTE sql;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS
            err_message = MESSAGE_TEXT,
            err_detail = PG_EXCEPTION_DETAIL,
            err_hint = PG_EXCEPTION_HINT,
            err_context = PG_EXCEPTION_CONTEXT,
            err_position = PG_CONTEXT,
            err_sqlstate = RETURNED_SQLSTATE;

        result := json_build_object(
            'error', json_build_object(
                'message', err_message,
                'detail', err_detail,
                'hint', err_hint,
                'context', err_context,
                'position', err_position,
                'sqlstate', err_sqlstate
            )
        )::jsonb;
        RETURN result;
    END;

    RETURN result;
END;
$$;

-- Grant execute permission to the service role
ALTER FUNCTION public.exec_sql(text) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;

-- Step 2: Create registration status enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_registration_status') THEN
        CREATE TYPE public.user_registration_status AS ENUM (
            'pending',
            'approved',
            'rejected'
        );
    END IF;
END$$;

-- Step 3: Create otp_verifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT unique_active_code UNIQUE (email, code, type, verified)
);

-- Step 4: Create user_registration_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    status public.user_registration_status DEFAULT 'pending'::public.user_registration_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email ON public.otp_verifications (email);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_code ON public.otp_verifications (code);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_type ON public.otp_verifications (type);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON public.otp_verifications (expires_at);
CREATE INDEX IF NOT EXISTS idx_user_registration_requests_email ON public.user_registration_requests (email);
CREATE INDEX IF NOT EXISTS idx_user_registration_requests_status ON public.user_registration_requests (status);

-- Step 6: Enable Row Level Security
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_registration_requests ENABLE ROW LEVEL SECURITY;

-- Step 7: Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create triggers for updated_at if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_otp_verifications_updated_at') THEN
        CREATE TRIGGER set_otp_verifications_updated_at
        BEFORE UPDATE ON public.otp_verifications
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_user_registration_requests_updated_at') THEN
        CREATE TRIGGER set_user_registration_requests_updated_at
        BEFORE UPDATE ON public.user_registration_requests
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END
$$;

-- Step 9: Create RLS policies for otp_verifications
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

-- Step 10: Create RLS policies for user_registration_requests
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

-- Step 11: Verify tables were created successfully
SELECT
    'Database setup completed successfully!' as result,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'otp_verifications') AS otp_verifications_exists,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_registration_requests') AS user_registration_requests_exists;