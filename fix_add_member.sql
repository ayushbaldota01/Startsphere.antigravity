-- Fix for "User not found" error when adding members
-- This is caused by RLS policies preventing users from querying the users table directly to find others by email.

-- 1. Create a secure RPC function to look up user ID by email
CREATE OR REPLACE FUNCTION get_user_id_by_email(email_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with superuser privileges to bypass RLS
AS $$
DECLARE
  found_user RECORD;
BEGIN
  SELECT id, email INTO found_user
  FROM users
  WHERE email = email_input;
  
  IF found_user.id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', found_user.id,
    'email', found_user.email
  );
END;
$$;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_id_by_email(text) TO authenticated;
