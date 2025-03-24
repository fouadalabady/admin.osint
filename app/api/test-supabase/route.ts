import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    // Test connection with a simple query
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public') AS has_tables;",
    });

    // If exec_sql doesn't exist, try a direct query
    if (error && error.message.includes('function "exec_sql" does not exist')) {
      // Try direct fetch to create exec_sql function
      const createFunctionResponse = await fetch(
        process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/rpc/exec',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
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
                  err_message text;
                  err_sqlstate text;
              BEGIN
                  BEGIN
                      EXECUTE sql;
                  EXCEPTION WHEN OTHERS THEN
                      GET STACKED DIAGNOSTICS
                          err_message = MESSAGE_TEXT,
                          err_sqlstate = RETURNED_SQLSTATE;
                      
                      result := json_build_object(
                          'error', json_build_object(
                              'message', err_message,
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
      );

      const createFunctionResult = await createFunctionResponse.json();

      return NextResponse.json({
        success: false,
        message: 'exec_sql function does not exist',
        createFunctionResult,
        env: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
      });
    }

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to query Supabase',
          error: error,
        },
        { status: 500 }
      );
    }

    // Try a direct information schema query
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(10);

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      execSqlResult: data,
      tables: tablesError ? null : tables,
      tablesError: tablesError,
      env: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    });
  } catch (error) {
    console.error('Error connecting to Supabase:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to connect to Supabase',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
