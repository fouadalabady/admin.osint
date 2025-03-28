-- Create a function to execute SQL queries with parameters
CREATE OR REPLACE FUNCTION execute_sql(
  sql_query TEXT,
  params TEXT[] DEFAULT '{}'::TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Execute the query with parameters
  EXECUTE sql_query
  INTO result
  USING params[1], params[2], params[3], params[4], params[5];

  -- Return the result
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'code', SQLSTATE,
      'query', sql_query
    );
END;
$$;

-- Grant access to the service role
GRANT EXECUTE ON FUNCTION execute_sql TO service_role;