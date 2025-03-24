-- Create a function to create the user_status enum
CREATE OR REPLACE FUNCTION create_user_status_enum()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE "public"."user_status" AS ENUM ('pending', 'active', 'rejected', 'suspended');
  END IF;
END;
$$;

-- Create the update_timestamp function for triggers
CREATE OR REPLACE FUNCTION update_timestamp() 
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a function to create the otp_verifications table
CREATE OR REPLACE FUNCTION create_otp_verifications_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'otp_verifications') THEN
    -- Create the OTP verifications table
    CREATE TABLE "public"."otp_verifications" (
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
    CREATE INDEX IF NOT EXISTS idx_otp_verifications_user_id_purpose ON public.otp_verifications(user_id, purpose);

    -- Enable RLS
    ALTER TABLE "public"."otp_verifications" ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can view their own OTP verifications" ON "public"."otp_verifications"
    FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Service role can insert OTP verifications" ON "public"."otp_verifications"
    FOR INSERT TO service_role USING (true);
  END IF;
END;
$$;

-- Create a function to create the user_registration_requests table
CREATE OR REPLACE FUNCTION create_registration_requests_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First ensure the user_status enum exists
  PERFORM create_user_status_enum();
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_registration_requests') THEN
    -- Create the registration requests table
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

    -- Create indices for faster lookups
    CREATE INDEX IF NOT EXISTS idx_user_registration_requests_user_id ON public.user_registration_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_registration_requests_status ON public.user_registration_requests(status);

    -- Create a trigger to automatically update the updated_at column
    CREATE TRIGGER update_user_registration_requests_timestamp
    BEFORE UPDATE ON public.user_registration_requests
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

    -- Enable RLS
    ALTER TABLE "public"."user_registration_requests" ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can view their own registration request" ON "public"."user_registration_requests"
    FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Admins can view all registration requests" ON "public"."user_registration_requests"
    FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() AND (raw_user_meta_data->>'role')::text IN ('admin', 'super_admin')
      )
    );

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

    CREATE POLICY "Service role can insert registration requests" ON "public"."user_registration_requests"
    FOR INSERT TO service_role USING (true);
  END IF;
END;
$$;

-- Grant execute permission to the service role for all functions
GRANT EXECUTE ON FUNCTION create_user_status_enum() TO service_role;
GRANT EXECUTE ON FUNCTION create_otp_verifications_table() TO service_role;
GRANT EXECUTE ON FUNCTION create_registration_requests_table() TO service_role;
GRANT EXECUTE ON FUNCTION update_timestamp() TO service_role; 