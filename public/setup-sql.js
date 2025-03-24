// Setup procedures SQL
export const setupProceduresSQL = `-- Create an enum for user status if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE "public"."user_status" AS ENUM ('pending', 'active', 'rejected', 'suspended');
  END IF;
END
$$;

-- Create OTP verifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."otp_verifications" (
  "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "email" TEXT NOT NULL,
  "otp_hash" TEXT NOT NULL,
  "purpose" TEXT NOT NULL DEFAULT 'email_verification',
  "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "verified_at" TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_verifications_user_id_purpose 
ON public.otp_verifications(user_id, purpose);

-- Create user registration requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."user_registration_requests" (
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

-- Create indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_registration_requests_user_id 
ON public.user_registration_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_user_registration_requests_status 
ON public.user_registration_requests(status);

-- Enable RLS on tables
ALTER TABLE IF EXISTS "public"."otp_verifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."user_registration_requests" ENABLE ROW LEVEL SECURITY;

-- Create policies for OTP verifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'otp_verifications' AND policyname = 'Users can view their own OTP verifications'
  ) THEN
    CREATE POLICY "Users can view their own OTP verifications" 
    ON "public"."otp_verifications"
    FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'otp_verifications' AND policyname = 'Service role can insert OTP verifications'
  ) THEN
    CREATE POLICY "Service role can insert OTP verifications" 
    ON "public"."otp_verifications"
    FOR INSERT TO service_role USING (true);
  END IF;
END
$$;

-- Create policies for user registration requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_registration_requests' AND policyname = 'Users can view their own registration request'
  ) THEN
    CREATE POLICY "Users can view their own registration request" 
    ON "public"."user_registration_requests"
    FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_registration_requests' AND policyname = 'Admins can view all registration requests'
  ) THEN
    CREATE POLICY "Admins can view all registration requests" 
    ON "public"."user_registration_requests"
    FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() AND (raw_user_meta_data->>'role')::text IN ('admin', 'super_admin')
      )
    );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_registration_requests' AND policyname = 'Admins can update registration requests'
  ) THEN
    CREATE POLICY "Admins can update registration requests" 
    ON "public"."user_registration_requests"
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
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_registration_requests' AND policyname = 'Service role can insert registration requests'
  ) THEN
    CREATE POLICY "Service role can insert registration requests" 
    ON "public"."user_registration_requests"
    FOR INSERT TO service_role USING (true);
  END IF;
END
$$;`;

// Setup commands
export const setupCommands = `
-- Check tables were created
SELECT * FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('otp_verifications', 'user_registration_requests');
`;
