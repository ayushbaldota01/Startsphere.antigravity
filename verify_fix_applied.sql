-- ============================================================================
-- VERIFICATION SCRIPT: Check if Task Assignment Fix is Applied
-- ============================================================================
-- Run this in Supabase SQL Editor AFTER running fix_tasks_foreign_keys.sql
-- This will show you if the foreign keys are correctly set up
-- ============================================================================

-- 1. Check if tasks table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks')
        THEN '✓ PASS: Tasks table exists'
        ELSE '✗ FAIL: Tasks table does not exist'
    END as check_result;

-- 2. List all foreign key constraints on tasks table
SELECT 
    '✓ Foreign Key Constraints on Tasks Table:' as section;

SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'tasks'
AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- Expected output:
-- constraint_name              | column_name  | foreign_table_name | foreign_column_name | delete_rule
-- tasks_assignee_id_fkey       | assignee_id  | users              | id                  | SET NULL
-- tasks_created_by_fkey        | created_by   | users              | id                  | CASCADE
-- tasks_project_id_fkey        | project_id   | projects           | id                  | CASCADE

-- 3. Verify foreign keys point to 'users' (plural) not 'user' (singular)
SELECT 
    CASE 
        WHEN COUNT(*) >= 2 
        THEN '✓ PASS: Foreign keys correctly reference "users" table'
        ELSE '✗ FAIL: Foreign keys not properly set up'
    END as check_result
FROM information_schema.table_constraints AS tc
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'tasks'
AND ccu.table_name = 'users';  -- Should be 'users' not 'user'

-- 4. Check if RLS is enabled on tasks table
SELECT 
    CASE 
        WHEN relrowsecurity = true 
        THEN '✓ PASS: Row Level Security is enabled on tasks table'
        ELSE '✗ FAIL: RLS is not enabled on tasks table'
    END as check_result
FROM pg_class
WHERE relname = 'tasks'
AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 5. Check if RLS policies exist
SELECT '✓ RLS Policies on Tasks Table:' as section;

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN roles::text = '{public}' THEN 'public'
        ELSE roles::text
    END as applies_to
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'tasks'
ORDER BY policyname;

-- Expected policies:
-- Project members can view tasks (SELECT)
-- Project members can create tasks (INSERT)
-- Project members can update tasks (UPDATE)
-- Project members can delete tasks (DELETE)

-- 6. Check if helper function exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'get_project_tasks'
        )
        THEN '✓ PASS: Helper function get_project_tasks exists'
        ELSE '✗ FAIL: Helper function get_project_tasks not found'
    END as check_result;

-- 7. Check indexes on tasks table
SELECT '✓ Indexes on Tasks Table:' as section;

SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'tasks'
ORDER BY indexname;

-- Expected indexes:
-- idx_tasks_assignee_project
-- idx_tasks_created_at
-- idx_tasks_created_by
-- idx_tasks_project_status
-- tasks_pkey (primary key)

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

SELECT 
    '═══════════════════════════════════════════════' as divider;

SELECT 
    CASE 
        WHEN (
            -- Check tasks table exists
            EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks')
            AND
            -- Check at least 2 foreign keys pointing to users
            (SELECT COUNT(*) FROM information_schema.table_constraints AS tc
             JOIN information_schema.constraint_column_usage AS ccu
                 ON ccu.constraint_name = tc.constraint_name
             WHERE tc.constraint_type = 'FOREIGN KEY'
             AND tc.table_name = 'tasks'
             AND ccu.table_name = 'users') >= 2
            AND
            -- Check RLS is enabled
            (SELECT relrowsecurity FROM pg_class 
             WHERE relname = 'tasks' 
             AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) = true
            AND
            -- Check helper function exists
            EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_project_tasks')
        )
        THEN '✓✓✓ ALL CHECKS PASSED! ✓✓✓
        
Your database is correctly configured!
Task assignment should work now.

Next steps:
1. Refresh your application (Ctrl+Shift+R)
2. Try creating and assigning a task
3. Enjoy! 🎉'
        ELSE '✗✗✗ SOME CHECKS FAILED ✗✗✗
        
The fix may not have been applied correctly.
Please run fix_tasks_foreign_keys.sql again.

If issues persist, check the error messages above.'
    END as final_result;

SELECT 
    '═══════════════════════════════════════════════' as divider;

