-- ################################################################
-- OSINT Dashboard Database Setup
-- ################################################################
-- Complete SQL setup script to be executed in Supabase SQL Editor
-- This will setup all necessary tables and policies for user registration and OTP verification

-- 1. Create user registration status type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_registration_status') THEN
    CREATE TYPE public.user_registration_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END
$$;

-- 2. Create OTP verifications table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  purpose TEXT DEFAULT 'registration' NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email
ON public.otp_verifications(email);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at
ON public.otp_verifications(expires_at);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own OTP verifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'otp_verifications' AND policyname = 'otp_manage_own'
  ) THEN
    CREATE POLICY otp_manage_own ON public.otp_verifications
    FOR ALL
    TO authenticated
    USING (email = auth.jwt() ->> 'email')
    WITH CHECK (email = auth.jwt() ->> 'email');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'otp_verifications' AND policyname = 'otp_service_role_all'
  ) THEN
    CREATE POLICY otp_service_role_all ON public.otp_verifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END
$$;

-- 3. Create user registration requests table
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_registration_requests_email
ON public.user_registration_requests(email);

CREATE INDEX IF NOT EXISTS idx_user_registration_requests_status
ON public.user_registration_requests(status);

-- Enable RLS
ALTER TABLE public.user_registration_requests ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own registration requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_registration_requests' AND policyname = 'registration_view_own'
  ) THEN
    CREATE POLICY registration_view_own ON public.user_registration_requests
    FOR SELECT
    TO authenticated
    USING (email = auth.jwt() ->> 'email');
  END IF;
END
$$;

-- Create policy for service role to manage all registration requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_registration_requests' AND policyname = 'registration_service_role_all'
  ) THEN
    CREATE POLICY registration_service_role_all ON public.user_registration_requests
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END
$$;

-- Create trigger for updating the updated_at field
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the table
DROP TRIGGER IF EXISTS set_otp_verifications_updated_at ON public.otp_verifications;
CREATE TRIGGER set_otp_verifications_updated_at
BEFORE UPDATE ON public.otp_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_user_registration_requests_updated_at ON public.user_registration_requests;
CREATE TRIGGER set_user_registration_requests_updated_at
BEFORE UPDATE ON public.user_registration_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Output success message
DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
END
$$;