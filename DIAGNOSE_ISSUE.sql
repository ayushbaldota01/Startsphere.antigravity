-- =============================================================================
-- DIAGNOSTIC SCRIPT - Run this FIRST to understand your specific issue
-- Copy the output and review each section
-- =============================================================================

SELECT '========================================' as separator;
SELECT 'MENTOR MESSAGE ERROR DIAGNOSTIC REPORT' as title;
SELECT '========================================' as separator;

-- =============================================================================
-- 1. CHECK: Does Gojo exist in the users table?
-- =============================================================================

SELECT '1. GOJO USER CHECK' as section;
SELECT '-------------------' as separator;

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ PROBLEM: Gojo does NOT exist in users table!'
    WHEN COUNT(*) > 0 THEN '✅ OK: Gojo exists'
  END as status,
  COUNT(*) as gojo_count
FROM public.users 
WHERE email = 'gojo@test.com';

SELECT 
  id as gojo_user_id,
  email,
  name,
  role,
  CASE 
    WHEN role = 'mentor' THEN '✅ Correct role'
    ELSE '❌ Wrong role! Should be mentor, is: ' || COALESCE(role, 'NULL')
  END as role_check,
  created_at
FROM public.users 
WHERE email = 'gojo@test.com';

-- =============================================================================
-- 2. CHECK: All mentors in the system
-- =============================================================================

SELECT '' as blank_line;
SELECT '2. ALL MENTORS IN SYSTEM' as section;
SELECT '-------------------------' as separator;

SELECT 
  id,
  email,
  name,
  role,
  created_at
FROM public.users
WHERE role = 'mentor'
ORDER BY created_at DESC;

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ WARNING: No mentors found in system!'
    ELSE '✅ Found ' || COUNT(*) || ' mentor(s)'
  END as status
FROM public.users
WHERE role = 'mentor';

-- =============================================================================
-- 3. CHECK: Gojo's project memberships
-- =============================================================================

SELECT '' as blank_line;
SELECT '3. GOJO PROJECT MEMBERSHIPS' as section;
SELECT '----------------------------' as separator;

SELECT 
  p.id as project_id,
  p.name as project_name,
  pm.role as project_role,
  pm.created_at as joined_at,
  CASE 
    WHEN pm.role = 'MENTOR' THEN '✅ Correct role'
    ELSE '❌ Wrong role: ' || pm.role
  END as role_check
FROM public.project_members pm
JOIN public.projects p ON p.id = pm.project_id
JOIN public.users u ON u.id = pm.user_id
WHERE u.email = 'gojo@test.com'
ORDER BY pm.created_at DESC;

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ PROBLEM: Gojo is not in ANY projects!'
    ELSE '✅ Gojo is in ' || COUNT(*) || ' project(s)'
  END as status
FROM public.project_members pm
JOIN public.users u ON u.id = pm.user_id
WHERE u.email = 'gojo@test.com';

-- =============================================================================
-- 4. CHECK: Mentor requests status
-- =============================================================================

SELECT '' as blank_line;
SELECT '4. MENTOR REQUESTS' as section;
SELECT '-------------------' as separator;

SELECT 
  mr.id as request_id,
  p.name as project_name,
  u.name as mentor_name,
  mr.status,
  mr.created_at,
  CASE 
    WHEN mr.status = 'ACCEPTED' AND EXISTS(
      SELECT 1 FROM public.project_members pm 
      WHERE pm.project_id = mr.project_id 
      AND pm.user_id = mr.mentor_id
    ) THEN '✅ Mentor added to project'
    WHEN mr.status = 'ACCEPTED' THEN '❌ PROBLEM: Request accepted but mentor NOT in project!'
    ELSE '⏳ Request status: ' || mr.status
  END as sync_check
FROM public.mentor_requests mr
JOIN public.projects p ON p.id = mr.project_id
JOIN public.users u ON u.id = mr.mentor_id
WHERE u.email = 'gojo@test.com'
ORDER BY mr.created_at DESC;

-- =============================================================================
-- 5. CHECK: Foreign key constraint on mentor_messages
-- =============================================================================

SELECT '' as blank_line;
SELECT '5. FOREIGN KEY CONSTRAINT CHECK' as section;
SELECT '-----------------------------------' as separator;

SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column,
  '✅ Constraint exists' as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'mentor_messages'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'recipient_id';

-- =============================================================================
-- 6. CHECK: Is recipient_id nullable?
-- =============================================================================

SELECT '' as blank_line;
SELECT '6. RECIPIENT_ID NULLABLE CHECK' as section;
SELECT '----------------------------------' as separator;

SELECT 
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN is_nullable = 'YES' THEN '✅ Column is nullable (good)'
    ELSE '❌ Column is NOT NULL (this could cause issues)'
  END as nullable_check
FROM information_schema.columns
WHERE table_name = 'mentor_messages'
  AND column_name = 'recipient_id';

-- =============================================================================
-- 7. CHECK: RLS policies on mentor_messages
-- =============================================================================

SELECT '' as blank_line;
SELECT '7. RLS POLICIES' as section;
SELECT '----------------' as separator;

SELECT 
  policyname,
  cmd as operation,
  permissive,
  CASE 
    WHEN cmd = 'INSERT' THEN '⚠️ This policy controls message sending'
    ELSE '✓ ' || cmd || ' policy'
  END as importance
FROM pg_policies
WHERE tablename = 'mentor_messages'
ORDER BY 
  CASE cmd 
    WHEN 'INSERT' THEN 1
    WHEN 'SELECT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END;

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ WARNING: No RLS policies found!'
    ELSE '✅ Found ' || COUNT(*) || ' RLS policy/policies'
  END as status
FROM pg_policies
WHERE tablename = 'mentor_messages';

-- =============================================================================
-- 8. CHECK: Existing messages in mentor_messages table
-- =============================================================================

SELECT '' as blank_line;
SELECT '8. EXISTING MESSAGES' as section;
SELECT '---------------------' as separator;

SELECT 
  COUNT(*) as total_messages,
  COUNT(DISTINCT project_id) as projects_with_messages,
  COUNT(DISTINCT sender_id) as unique_senders,
  COUNT(DISTINCT recipient_id) as unique_recipients,
  COUNT(*) FILTER (WHERE recipient_id IS NULL) as messages_without_recipient
FROM public.mentor_messages;

-- Check for orphaned messages (messages with invalid recipient_id)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No orphaned messages'
    ELSE '❌ PROBLEM: ' || COUNT(*) || ' message(s) with invalid recipient_id!'
  END as orphaned_check
FROM public.mentor_messages mm
WHERE mm.recipient_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = mm.recipient_id
  );

-- =============================================================================
-- 9. CHECK: RPC Functions
-- =============================================================================

SELECT '' as blank_line;
SELECT '9. RPC FUNCTIONS CHECK' as section;
SELECT '------------------------' as separator;

SELECT 
  routine_name,
  routine_type,
  '✅ Function exists' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('send_mentor_message', 'insert_mentor_message', 'get_mentor_conversations')
ORDER BY routine_name;

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ No helper functions found - you should run the fix script'
    ELSE '✅ Found ' || COUNT(*) || ' helper function(s)'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('send_mentor_message', 'insert_mentor_message');

-- =============================================================================
-- 10. SUMMARY AND RECOMMENDATIONS
-- =============================================================================

SELECT '' as blank_line;
SELECT '10. DIAGNOSTIC SUMMARY' as section;
SELECT '=======================' as separator;

-- Create a summary
DO $$
DECLARE
  gojo_exists BOOLEAN;
  gojo_is_mentor BOOLEAN;
  gojo_in_projects BOOLEAN;
  recipient_nullable BOOLEAN;
  has_rpc_function BOOLEAN;
  recommendations TEXT := '';
BEGIN
  -- Check Gojo exists
  SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'gojo@test.com') INTO gojo_exists;
  
  -- Check Gojo is mentor
  SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'gojo@test.com' AND role = 'mentor') INTO gojo_is_mentor;
  
  -- Check Gojo in projects
  SELECT EXISTS(
    SELECT 1 FROM public.project_members pm
    JOIN public.users u ON u.id = pm.user_id
    WHERE u.email = 'gojo@test.com'
  ) INTO gojo_in_projects;
  
  -- Check recipient_id nullable
  SELECT is_nullable = 'YES' INTO recipient_nullable
  FROM information_schema.columns
  WHERE table_name = 'mentor_messages' AND column_name = 'recipient_id';
  
  -- Check RPC function exists
  SELECT EXISTS(
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'send_mentor_message'
  ) INTO has_rpc_function;
  
  -- Build recommendations
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'DIAGNOSTIC SUMMARY';
  RAISE NOTICE '==============================================';
  
  IF NOT gojo_exists THEN
    RAISE NOTICE '❌ CRITICAL: Gojo does not exist in users table';
    RAISE NOTICE '   → You need to create Gojo in Supabase Auth first';
    RAISE NOTICE '   → Then add to users table with same ID';
  ELSE
    RAISE NOTICE '✅ Gojo exists in users table';
  END IF;
  
  IF gojo_exists AND NOT gojo_is_mentor THEN
    RAISE NOTICE '❌ PROBLEM: Gojo exists but role is not "mentor"';
    RAISE NOTICE '   → Run: UPDATE users SET role=''mentor'' WHERE email=''gojo@test.com'';';
  ELSIF gojo_exists THEN
    RAISE NOTICE '✅ Gojo has correct role (mentor)';
  END IF;
  
  IF NOT gojo_in_projects THEN
    RAISE NOTICE '⚠️  WARNING: Gojo is not in any projects';
    RAISE NOTICE '   → Check mentor_requests table';
    RAISE NOTICE '   → Ensure Gojo is added to project_members when request is accepted';
  ELSE
    RAISE NOTICE '✅ Gojo is in at least one project';
  END IF;
  
  IF NOT recipient_nullable THEN
    RAISE NOTICE '⚠️  WARNING: recipient_id is NOT NULL';
    RAISE NOTICE '   → Run: ALTER TABLE mentor_messages ALTER COLUMN recipient_id DROP NOT NULL;';
  ELSE
    RAISE NOTICE '✅ recipient_id is nullable';
  END IF;
  
  IF NOT has_rpc_function THEN
    RAISE NOTICE '⚠️  RECOMMENDATION: No safe RPC function found';
    RAISE NOTICE '   → Run QUICK_FIX_MENTOR_MESSAGES.sql to create helper function';
  ELSE
    RAISE NOTICE '✅ Helper RPC function exists';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'RECOMMENDED ACTION';
  RAISE NOTICE '==============================================';
  
  IF NOT gojo_exists OR NOT gojo_is_mentor OR NOT recipient_nullable OR NOT has_rpc_function THEN
    RAISE NOTICE '👉 Run: COMPLETE_MENTOR_MESSAGE_FIX.sql';
    RAISE NOTICE '   This will fix all the issues identified above';
  ELSE
    RAISE NOTICE '✅ Your database looks good!';
    RAISE NOTICE '   If you''re still getting errors, check:';
    RAISE NOTICE '   - Browser console for the exact recipient_id being sent';
    RAISE NOTICE '   - Ensure the ID in the frontend matches the ID in the database';
  END IF;
  
  RAISE NOTICE '==============================================';
END $$;

-- =============================================================================
-- END OF DIAGNOSTIC REPORT
-- =============================================================================

SELECT '' as blank_line;
SELECT '========================================' as separator;
SELECT 'END OF DIAGNOSTIC REPORT' as footer;
SELECT '========================================' as separator;
SELECT 'Next steps:' as action;
SELECT '1. Review the output above' as step_1;
SELECT '2. Run QUICK_FIX_MENTOR_MESSAGES.sql OR COMPLETE_MENTOR_MESSAGE_FIX.sql' as step_2;
SELECT '3. Test sending a message in your app' as step_3;

