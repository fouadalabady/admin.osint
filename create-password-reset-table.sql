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
  
ALTER TABLE public.password_reset_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all password reset verifications" 
  ON public.password_reset_verifications
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Users can view their own password reset verifications" 
  ON public.password_reset_verifications
  FOR SELECT 
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Service role can insert password reset verifications" 
  ON public.password_reset_verifications
  FOR INSERT 
  TO service_role 
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_password_reset_verifications_email ON public.password_reset_verifications (email);
CREATE INDEX IF NOT EXISTS idx_password_reset_verifications_code ON public.password_reset_verifications (code);
CREATE INDEX IF NOT EXISTS idx_password_reset_verifications_type ON public.password_reset_verifications (type);
CREATE INDEX IF NOT EXISTS idx_password_reset_verifications_expires_at ON public.password_reset_verifications (expires_at);

GRANT ALL ON public.password_reset_verifications TO service_role;
GRANT ALL ON public.password_reset_verifications TO postgres; 