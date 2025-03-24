-- Create otp_verifications table for password reset and verification codes
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

-- Add RLS policies for otp_verifications
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Add policy to allow the service role to manage all verifications
CREATE POLICY "Service role can manage all verifications" 
  ON public.otp_verifications
  FOR ALL
  TO service_role
  USING (true);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email ON public.otp_verifications (email);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_code ON public.otp_verifications (code);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_type ON public.otp_verifications (type);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON public.otp_verifications (expires_at);

-- Grant necessary permissions
GRANT ALL ON public.otp_verifications TO service_role;
GRANT ALL ON public.otp_verifications TO postgres;

-- Confirm the table was created
SELECT 'otp_verifications table created successfully' as result; 