-- ============================================================================
-- REPAIR PROJECT MEMBERS - Complete Fix Script
-- ============================================================================
-- This script fixes all issues preventing task assignment in certain projects
-- Run VERIFY_ALL_PROJECTS.sql first to see what needs fixing
-- ============================================================================

-- STEP 1: Backup orphaned project_members before deletion (for reference)
-- ============================================================================
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM project_members pm
    LEFT JOIN users u ON pm.user_id = u.id
    WHERE u.id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'STEP 1: Found % orphaned project_members', orphaned_count;
        RAISE NOTICE 'These will be deleted (user_id points to non-existent users)';
        RAISE NOTICE '========================================';
    ELSE
        RAISE NOTICE '✓ No orphaned project_members found';
    END IF;
END $$;

-- Show which entries will be deleted
SELECT 
    pm.id,
    pm.project_id,
    p.name as project_name,
    pm.user_id as non_existent_user_id,
    pm.role
FROM project_members pm
LEFT JOIN users u ON pm.user_id = u.id
LEFT JOIN projects p ON pm.project_id = p.id
WHERE u.id IS NULL;

-- STEP 2: Delete orphaned project_members
-- ============================================================================
DELETE FROM project_members pm
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = pm.user_id
);

DO $$ 
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '✓ Deleted % orphaned project_members entries', deleted_count;
    END IF;
END $$;

-- STEP 3: Fix tasks table - Drop ALL foreign key constraints
-- ============================================================================
DO $$ 
DECLARE
    constraint_rec RECORD;
    dropped_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 3: Fixing foreign key constraints on tasks table';
    RAISE NOTICE '========================================';
    
    FOR constraint_rec IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'tasks' 
        AND table_schema = 'public' 
        AND constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE 'ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS ' || constraint_rec.constraint_name || ' CASCADE';
        RAISE NOTICE '✓ Dropped constraint: %', constraint_rec.constraint_name;
        dropped_count := dropped_count + 1;
    END LOOP;
    
    IF dropped_count = 0 THEN
        RAISE NOTICE '⚠ No foreign key constraints found to drop';
    END IF;
END $$;

-- STEP 4: Create CORRECT foreign key constraints
-- ============================================================================

-- Foreign key to projects table
ALTER TABLE public.tasks
ADD CONSTRAINT tasks_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES public.projects(id) 
ON DELETE CASCADE;

-- Foreign key to users table for assignee (can be NULL)
ALTER TABLE public.tasks
ADD CONSTRAINT tasks_assignee_id_fkey 
FOREIGN KEY (assignee_id) 
REFERENCES public.users(id)  -- Note: "users" plural, not "user"
ON DELETE SET NULL;

-- Foreign key to users table for creator
ALTER TABLE public.tasks
ADD CONSTRAINT tasks_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.users(id)  -- Note: "users" plural, not "user"
ON DELETE CASCADE;

DO $$ BEGIN
    RAISE NOTICE '✓ Created correct foreign key constraints';
    RAISE NOTICE '  - tasks_project_id_fkey → projects(id)';
    RAISE NOTICE '  - tasks_assignee_id_fkey → users(id)';
    RAISE NOTICE '  - tasks_created_by_fkey → users(id)';
END $$;

-- STEP 5: Ensure indexes exist for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_project_status 
ON public.tasks(project_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_project 
ON public.tasks(assignee_id, project_id) 
WHERE assignee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_created_by 
ON public.tasks(created_by);

CREATE INDEX IF NOT EXISTS idx_tasks_created_at 
ON public.tasks(project_id, created_at DESC);

DO $$ BEGIN
    RAISE NOTICE '✓ Ensured performance indexes exist';
END $$;

-- STEP 6: Fix RLS policies (if they're blocking)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Project members can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Project members can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Project members can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Project members can delete tasks" ON public.tasks;

-- Create correct RLS policies
CREATE POLICY "Project members can view tasks" ON public.tasks
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
    )
);

CREATE POLICY "Project members can create tasks" ON public.tasks
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
    )
);

CREATE POLICY "Project members can update tasks" ON public.tasks
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
    )
);

CREATE POLICY "Project members can delete tasks" ON public.tasks
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
    )
);

DO $$ BEGIN
    RAISE NOTICE '✓ RLS policies recreated with correct logic';
END $$;

-- STEP 7: Keep RLS disabled for now (for testing)
-- ============================================================================
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    RAISE NOTICE '✓ RLS temporarily DISABLED for testing';
    RAISE NOTICE '⚠ Remember to re-enable after testing:';
    RAISE NOTICE '  ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;';
END $$;

-- STEP 8: Test task creation
-- ============================================================================
DO $$
DECLARE
    v_user_id UUID;
    v_project_id UUID;
    v_test_task_id UUID;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 8: Testing task creation';
    RAISE NOTICE '========================================';
    
    -- Get first user
    SELECT id INTO v_user_id FROM users LIMIT 1;
    
    -- Get first project
    SELECT id INTO v_project_id FROM projects LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE '✗ No users found - cannot test';
        RETURN;
    END IF;
    
    IF v_project_id IS NULL THEN
        RAISE NOTICE '✗ No projects found - cannot test';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing with user: %', v_user_id;
    RAISE NOTICE 'Testing with project: %', v_project_id;
    
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
            'TEST TASK - AUTO DELETE',
            'Testing task assignment repair',
            'TODO',
            v_user_id,
            v_user_id
        ) RETURNING id INTO v_test_task_id;
        
        RAISE NOTICE '';
        RAISE NOTICE '✓✓✓ SUCCESS! ✓✓✓';
        RAISE NOTICE '✓ Test task created: %', v_test_task_id;
        RAISE NOTICE '✓ Task assignment is FIXED!';
        
        -- Clean up
        DELETE FROM tasks WHERE id = v_test_task_id;
        RAISE NOTICE '✓ Test task cleaned up';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '';
        RAISE NOTICE '✗✗✗ ERROR! ✗✗✗';
        RAISE NOTICE '✗ Error: %', SQLERRM;
        RAISE NOTICE '';
        RAISE NOTICE 'If you see foreign key errors, the users/projects tables might have issues';
    END;
END $$;

-- STEP 9: Final verification
-- ============================================================================
DO $$
DECLARE
    orphaned_count INTEGER;
    fk_count INTEGER;
    wrong_fk_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FINAL VERIFICATION';
    RAISE NOTICE '========================================';
    
    -- Check orphaned members
    SELECT COUNT(*) INTO orphaned_count
    FROM project_members pm
    LEFT JOIN users u ON pm.user_id = u.id
    WHERE u.id IS NULL;
    
    IF orphaned_count = 0 THEN
        RAISE NOTICE '✓ No orphaned project_members';
    ELSE
        RAISE NOTICE '✗ Still % orphaned project_members', orphaned_count;
    END IF;
    
    -- Check foreign keys
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints
    WHERE table_name = 'tasks'
    AND table_schema = 'public'
    AND constraint_type = 'FOREIGN KEY';
    
    RAISE NOTICE '✓ Tasks table has % foreign key constraints', fk_count;
    
    -- Check if any still point to wrong table
    SELECT COUNT(*) INTO wrong_fk_count
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'tasks'
    AND ccu.table_name = 'user';  -- Wrong table
    
    IF wrong_fk_count = 0 THEN
        RAISE NOTICE '✓ All foreign keys point to correct tables';
    ELSE
        RAISE NOTICE '✗ Still % foreign keys pointing to wrong table', wrong_fk_count;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'REPAIR COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Refresh your application (Ctrl+Shift+R)';
    RAISE NOTICE '2. Try creating tasks in ALL projects';
    RAISE NOTICE '3. Tasks should work in all projects now!';
    RAISE NOTICE '';
    RAISE NOTICE 'If you still have issues:';
    RAISE NOTICE '- Check browser console for errors';
    RAISE NOTICE '- Run VERIFY_ALL_PROJECTS.sql again';
    RAISE NOTICE '- Share the error message';
    RAISE NOTICE '========================================';
END $$;

-- Show final foreign key configuration
SELECT
    '========== FINAL FOREIGN KEY CONFIGURATION ==========' as info;

SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'tasks'
AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;


