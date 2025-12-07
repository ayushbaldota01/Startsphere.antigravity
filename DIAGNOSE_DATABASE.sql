-- ============================================================================
-- COMPREHENSIVE DATABASE DIAGNOSIS FOR TASK CREATION ISSUE
-- ============================================================================
-- Run this in Supabase SQL Editor to see what's actually wrong
-- ============================================================================

-- 1. CHECK IF TASKS TABLE EXISTS
SELECT '========== 1. CHECKING TASKS TABLE ==========' as step;

SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks')
        THEN '✓ Tasks table EXISTS'
        ELSE '✗ Tasks table DOES NOT EXIST - THIS IS THE PROBLEM!'
    END as result;

-- 2. CHECK TASKS TABLE STRUCTURE
SELECT '========== 2. TASKS TABLE COLUMNS ==========' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'tasks'
ORDER BY ordinal_position;

-- 3. CHECK FOREIGN KEY CONSTRAINTS ON TASKS
SELECT '========== 3. FOREIGN KEY CONSTRAINTS (THE PROBLEM IS HERE) ==========' as step;

SELECT
    tc.constraint_name,
    kcu.column_name as column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'tasks'
AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- EXPECTED OUTPUT:
-- constraint_name           | column_name  | references_table | references_column | delete_rule
-- tasks_assignee_id_fkey    | assignee_id  | users           | id                | SET NULL
-- tasks_created_by_fkey     | created_by   | users           | id                | CASCADE
-- tasks_project_id_fkey     | project_id   | projects        | id                | CASCADE
--
-- IF YOU SEE "user" (singular) instead of "users" - THAT'S THE BUG!

-- 4. CHECK IF USERS TABLE EXISTS
SELECT '========== 4. CHECKING USERS TABLE ==========' as step;

SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users')
        THEN '✓ Users table EXISTS'
        ELSE '✗ Users table DOES NOT EXIST - MAJOR PROBLEM!'
    END as result;

-- Also check for singular 'user' table (the wrong one)
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user')
        THEN '✗ WARNING: "user" table (singular) EXISTS - This might be causing confusion'
        ELSE '✓ No "user" (singular) table found - Good'
    END as result;

-- 5. CHECK USERS TABLE STRUCTURE
SELECT '========== 5. USERS TABLE STRUCTURE ==========' as step;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position
LIMIT 10;

-- 6. CHECK IF ANY USERS EXIST
SELECT '========== 6. SAMPLE USERS (First 3) ==========' as step;

SELECT 
    id,
    name,
    email,
    role
FROM users
LIMIT 3;

-- 7. CHECK PROJECTS TABLE
SELECT '========== 7. CHECKING PROJECTS TABLE ==========' as step;

SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects')
        THEN '✓ Projects table EXISTS'
        ELSE '✗ Projects table DOES NOT EXIST'
    END as result;

-- 8. CHECK RLS POLICIES ON TASKS
SELECT '========== 8. ROW LEVEL SECURITY POLICIES ==========' as step;

SELECT 
    tablename,
    policyname,
    cmd as operation,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'tasks'
ORDER BY policyname;

-- 9. TRY TO INSERT A TEST TASK (This will show the exact error)
SELECT '========== 9. ATTEMPTING TEST INSERT ==========' as step;

-- First, get a valid user ID and project ID
DO $$
DECLARE
    v_user_id UUID;
    v_project_id UUID;
    v_test_task_id UUID;
BEGIN
    -- Get first user
    SELECT id INTO v_user_id FROM users LIMIT 1;
    
    -- Get first project
    SELECT id INTO v_project_id FROM projects LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE '✗ ERROR: No users found in database!';
        RETURN;
    END IF;
    
    IF v_project_id IS NULL THEN
        RAISE NOTICE '✗ ERROR: No projects found in database!';
        RETURN;
    END IF;
    
    RAISE NOTICE '✓ Found user ID: %', v_user_id;
    RAISE NOTICE '✓ Found project ID: %', v_project_id;
    
    -- Try to insert a test task
    BEGIN
        INSERT INTO tasks (
            project_id,
            title,
            description,
            status,
            assignee_id,
            created_by
        ) VALUES (
            v_project_id,
            'TEST TASK - DELETE ME',
            'This is a test task to diagnose the issue',
            'TODO',
            v_user_id,  -- Assign to a user
            v_user_id   -- Created by same user
        ) RETURNING id INTO v_test_task_id;
        
        RAISE NOTICE '✓✓✓ SUCCESS! Test task created with ID: %', v_test_task_id;
        RAISE NOTICE '✓ The database foreign keys are CORRECT!';
        RAISE NOTICE '✓ The problem might be in your frontend code or RLS policies';
        
        -- Clean up test task
        DELETE FROM tasks WHERE id = v_test_task_id;
        RAISE NOTICE '✓ Test task cleaned up';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗✗✗ ERROR INSERTING TEST TASK:';
        RAISE NOTICE '✗ Error Code: %', SQLSTATE;
        RAISE NOTICE '✗ Error Message: %', SQLERRM;
        RAISE NOTICE '✗ This is the EXACT error your app is getting!';
        
        -- Check what the error is about
        IF SQLERRM LIKE '%foreign key%' AND SQLERRM LIKE '%user%' THEN
            RAISE NOTICE '';
            RAISE NOTICE '🔴 DIAGNOSIS: Foreign key is pointing to wrong table!';
            RAISE NOTICE '🔴 The constraint references "user" (singular) instead of "users" (plural)';
            RAISE NOTICE '🔴 SOLUTION: Run fix_tasks_foreign_keys.sql';
        ELSIF SQLERRM LIKE '%permission denied%' OR SQLERRM LIKE '%policy%' THEN
            RAISE NOTICE '';
            RAISE NOTICE '🔴 DIAGNOSIS: Row Level Security policy is blocking the insert!';
            RAISE NOTICE '🔴 SOLUTION: Check RLS policies or disable RLS temporarily for testing';
        ELSE
            RAISE NOTICE '';
            RAISE NOTICE '🔴 DIAGNOSIS: Unknown error - see message above';
        END IF;
    END;
END $$;

-- 10. FINAL SUMMARY
SELECT '========== 10. FINAL DIAGNOSIS SUMMARY ==========' as step;

SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks')
        THEN '🔴 CRITICAL: tasks table does not exist!'
        WHEN NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users')
        THEN '🔴 CRITICAL: users table does not exist!'
        WHEN NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects')
        THEN '🔴 CRITICAL: projects table does not exist!'
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints AS tc
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = 'tasks'
            AND ccu.table_name = 'user'  -- Wrong table name (singular)
        )
        THEN '🔴 PROBLEM FOUND: Foreign key points to "user" (singular) instead of "users" (plural)
        
👉 SOLUTION: Run fix_tasks_foreign_keys.sql in Supabase SQL Editor'
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints AS tc
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = 'tasks'
        )
        THEN '🔴 PROBLEM: No foreign key constraints found on tasks table
        
👉 SOLUTION: Run fix_tasks_foreign_keys.sql in Supabase SQL Editor'
        ELSE '✓ Database schema looks correct. Problem might be:
   - RLS policies blocking access
   - Frontend sending wrong data
   - Authentication issues
   
Check the test insert result above (Section 9) for details.'
    END as diagnosis;

-- List all tables to confirm structure
SELECT '========== ALL TABLES IN DATABASE ==========' as step;

SELECT 
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

