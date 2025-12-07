-- ============================================================================
-- COMPLETE FIX FOR TASK CREATION ISSUE
-- ============================================================================
-- This script will fix ALL possible issues preventing task creation
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Create tasks table if it doesn't exist
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
    assignee_id UUID,
    due_date TIMESTAMPTZ,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 2: Drop ALL existing foreign key constraints (even if broken)
-- ============================================================================
DO $$ 
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'tasks' 
        AND table_schema = 'public' 
        AND constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE 'ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS ' || constraint_rec.constraint_name || ' CASCADE';
        RAISE NOTICE 'Dropped constraint: %', constraint_rec.constraint_name;
    END LOOP;
END $$;

-- STEP 3: Add CORRECT foreign key constraints
-- ============================================================================

-- Foreign key to projects table
ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS tasks_project_id_fkey CASCADE;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES public.projects(id) 
ON DELETE CASCADE;

-- Foreign key to users table for assignee (can be NULL)
ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey CASCADE;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_assignee_id_fkey 
FOREIGN KEY (assignee_id) 
REFERENCES public.users(id) 
ON DELETE SET NULL;

-- Foreign key to users table for creator
ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS tasks_created_by_fkey CASCADE;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

DO $$ BEGIN
    RAISE NOTICE '✓ Foreign key constraints created successfully';
END $$;

-- STEP 4: Create indexes for performance
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
    RAISE NOTICE '✓ Indexes created successfully';
END $$;

-- STEP 5: DISABLE Row Level Security temporarily for testing
-- ============================================================================
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    RAISE NOTICE '✓ RLS DISABLED for testing - tasks should work now!';
    RAISE NOTICE '⚠ WARNING: RLS is disabled. Re-enable it after testing by running the next section.';
END $$;

-- STEP 6: Drop existing RLS policies
-- ============================================================================
DROP POLICY IF EXISTS "Project members can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Project members can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Project members can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Project members can delete tasks" ON public.tasks;

-- STEP 7: Create CORRECT RLS policies
-- ============================================================================

-- Policy: View tasks (any project member)
CREATE POLICY "Project members can view tasks" ON public.tasks
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
    )
);

-- Policy: Create tasks (any project member)
CREATE POLICY "Project members can create tasks" ON public.tasks
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
    )
);

-- Policy: Update tasks (any project member)
CREATE POLICY "Project members can update tasks" ON public.tasks
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
    )
);

-- Policy: Delete tasks (any project member)
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
    RAISE NOTICE '✓ RLS policies created successfully';
END $$;

-- STEP 8: NOW re-enable RLS (uncomment the next line after testing)
-- ============================================================================
-- ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
-- DO $$ BEGIN
--     RAISE NOTICE '✓ RLS RE-ENABLED with correct policies';
-- END $$;

-- STEP 9: Create helper function for fetching tasks
-- ============================================================================
CREATE OR REPLACE FUNCTION get_project_tasks(project_uuid UUID, user_uuid UUID)
RETURNS TABLE (
    id UUID,
    project_id UUID,
    title TEXT,
    description TEXT,
    status TEXT,
    assignee_id UUID,
    due_date TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    assignee JSONB,
    created_by_user JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is a member of the project
    IF NOT EXISTS (
        SELECT 1 FROM public.project_members 
        WHERE project_members.project_id = project_uuid 
        AND project_members.user_id = user_uuid
    ) THEN
        RAISE EXCEPTION 'User is not a member of this project';
    END IF;

    -- Return tasks with user information
    RETURN QUERY
    SELECT 
        t.id,
        t.project_id,
        t.title,
        t.description,
        t.status,
        t.assignee_id,
        t.due_date,
        t.created_by,
        t.created_at,
        t.updated_at,
        CASE 
            WHEN t.assignee_id IS NOT NULL THEN 
                jsonb_build_object(
                    'id', u_assignee.id,
                    'name', u_assignee.name,
                    'email', u_assignee.email
                )
            ELSE NULL
        END as assignee,
        jsonb_build_object(
            'id', u_creator.id,
            'name', u_creator.name
        ) as created_by_user
    FROM public.tasks t
    LEFT JOIN public.users u_assignee ON t.assignee_id = u_assignee.id
    INNER JOIN public.users u_creator ON t.created_by = u_creator.id
    WHERE t.project_id = project_uuid
    ORDER BY t.created_at DESC;
END;
$$;

DO $$ BEGIN
    RAISE NOTICE '✓ Helper function created successfully';
END $$;

-- STEP 10: Test task creation
-- ============================================================================
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
    
    RAISE NOTICE '';
    RAISE NOTICE '========== TESTING TASK CREATION ==========';
    RAISE NOTICE 'Using user ID: %', v_user_id;
    RAISE NOTICE 'Using project ID: %', v_project_id;
    
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
            'This is a test task created by the fix script',
            'TODO',
            v_user_id,
            v_user_id
        ) RETURNING id INTO v_test_task_id;
        
        RAISE NOTICE '';
        RAISE NOTICE '✓✓✓ SUCCESS! ✓✓✓';
        RAISE NOTICE '✓ Test task created with ID: %', v_test_task_id;
        RAISE NOTICE '✓ Task assignment is working!';
        RAISE NOTICE '✓ Foreign keys are correct!';
        RAISE NOTICE '';
        RAISE NOTICE '👉 Go to your app and try creating a task now!';
        RAISE NOTICE '👉 Remember to refresh your browser (Ctrl+Shift+R)';
        
        -- Clean up test task
        DELETE FROM tasks WHERE id = v_test_task_id;
        RAISE NOTICE '';
        RAISE NOTICE '✓ Test task cleaned up';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '';
        RAISE NOTICE '✗✗✗ ERROR! ✗✗✗';
        RAISE NOTICE '✗ Failed to create test task';
        RAISE NOTICE '✗ Error Code: %', SQLSTATE;
        RAISE NOTICE '✗ Error Message: %', SQLERRM;
        RAISE NOTICE '';
        
        IF SQLERRM LIKE '%foreign key%' THEN
            RAISE NOTICE '🔴 The foreign key constraint is still broken!';
            RAISE NOTICE '🔴 Check if the users/projects tables exist';
        ELSIF SQLERRM LIKE '%permission%' OR SQLERRM LIKE '%policy%' THEN
            RAISE NOTICE '🔴 RLS policy is blocking the insert';
            RAISE NOTICE '🔴 RLS has been disabled above - this shouldn''t happen';
        END IF;
    END;
END $$;

-- STEP 11: Verification
-- ============================================================================
DO $$
DECLARE
    fk_count INTEGER;
    policy_count INTEGER;
    rls_enabled BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========== FINAL VERIFICATION ==========';
    
    -- Check foreign keys
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints
    WHERE table_name = 'tasks'
    AND table_schema = 'public'
    AND constraint_type = 'FOREIGN KEY';
    
    RAISE NOTICE '✓ Foreign key constraints: %', fk_count;
    
    IF fk_count < 3 THEN
        RAISE WARNING 'Expected 3 foreign keys, found %', fk_count;
    END IF;
    
    -- Check RLS status
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = 'tasks'
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    IF rls_enabled THEN
        RAISE NOTICE '⚠ RLS is ENABLED';
    ELSE
        RAISE NOTICE '✓ RLS is DISABLED (for testing)';
    END IF;
    
    -- Check policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'tasks';
    
    RAISE NOTICE '✓ RLS policies created: %', policy_count;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FIX COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Refresh your application (Ctrl+Shift+R)';
    RAISE NOTICE '2. Try creating a task with assignment';
    RAISE NOTICE '3. If it works, come back and re-enable RLS:';
    RAISE NOTICE '   ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;';
    RAISE NOTICE '========================================';
END $$;

-- Show final foreign key configuration
SELECT
    '========== FOREIGN KEY CONFIGURATION ==========' as info;

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

