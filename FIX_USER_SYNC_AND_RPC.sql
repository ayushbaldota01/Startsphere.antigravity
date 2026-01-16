-- ============================================================================
-- GOD-LEVEL FIX: SYNC USERS & ENABLE LOOKUP
-- This script does three changes:
-- 1. Creates the secure RPC function (idempotent, recreates it to be sure)
-- 2. SYNCs any "missing" users from auth.users to public.users (Fixes "User not found")
-- 3. Grants all necessary permissions
-- ============================================================================

-- 1. Create the RPC function (Drops it first to ensure clean creation)
DROP FUNCTION IF EXISTS get_user_id_by_email(text);

CREATE OR REPLACE FUNCTION get_user_id_by_email(email_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as generic superuser to see all data
AS $$
DECLARE
  found_user RECORD;
BEGIN
  -- FIRST: Check if user exists in public.users
  SELECT id, email INTO found_user
  FROM users
  WHERE email = email_input;
  
  -- IF NOT FOUND in public.users, try to sync from auth.users (Self-Healing)
  IF found_user.id IS NULL THEN
     INSERT INTO public.users (id, email, name, avatar_url, created_at, updated_at)
     SELECT 
       id, 
       email, 
       COALESCE(raw_user_meta_data->>'name', email) as name,
       COALESCE(raw_user_meta_data->>'avatar_url', '') as avatar_url,
       created_at,
       updated_at
     FROM auth.users
     WHERE email = email_input
     ON CONFLICT (id) DO NOTHING;
     
     -- Try selecting again
     SELECT id, email INTO found_user
     FROM users
     WHERE email = email_input;
  END IF;

  -- IF STILL NULL, then they truly don't exist
  IF found_user.id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', found_user.id,
    'email', found_user.email
  );
END;
$$;

-- 2. Force a specific sync for ALL users right now (Bulk Heal)
INSERT INTO public.users (id, email, name, avatar_url, created_at, updated_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'name', email, 'Unknown') as name,
  COALESCE(raw_user_meta_data->>'avatar_url', '') as avatar_url,
  created_at, 
  updated_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3. Grant Permissions
GRANT EXECUTE ON FUNCTION get_user_id_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_id_by_email(text) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_id_by_email(text) TO anon; -- Should not be needed but safer for edge cases

-- Confirm success
SELECT 'Fixed missing users and created RPC function successfully' as result;
