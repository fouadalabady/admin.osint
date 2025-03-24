import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Step 1: Create exec_sql function if it doesn't exist
    const createExecSqlResult = await fetch(
      process.env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/rpc/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          sql: `
            CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
            RETURNS jsonb
            LANGUAGE plpgsql
            SECURITY DEFINER
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
                        err_position = PG_EXCEPTION_CONTEXT,
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

            ALTER FUNCTION public.exec_sql(text) OWNER TO postgres;
            GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
            REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;

            SELECT 'exec_sql function created successfully' as status;
          `,
        }),
      }
    ).then((res) => res.json());

    console.log("Create exec_sql function result:", createExecSqlResult);

    // If exec_sql function creation failed, return error
    if (createExecSqlResult.error) {
      console.error("Failed to create exec_sql function:", createExecSqlResult.error);
      return NextResponse.json({
        success: false,
        message: "Failed to create exec_sql function",
        details: createExecSqlResult.error,
        manualSetupRequired: true,
      }, { status: 500 });
    }

    // Step 2: Create database tables
    const sqlCommands = `
      -- Create registration status enum if it doesn't exist
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

      -- Create otp_verifications table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.otp_verifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL,
          otp TEXT NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          purpose TEXT DEFAULT 'registration' NOT NULL
      );

      -- Create user_registration_requests table if it doesn't exist
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

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_otp_verifications_email ON public.otp_verifications (email);
      CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON public.otp_verifications (expires_at);
      CREATE INDEX IF NOT EXISTS idx_user_registration_requests_email ON public.user_registration_requests (email);
      CREATE INDEX IF NOT EXISTS idx_user_registration_requests_status ON public.user_registration_requests (status);

      -- Enable Row Level Security
      ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_registration_requests ENABLE ROW LEVEL SECURITY;

      -- Create updated_at trigger function if it doesn't exist
      CREATE OR REPLACE FUNCTION public.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create triggers for updated_at if they don't exist
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

      -- Check if tables were created successfully
      SELECT 
          EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'otp_verifications') AS otp_verifications_exists,
          EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_registration_requests') AS user_registration_requests_exists;
    `;

    // Execute the SQL through exec_sql function
    const result = await fetch(
      process.env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/rpc/exec_sql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          sql: sqlCommands,
        }),
      }
    ).then((res) => res.json());

    console.log("Database setup result:", result);

    // Check if there was an error
    if (result && result.error) {
      return NextResponse.json({
        success: false,
        message: "Failed to set up database tables",
        error: result.error,
        step: "tables_creation",
      }, { status: 500 });
    }

    // Check if the final query returned results indicating tables exist
    const tableCheckResults = result[result.length - 1];
    const allTablesExist = tableCheckResults && 
                          tableCheckResults.otp_verifications_exists && 
                          tableCheckResults.user_registration_requests_exists;

    if (!allTablesExist) {
      return NextResponse.json({
        success: false,
        message: "Database setup incomplete - some tables may not have been created correctly",
        tableStatus: tableCheckResults,
      }, { status: 500 });
    }

    // Return success response with detailed information
    return NextResponse.json({
      success: true,
      message: "Database setup completed successfully",
      details: {
        execSqlFunction: "Created successfully",
        tableStatus: tableCheckResults,
        otp_verifications_exists: tableCheckResults.otp_verifications_exists,
        user_registration_requests_exists: tableCheckResults.user_registration_requests_exists
      }
    });
  } catch (error) {
    console.error("Error setting up database:", error);
    return NextResponse.json({
      success: false,
      message: "An unexpected error occurred during database setup",
      error: error instanceof Error ? error.message : String(error),
      manualSetupRequired: true,
    }, { status: 500 });
  }
} 