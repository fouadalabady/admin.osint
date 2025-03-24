-- Create an enum for user status
CREATE TYPE "public"."user_status" AS ENUM ('pending', 'active', 'rejected', 'suspended');

-- Create a table for OTP verification
CREATE TABLE "public"."otp_verifications" (
  "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "email" TEXT NOT NULL,
  "otp_hash" TEXT NOT NULL,
  "purpose" TEXT NOT NULL DEFAULT 'email_verification', -- Can be: email_verification, password_reset, etc.
  "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "verified_at" TIMESTAMP WITH TIME ZONE
);

-- Create index on user_id and purpose for faster lookups
CREATE INDEX idx_otp_verifications_user_id_purpose ON public.otp_verifications(user_id, purpose);

-- Create a table for user registration requests
CREATE TABLE "public"."user_registration_requests" (
  "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "status" user_status NOT NULL DEFAULT 'pending',
  "requested_role" TEXT NOT NULL,
  "admin_notes" TEXT,
  "reviewed_by" UUID REFERENCES auth.users(id),
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "email_verified" BOOLEAN NOT NULL DEFAULT false
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_user_registration_requests_user_id ON public.user_registration_requests(user_id);
CREATE INDEX idx_user_registration_requests_status ON public.user_registration_requests(status);

-- Create a function to update timestamp
CREATE OR REPLACE FUNCTION update_timestamp() 
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_user_registration_requests_timestamp
BEFORE UPDATE ON public.user_registration_requests
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Create RLS policies for OTP verifications
ALTER TABLE "public"."otp_verifications" ENABLE ROW LEVEL SECURITY;

-- Only the authenticated user can see their own OTP verifications
CREATE POLICY "Users can view their own OTP verifications" ON "public"."otp_verifications"
FOR SELECT USING (auth.uid() = user_id);

-- Allow insert from service role (for API routes)
CREATE POLICY "Service role can insert OTP verifications" ON "public"."otp_verifications"
FOR INSERT TO service_role WITH CHECK (true);

-- Create RLS policies for registration requests
ALTER TABLE "public"."user_registration_requests" ENABLE ROW LEVEL SECURITY;

-- Users can view their own registration request
CREATE POLICY "Users can view their own registration request" ON "public"."user_registration_requests"
FOR SELECT USING (auth.uid() = user_id);

-- Admin users can view all registration requests
CREATE POLICY "Admins can view all registration requests" ON "public"."user_registration_requests"
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND (raw_user_meta_data->>'role')::text IN ('admin', 'super_admin')
  )
);

-- Only admins can update registration requests
CREATE POLICY "Admins can update registration requests" ON "public"."user_registration_requests"
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND (raw_user_meta_data->>'role')::text IN ('admin', 'super_admin')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND (raw_user_meta_data->>'role')::text IN ('admin', 'super_admin')
  )
);

-- Allow insert from service role (for API routes)
CREATE POLICY "Service role can insert registration requests" ON "public"."user_registration_requests"
FOR INSERT TO service_role WITH CHECK (true); 