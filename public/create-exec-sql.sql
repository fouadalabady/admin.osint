-- Create exec_sql function in Supabase
-- Run this in the Supabase SQL Editor to create the exec_sql function

-- Create a function to execute arbitrary SQL
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the function creator
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

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- Verify function was created
SELECT 'Function exec_sql created successfully!' AS result; 