-- Create a function to update user status and role
CREATE OR REPLACE FUNCTION update_user_status(
  p_user_id UUID,
  p_status TEXT,
  p_role TEXT DEFAULT 'user'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_user JSONB;
  current_meta JSONB;
BEGIN
  -- Get current metadata
  SELECT raw_user_meta_data INTO current_meta
  FROM auth.users
  WHERE id = p_user_id;

  -- Update the user's metadata
  UPDATE auth.users
  SET 
    raw_user_meta_data = 
      CASE 
        WHEN raw_user_meta_data IS NULL THEN 
          jsonb_build_object('status', p_status, 'role', p_role)
        ELSE
          raw_user_meta_data || 
          jsonb_build_object('status', p_status, 'role', COALESCE(p_role, raw_user_meta_data->>'role', 'user'))
      END
  WHERE id = p_user_id
  RETURNING jsonb_build_object(
    'id', id,
    'email', email,
    'metadata', raw_user_meta_data
  ) INTO updated_user;
  
  -- Return the updated user data
  RETURN updated_user;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'code', SQLSTATE
    );
END;
$$;

-- Give access to service role
GRANT EXECUTE ON FUNCTION update_user_status TO service_role; 