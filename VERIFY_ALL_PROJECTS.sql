-- ============================================================================
-- VERIFY ALL PROJECTS - Diagnostic Script
-- ============================================================================
-- This script identifies which projects have data issues that prevent task assignment
-- Run this FIRST to see which projects are affected
-- ============================================================================

-- 1. Check all projects and their member data
SELECT '========== ALL PROJECTS AND MEMBER COUNTS ==========' as section;

SELECT 
    p.id,
    p.name,
    p.created_by,
    COUNT(pm.user_id) as total_members,
    COUNT(u.id) as valid_members,
    COUNT(pm.user_id) - COUNT(u.id) as orphaned_members
FROM projects p
LEFT JOIN project_members pm ON p.id = pm.project_id
LEFT JOIN users u ON pm.user_id = u.id
GROUP BY p.id, p.name, p.created_by
ORDER BY p.created_at DESC;

-- 2. Find orphaned project_members (members pointing to non-existent users)
SELECT '========== ORPHANED PROJECT MEMBERS (THE PROBLEM) ==========' as section;

SELECT 
    pm.id,
    pm.project_id,
    p.name as project_name,
    pm.user_id as broken_user_id,
    pm.role,
    pm.joined_at
FROM project_members pm
LEFT JOIN users u ON pm.user_id = u.id
LEFT JOIN projects p ON pm.project_id = p.id
WHERE u.id IS NULL;

-- 3. Check foreign keys on tasks table
SELECT '========== TASKS TABLE FOREIGN KEYS ==========' as section;

SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'tasks'
AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- EXPECTED: references_table should be "users" (plural) not "user" (singular)

-- 4. Check RLS status on tasks table
SELECT '========== RLS STATUS ON TASKS TABLE ==========' as section;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'tasks';

-- 5. Check existing tasks to see which projects have working task assignment
SELECT '========== TASKS BY PROJECT (Which projects have tasks?) ==========' as section;

SELECT 
    p.name as project_name,
    COUNT(t.id) as task_count,
    COUNT(DISTINCT t.assignee_id) as unique_assignees,
    MAX(t.created_at) as last_task_created
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
GROUP BY p.id, p.name
ORDER BY task_count DESC;

-- 6. Summary diagnosis
SELECT '========== DIAGNOSIS SUMMARY ==========' as section;

DO $$
DECLARE
    orphaned_count INTEGER;
    wrong_fk_count INTEGER;
    rls_enabled BOOLEAN;
BEGIN
    -- Count orphaned members
    SELECT COUNT(*) INTO orphaned_count
    FROM project_members pm
    LEFT JOIN users u ON pm.user_id = u.id
    WHERE u.id IS NULL;
    
    -- Check if foreign keys point to wrong table
    SELECT COUNT(*) INTO wrong_fk_count
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'tasks'
    AND ccu.table_name = 'user';  -- Wrong table name (singular)
    
    -- Check RLS status
    SELECT rowsecurity INTO rls_enabled
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'tasks';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSIS RESULTS:';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE '🔴 PROBLEM FOUND: % orphaned project_members entries', orphaned_count;
        RAISE NOTICE '   These members point to users that don''t exist';
        RAISE NOTICE '   This causes member data to be NULL in frontend';
        RAISE NOTICE '   Which makes task assignment fail';
    ELSE
        RAISE NOTICE '✓ No orphaned project_members found';
    END IF;
    
    RAISE NOTICE '';
    
    IF wrong_fk_count > 0 THEN
        RAISE NOTICE '🔴 PROBLEM FOUND: Foreign keys point to wrong table "user"';
        RAISE NOTICE '   Should be "users" (plural)';
    ELSE
        RAISE NOTICE '✓ Foreign keys are correct';
    END IF;
    
    RAISE NOTICE '';
    
    IF rls_enabled THEN
        RAISE NOTICE '⚠ RLS is ENABLED on tasks table';
        RAISE NOTICE '   This might block task creation if policies are wrong';
    ELSE
        RAISE NOTICE '✓ RLS is DISABLED (for testing)';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    
    IF orphaned_count > 0 OR wrong_fk_count > 0 THEN
        RAISE NOTICE 'ACTION REQUIRED:';
        RAISE NOTICE '👉 Run REPAIR_PROJECT_MEMBERS.sql to fix these issues';
    ELSE
        RAISE NOTICE 'Database looks healthy!';
        RAISE NOTICE 'If tasks still fail, check:';
        RAISE NOTICE '1. Browser console for exact error';
        RAISE NOTICE '2. RLS policies';
        RAISE NOTICE '3. User authentication';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;


