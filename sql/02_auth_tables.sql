-- OSINT Dashboard Authentication Tables
-- This file contains the tables required for authentication and registration

-- Create otp_verifications table for one-time password verification
CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    purpose TEXT DEFAULT 'registration' NOT NULL
);

-- Create user_registration_requests table for managing registration flow
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

-- Create password_reset_verifications table for password reset flow
CREATE TABLE IF NOT EXISTS public.password_reset_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
  
    CONSTRAINT unique_active_code UNIQUE (email, code, type, verified)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email ON public.otp_verifications (email);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON public.otp_verifications (expires_at);
CREATE INDEX IF NOT EXISTS idx_user_registration_requests_email ON public.user_registration_requests (email);
CREATE INDEX IF NOT EXISTS idx_user_registration_requests_status ON public.user_registration_requests (status);
CREATE INDEX IF NOT EXISTS idx_password_reset_verifications_email ON public.password_reset_verifications (email);
CREATE INDEX IF NOT EXISTS idx_password_reset_verifications_code ON public.password_reset_verifications (code);
CREATE INDEX IF NOT EXISTS idx_password_reset_verifications_type ON public.password_reset_verifications (type);
CREATE INDEX IF NOT EXISTS idx_password_reset_verifications_expires_at ON public.password_reset_verifications (expires_at);

-- Enable Row Level Security for all tables
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_verifications ENABLE ROW LEVEL SECURITY;

-- Create triggers for updated_at column
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