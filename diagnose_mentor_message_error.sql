-- =============================================================================
-- DIAGNOSE MENTOR MESSAGE ERROR
-- Run this first to identify the exact problem
-- =============================================================================

-- =============================================================================
-- CHECK 1: Does Gojo exist in users table?
-- =============================================================================

SELECT 
  id as user_id,
  email,
  name,
  role,
  created_at
FROM public.users 
WHERE email = 'gojo@test.com';

-- Expected: Should return Gojo's record with role='mentor'
-- If empty: Gojo doesn't exist in users table!
-- If role != 'mentor': Gojo needs to be set as mentor

-- =============================================================================
-- CHECK 2: Is Gojo in any projects?
-- =============================================================================

SELECT 
  pm.project_id,
  p.name as project_name,
  pm.user_id as gojo_user_id,
  pm.role as project_role,
  u.email,
  u.role as user_role
FROM public.project_members pm
JOIN public.projects p ON p.id = pm.project_id
JOIN public.users u ON u.id = pm.user_id
WHERE u.email = 'gojo@test.com';

-- Expected: Should show Gojo in projects with role='MENTOR'
-- Check that user_id matches the ID from CHECK 1

-- =============================================================================
-- CHECK 3: Check the foreign key constraint
-- =============================================================================

SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'mentor_messages'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'recipient_id';

-- Expected: Should show recipient_id references users(id)

-- =============================================================================
-- CHECK 4: Try to find any orphaned data
-- =============================================================================

SELECT COUNT(*) as orphaned_messages
FROM public.mentor_messages
WHERE recipient_id IS NOT NULL
  AND recipient_id NOT IN (SELECT id FROM public.users);

-- Expected: 0 (no orphaned messages)
-- If > 0: Some messages reference non-existent users

-- =============================================================================
-- CHECK 5: List all current users for reference
-- =============================================================================

SELECT 
  id,
  email,
  name,
  role,
  created_at
FROM public.users
WHERE role = 'mentor'
ORDER BY created_at DESC;

-- This shows all mentors and their IDs

-- =============================================================================
-- DIAGNOSIS GUIDE
-- =============================================================================

-- If CHECK 1 returns empty:
--   PROBLEM: Gojo doesn't exist in users table
--   FIX: Run set_user_as_mentor.sql to create/update Gojo

-- If CHECK 1 shows role != 'mentor':
--   PROBLEM: Gojo is not set as a mentor
--   FIX: UPDATE users SET role='mentor' WHERE email='gojo@test.com';

-- If CHECK 2 returns empty:
--   PROBLEM: Gojo is not in the project
--   FIX: Have Gojo accept the mentor request again

-- If CHECK 2 shows different user_id than CHECK 1:
--   PROBLEM: Data inconsistency
--   FIX: Delete and re-add Gojo to project

-- If CHECK 4 returns > 0:
--   PROBLEM: Orphaned messages
--   FIX: Delete orphaned messages or fix recipient IDs

-- =============================================================================

