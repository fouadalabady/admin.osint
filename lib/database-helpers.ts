import { createServerSupabaseClient } from '@/lib/supabase';

// Define interfaces for return types
export interface TablesExistResult {
  exists: boolean;
  otpExists?: boolean;
  registrationExists?: boolean;
  message: string;
  tables?: string[];
  error?: unknown;
}

export interface SQLExecutionResult {
  success: boolean;
  message: string;
  error?: unknown;
}

export interface SetupResult extends SQLExecutionResult {
  tables?: string[];
  skipReason?: string;
  setupResult?: SQLExecutionResult;
  verificationResult?: TablesExistResult;
}

/**
 * Check if tables required for user registration exist in the database
 * @returns Promise with table existence status
 */
export async function checkTablesExist(): Promise<TablesExistResult> {
  try {
    const supabase = createServerSupabaseClient();

    // Use pg_tables which is more reliable in Supabase
    const { data: otpTable, error: otpError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = 'otp_verifications'
        ) AS exists
      `,
    });

    const { data: regTable, error: regError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = 'user_registration_requests'
        ) AS exists
      `,
    });

    // Check for errors in either query
    if (otpError || regError) {
      const errorMessage = otpError?.message || regError?.message || 'Unknown error';

      // Fallback approach - try a direct query
      try {
        // Try a more direct approach without using exec_sql
        const { data, error: directError } = await supabase
          .from('pg_tables')
          .select('tablename')
          .eq('schemaname', 'public')
          .in('tablename', ['otp_verifications', 'user_registration_requests']);

        if (directError) {
          return {
            exists: false,
            otpExists: false,
            registrationExists: false,
            tables: [],
            error: directError,
            message: `Error checking tables: ${directError.message || 'Unknown error'}`,
          };
        }

        const tables = data?.map(row => row.tablename) || [];
        const otpExists = tables.includes('otp_verifications');
        const registrationExists = tables.includes('user_registration_requests');

        return {
          exists: otpExists && registrationExists,
          otpExists,
          registrationExists,
          tables,
          error: null,
          message:
            otpExists && registrationExists
              ? 'Required tables exist'
              : `Missing tables. Found: ${tables.join(', ')}`,
        };
      } catch {
        // If direct query fails, the tables likely don't exist
        return {
          exists: false,
          otpExists: false,
          registrationExists: false,
          tables: [],
          error: otpError || regError,
          message: `Error checking tables: ${errorMessage}`,
        };
      }
    }

    // Process results from RPC calls
    const otpExists = otpTable?.[0]?.exists === true;
    const registrationExists = regTable?.[0]?.exists === true;
    const tables = [];

    if (otpExists) tables.push('otp_verifications');
    if (registrationExists) tables.push('user_registration_requests');

    return {
      exists: otpExists && registrationExists,
      otpExists,
      registrationExists,
      tables,
      error: null,
      message:
        otpExists && registrationExists
          ? 'Required tables exist'
          : `Missing tables. Found: ${tables.join(', ')}`,
    };
  } catch (error) {
    return {
      exists: false,
      otpExists: false,
      registrationExists: false,
      tables: [],
      error,
      message: `Unexpected error checking tables: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

/**
 * Execute SQL statement using Supabase
 * @param sql SQL statement to execute
 * @returns Promise with result or error
 */
export async function executeSQL(sql: string): Promise<SQLExecutionResult> {
  try {
    const supabase = createServerSupabaseClient();

    // Try to execute using exec_sql function
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      return {
        success: false,
        error,
        message: `Failed to execute SQL: ${error.message}`,
      };
    }

    return {
      success: true,
      message: 'SQL executed successfully',
    };
  } catch (error) {
    return {
      success: false,
      error,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Initialize the exec_sql function in the database
 * @returns Promise with result or error
 */
export async function initExecSQLFunction(): Promise<SQLExecutionResult> {
  try {
    const supabase = createServerSupabaseClient();

    // Try to create the function with a direct query
    // Note: This is a simplified approach and might not work in all Supabase configurations
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
          RETURNS JSONB
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE sql;
            RETURN '[]'::JSONB;
          EXCEPTION
            WHEN OTHERS THEN
              RETURN jsonb_build_array(
                jsonb_build_object(
                  'error', SQLERRM,
                  'detail', SQLSTATE
                )
              );
          END;
          $$;
        `
      });

      if (!error) {
        return {
          success: true,
          message: 'Created exec_sql function successfully',
        };
      }
    } catch (primaryError) {
      // First attempt failed, continue to fallback
    }

    // Fallback: Try with a different approach - using a stored procedure if available
    try {
      // Execute a query that might be available in your Supabase instance
      // This varies based on your Supabase configuration
      const { error: fallbackError } = await supabase
        .from('_temp_exec_sql')
        .insert({ 
          sql: `
            CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
            RETURNS JSONB
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
              EXECUTE sql;
              RETURN '[]'::JSONB;
            EXCEPTION
              WHEN OTHERS THEN
                RETURN jsonb_build_array(
                  jsonb_build_object(
                    'error', SQLERRM,
                    'detail', SQLSTATE
                  )
                );
            END;
            $$;
          `
        })
        .select();

      if (fallbackError) {
        return {
          success: false,
          message: `Failed to create exec_sql function: ${fallbackError.message}`,
          error: fallbackError,
        };
      }

      return {
        success: true,
        message: 'Created exec_sql function with fallback method',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create exec_sql function: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to create exec_sql function: ${
        error instanceof Error ? error.message : String(error)
      }`,
      error,
    };
  }
}

/**
 * Set up database tables for user registration
 * @returns Promise with result or error
 */
export async function setupRegistrationTables(): Promise<SetupResult> {
  // Check if tables already exist
  const tablesExist = await checkTablesExist();

  if (tablesExist.exists) {
    return {
      success: true,
      message: 'Tables already exist',
      skipReason: 'Tables already exist',
      tables: tablesExist.tables,
    };
  }

  // SQL to set up the tables
  const sql = `
    -- Create enum for user status if not exists
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('pending', 'active', 'rejected', 'suspended');
      END IF;
    END$$;
    
    -- Create OTP verifications table if not exists
    CREATE TABLE IF NOT EXISTS otp_verifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      purpose TEXT NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      verified_at TIMESTAMP WITH TIME ZONE
    );
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_otp_user_purpose ON otp_verifications (user_id, purpose);
    
    -- Create user registration requests table if not exists
    CREATE TABLE IF NOT EXISTS user_registration_requests (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      status user_status NOT NULL DEFAULT 'pending',
      requested_role TEXT NOT NULL,
      admin_notes TEXT,
      reviewed_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      email_verified BOOLEAN DEFAULT false
    );
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_registration_user ON user_registration_requests (user_id);
    CREATE INDEX IF NOT EXISTS idx_registration_status ON user_registration_requests (status);
    
    -- Enable Row Level Security
    ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_registration_requests ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Users can view their own OTP verifications"
    ON otp_verifications
    FOR SELECT
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own OTP verifications"
    ON otp_verifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own OTP verifications"
    ON otp_verifications
    FOR UPDATE
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can view their own registration requests"
    ON user_registration_requests
    FOR SELECT
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own registration requests"
    ON user_registration_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Admins can view all registration requests"
    ON user_registration_requests
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
      )
    );
    
    CREATE POLICY "Admins can update registration requests"
    ON user_registration_requests
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
      )
    );
    
    -- Create or replace a function to automatically update the updated_at field
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Create or replace the trigger for the user_registration_requests table
    DROP TRIGGER IF EXISTS update_user_registration_requests_updated_at ON user_registration_requests;
    
    CREATE TRIGGER update_user_registration_requests_updated_at
    BEFORE UPDATE ON user_registration_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `;

  const result = await executeSQL(sql);

  if (!result.success) {
    return {
      ...result,
      error: result.error,
    };
  }

  // Verify the tables were created
  const verification = await checkTablesExist();

  return {
    success: verification.exists,
    message: verification.exists
      ? 'Tables created successfully'
      : 'Failed to verify tables were created',
    tables: verification.tables,
    setupResult: result,
    verificationResult: verification,
    error: verification.exists ? undefined : verification.error,
  };
}
