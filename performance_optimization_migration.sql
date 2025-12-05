-- =============================================================================
-- PERFORMANCE OPTIMIZATION MIGRATION
-- Run this in your Supabase SQL Editor to apply critical performance fixes
-- =============================================================================

-- 1. Composite index for project membership lookups (Critical for RLS)
-- Speeds up "is this user a member of this project?" checks
CREATE INDEX IF NOT EXISTS idx_project_members_composite 
  ON project_members(project_id, user_id);

-- 2. Index for user email lookups
-- Speeds up adding members by email
CREATE INDEX IF NOT EXISTS idx_users_email_lower 
  ON users(LOWER(email));

-- 3. Composite indexes for tasks
-- Speeds up filtering tasks by status within a project
CREATE INDEX IF NOT EXISTS idx_tasks_project_status 
  ON tasks(project_id, status);

-- Speeds up finding tasks assigned to a specific user in a project
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_project 
  ON tasks(assignee_id, project_id) WHERE assignee_id IS NOT NULL;

-- 4. Optimized indexes for time-based data (Chat, Files, Notes)
-- Speeds up loading the most recent items first

-- Chat messages: Most recent first
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_created 
  ON chat_messages(project_id, created_at DESC);

-- Files: Most recent first
CREATE INDEX IF NOT EXISTS idx_files_project_created 
  ON files(project_id, created_at DESC);

-- Notes: Most recent first
CREATE INDEX IF NOT EXISTS idx_notes_project_created 
  ON notes(project_id, created_at DESC);

-- 5. Portfolio indexes
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id 
  ON portfolios(user_id);

-- 6. Analyze tables to update query planner statistics
ANALYZE project_members;
ANALYZE tasks;
ANALYZE chat_messages;
ANALYZE files;
ANALYZE notes;
ANALYZE users;

-- =============================================================================
-- OPTIMIZED RLS HELPER FUNCTIONS
-- These functions reduce the overhead of RLS policies by providing
-- a more efficient way to check membership
-- =============================================================================

CREATE OR REPLACE FUNCTION is_project_member(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM project_members 
    WHERE project_id = project_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_project_admin(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM project_members 
    WHERE project_id = project_uuid 
      AND user_id = auth.uid() 
      AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_project_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_project_admin(UUID) TO authenticated;
