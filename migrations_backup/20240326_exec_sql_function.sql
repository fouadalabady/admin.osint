-- Create a function to execute arbitrary SQL (FOR ADMIN USE ONLY)
-- This is needed for our migration helper
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the function creator
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role; 