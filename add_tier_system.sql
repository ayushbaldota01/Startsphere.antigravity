-- Phase 1: Add Tier System to Users
-- This adds the freemium tier structure to the database

-- 1. Add tier column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'FREE' CHECK (tier IN ('FREE', 'PRO'));

-- 2. Add max_projects column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS max_projects INTEGER DEFAULT 3;

-- 3. Update existing users to have proper limits
UPDATE users 
SET tier = 'FREE', max_projects = 3 
WHERE tier IS NULL;

-- 4. Create function to enforce project limits
DROP FUNCTION IF EXISTS check_project_limit();

CREATE OR REPLACE FUNCTION check_project_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_tier TEXT;
  user_max_projects INTEGER;
  current_project_count INTEGER;
BEGIN
  -- Get user's tier and max projects
  SELECT tier, max_projects INTO user_tier, user_max_projects
  FROM users
  WHERE id = NEW.created_by;

  -- If user is PRO or has unlimited projects (-1), allow creation
  IF user_tier = 'PRO' OR user_max_projects = -1 THEN
    RETURN NEW;
  END IF;

  -- Count current projects for this user
  SELECT COUNT(*) INTO current_project_count
  FROM project_members
  WHERE user_id = NEW.created_by AND role = 'ADMIN';

  -- Check if limit exceeded
  IF current_project_count >= user_max_projects THEN
    RAISE EXCEPTION 'Project limit reached. Upgrade to Pro to create more projects.'
      USING HINT = 'You have reached the maximum of % projects for your FREE plan.', user_max_projects;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to enforce limits on project creation
DROP TRIGGER IF EXISTS enforce_project_limit ON projects;

CREATE TRIGGER enforce_project_limit
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION check_project_limit();

-- 6. Create RPC function to redeem promo code
DROP FUNCTION IF EXISTS redeem_promo_code(TEXT);

CREATE OR REPLACE FUNCTION redeem_promo_code(code_text TEXT)
RETURNS jsonb AS $$
DECLARE
  user_id UUID;
  current_tier TEXT;
BEGIN
  -- Get current user
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Not authenticated'
    );
  END IF;

  -- Get current tier
  SELECT tier INTO current_tier FROM users WHERE id = user_id;

  -- Check if already PRO
  IF current_tier = 'PRO' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'You are already a Pro user!'
    );
  END IF;

  -- Validate promo code (case-insensitive)
  IF UPPER(code_text) = 'BALLI200' THEN
    -- Upgrade to PRO
    UPDATE users 
    SET tier = 'PRO', max_projects = -1
    WHERE id = user_id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Congratulations! You have been upgraded to Pro!'
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid promo code'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION redeem_promo_code(TEXT) TO authenticated;

-- 8. Create helper function to get user limits
DROP FUNCTION IF EXISTS get_user_limits();

CREATE OR REPLACE FUNCTION get_user_limits()
RETURNS jsonb AS $$
DECLARE
  user_id UUID;
  user_tier TEXT;
  user_max_projects INTEGER;
  current_project_count INTEGER;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN jsonb_build_object(
      'tier', 'FREE',
      'max_projects', 0,
      'current_projects', 0,
      'can_create', false
    );
  END IF;

  -- Get user info
  SELECT tier, max_projects INTO user_tier, user_max_projects
  FROM users WHERE id = user_id;

  -- Count current projects
  SELECT COUNT(*) INTO current_project_count
  FROM project_members
  WHERE user_id = user_id AND role = 'ADMIN';

  RETURN jsonb_build_object(
    'tier', user_tier,
    'max_projects', user_max_projects,
    'current_projects', current_project_count,
    'can_create', (user_tier = 'PRO' OR current_project_count < user_max_projects)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_limits() TO authenticated;
