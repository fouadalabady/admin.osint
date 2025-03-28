-- OSINT Dashboard Database Initialization
-- This file contains initial setup required before other modules

-- Create the exec_sql function for running dynamic SQL
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the function creator
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
            err_position = PG_CONTEXT,
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

-- Grant execute permission to the service role
ALTER FUNCTION public.exec_sql(text) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;

-- Create updated_at trigger function for all tables
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create necessary enums
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