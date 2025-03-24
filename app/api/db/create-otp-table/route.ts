import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();

    // Execute SQL to create the OTP verifications table
    const createTableSQL = `
      -- Create password_reset_verifications table for password reset and verification codes
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

      -- Add RLS policies for password_reset_verifications
      ALTER TABLE public.password_reset_verifications ENABLE ROW LEVEL SECURITY;

      -- Add policy to allow the service role to manage all verifications
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policy 
          WHERE schemaname = 'public' 
          AND tablename = 'password_reset_verifications' 
          AND policyname = 'Service role can manage all password reset verifications'
        ) THEN
          CREATE POLICY "Service role can manage all password reset verifications" 
            ON public.password_reset_verifications
            FOR ALL
            TO service_role
            USING (true);
        END IF;
      END
      $$;

      -- Add user policy to view their own verifications
      CREATE POLICY IF NOT EXISTS "Users can view their own password reset verifications" 
        ON public.password_reset_verifications
        FOR SELECT 
        USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

      -- Add service role policy for INSERT
      CREATE POLICY IF NOT EXISTS "Service role can insert password reset verifications" 
        ON public.password_reset_verifications
        FOR INSERT 
        TO service_role 
        WITH CHECK (true);

      -- Add indexes for faster lookups
      CREATE INDEX IF NOT EXISTS idx_password_reset_verifications_email ON public.password_reset_verifications (email);
      CREATE INDEX IF NOT EXISTS idx_password_reset_verifications_code ON public.password_reset_verifications (code);
      CREATE INDEX IF NOT EXISTS idx_password_reset_verifications_type ON public.password_reset_verifications (type);
      CREATE INDEX IF NOT EXISTS idx_password_reset_verifications_expires_at ON public.password_reset_verifications (expires_at);

      -- Grant necessary permissions
      GRANT ALL ON public.password_reset_verifications TO service_role;
      GRANT ALL ON public.password_reset_verifications TO postgres;
    `;

    // Use Supabase's direct query functionality
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (error) {
      console.error('Error executing SQL:', error);
      return NextResponse.json(
        { error: `Failed to create OTP table: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset verifications table created successfully',
    });
  } catch (error) {
    console.error('Error creating OTP table:', error);
    return NextResponse.json(
      {
        error: `Failed to create OTP table: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
