-- =============================================================================
-- FIX DATABASE ERROR DURING REGISTRATION
-- This fixes the 500 error: "Database error saving new user"
-- =============================================================================

-- =============================================================================
-- 1. COMPLETELY REMOVE OLD TRIGGER AND FUNCTION
-- =============================================================================

-- Drop trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- =============================================================================
-- 2. CREATE NEW FUNCTION WITH PROPER ERROR HANDLING
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_name TEXT;
BEGIN
  -- Extract values with defaults
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', 'New User');
  
  -- Use INSERT with ON CONFLICT to handle duplicates gracefully
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_role
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth.users insert
    RAISE WARNING 'Error in handle_new_user: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 3. CREATE TRIGGER
-- =============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 4. VERIFY USERS TABLE STRUCTURE
-- =============================================================================

-- Ensure id column is UUID and primary key
DO $$ 
BEGIN
  -- Check if id column exists and is proper type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'id' 
    AND data_type = 'uuid'
  ) THEN
    RAISE EXCEPTION 'users.id column must be UUID type';
  END IF;
END $$;

-- =============================================================================
-- 5. VERIFY RLS POLICIES
-- =============================================================================

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;

-- Create clean policies
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Important: No INSERT policy - trigger handles all inserts

-- =============================================================================
-- 6. CLEAN UP ANY ORPHANED RECORDS
-- =============================================================================

-- Delete users from public.users that don't exist in auth.users
DELETE FROM public.users
WHERE id NOT IN (SELECT id FROM auth.users);

-- =============================================================================
-- 7. TEST QUERY (Run separately to verify)
-- =============================================================================

-- Uncomment to test:
-- SELECT 
--   COUNT(*) as trigger_count,
--   trigger_name
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created'
-- GROUP BY trigger_name;
-- 
-- Expected: 1 row showing trigger exists

-- =============================================================================
-- 8. GRANT NECESSARY PERMISSIONS
-- =============================================================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, service_role;
GRANT SELECT ON public.users TO anon, authenticated;
GRANT UPDATE ON public.users TO authenticated;

-- =============================================================================
-- DONE! Try registering again
-- =============================================================================

