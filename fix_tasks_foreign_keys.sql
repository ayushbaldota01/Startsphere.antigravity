-- Fix Tasks Table Foreign Key Constraints
-- This script fixes the foreign key references in the tasks table
-- to properly reference the users table

-- =============================================================================
-- STEP 1: Check if tasks table exists
-- =============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks') THEN
        RAISE NOTICE 'Tasks table does not exist. Creating it...';
        
        -- Create tasks table if it doesn't exist
        CREATE TABLE public.tasks (
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
    END IF;
END $$;

-- =============================================================================
-- STEP 2: Drop any existing foreign key constraints that might be incorrect
-- =============================================================================

-- Drop old foreign key constraints if they exist
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

-- =============================================================================
-- STEP 3: Add correct foreign key constraints
-- =============================================================================

-- Add foreign key for project_id (reference to projects table)
ALTER TABLE public.tasks
ADD CONSTRAINT tasks_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES public.projects(id) 
ON DELETE CASCADE;

-- Add foreign key for assignee_id (reference to users table - can be NULL)
ALTER TABLE public.tasks
ADD CONSTRAINT tasks_assignee_id_fkey 
FOREIGN KEY (assignee_id) 
REFERENCES public.users(id) 
ON DELETE SET NULL;

-- Add foreign key for created_by (reference to users table)
ALTER TABLE public.tasks
ADD CONSTRAINT tasks_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- =============================================================================
-- STEP 4: Create indexes for performance
-- =============================================================================

-- Index for filtering tasks by project and status
CREATE INDEX IF NOT EXISTS idx_tasks_project_status 
ON public.tasks(project_id, status);

-- Index for finding tasks assigned to a user
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_project 
ON public.tasks(assignee_id, project_id) 
WHERE assignee_id IS NOT NULL;

-- Index for finding tasks created by a user
CREATE INDEX IF NOT EXISTS idx_tasks_created_by 
ON public.tasks(created_by);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_created_at 
ON public.tasks(project_id, created_at DESC);

-- =============================================================================
-- STEP 5: Enable Row Level Security
-- =============================================================================

-- Enable RLS on tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Project members can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Project members can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Project members can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Project members can delete tasks" ON public.tasks;

-- Create RLS policies
-- View tasks: any project member can see tasks
CREATE POLICY "Project members can view tasks" ON public.tasks
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
    )
);

-- Create tasks: any project member can create tasks
CREATE POLICY "Project members can create tasks" ON public.tasks
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
    )
);

-- Update tasks: any project member can update tasks
CREATE POLICY "Project members can update tasks" ON public.tasks
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
    )
);

-- Delete tasks: any project member can delete tasks
CREATE POLICY "Project members can delete tasks" ON public.tasks
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
    )
);

-- =============================================================================
-- STEP 6: Create helper function to get project tasks with user info
-- =============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_project_tasks(UUID, UUID);

-- Create function to get tasks with assignee and creator info
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

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify the foreign keys are set up correctly
DO $$
DECLARE
    fk_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints
    WHERE table_name = 'tasks'
    AND table_schema = 'public'
    AND constraint_type = 'FOREIGN KEY';
    
    RAISE NOTICE 'Tasks table has % foreign key constraints', fk_count;
    
    IF fk_count < 3 THEN
        RAISE WARNING 'Expected at least 3 foreign keys (project_id, assignee_id, created_by)';
    ELSE
        RAISE NOTICE 'Foreign key constraints are properly configured!';
    END IF;
END $$;

-- Show all foreign key constraints on tasks table
SELECT
    tc.constraint_name,
    tc.table_name,
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

