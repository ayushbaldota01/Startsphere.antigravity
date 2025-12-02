-- =============================================================================
-- SUPABASE PERFORMANCE OPTIMIZATIONS
-- Run this SQL in your Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- 1. DATABASE FUNCTION: Get User Projects with Member Count
-- This eliminates the N+1 query problem by fetching all data in one query
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_projects(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  domain TEXT,
  description TEXT,
  abstract TEXT,
  problem_statement TEXT,
  solution_approach TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  role TEXT,
  member_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.domain,
    p.description,
    p.abstract,
    p.problem_statement,
    p.solution_approach,
    p.created_by,
    p.created_at,
    p.updated_at,
    pm.role,
    (SELECT COUNT(*) FROM project_members WHERE project_id = p.id)::BIGINT as member_count
  FROM projects p
  INNER JOIN project_members pm ON pm.project_id = p.id
  WHERE pm.user_id = user_uuid
  ORDER BY p.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_projects(UUID) TO authenticated;

-- =============================================================================
-- 2. DATABASE FUNCTION: Get Project Detail with Members
-- Fetches project, members, and user role in a single query
-- =============================================================================

CREATE OR REPLACE FUNCTION get_project_detail(project_uuid UUID, user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  user_role TEXT;
BEGIN
  -- First check if user has access to this project
  SELECT role INTO user_role
  FROM project_members
  WHERE project_id = project_uuid AND user_id = user_uuid;
  
  IF user_role IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'project', (
      SELECT row_to_json(proj) FROM (
        SELECT id, name, domain, description, abstract, 
               problem_statement, solution_approach, 
               created_by, created_at, updated_at
        FROM projects WHERE id = project_uuid
      ) proj
    ),
    'members', (
      SELECT COALESCE(json_agg(row_to_json(m)), '[]'::json) FROM (
        SELECT 
          pm.id as membership_id,
          pm.role,
          pm.joined_at,
          u.id,
          u.name,
          u.email,
          u.avatar_url,
          u.role as user_role
        FROM project_members pm
        JOIN users u ON u.id = pm.user_id
        WHERE pm.project_id = project_uuid
        ORDER BY pm.joined_at ASC
      ) m
    ),
    'user_role', user_role,
    'task_stats', (
      SELECT row_to_json(stats) FROM (
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'TODO') as todo,
          COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress,
          COUNT(*) FILTER (WHERE status = 'DONE') as done
        FROM tasks WHERE project_id = project_uuid
      ) stats
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_project_detail(UUID, UUID) TO authenticated;

-- =============================================================================
-- 3. DATABASE FUNCTION: Get Tasks with Assignee Info
-- Fetches tasks with user data in a single query
-- =============================================================================

CREATE OR REPLACE FUNCTION get_project_tasks(project_uuid UUID, user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  -- Check access
  SELECT EXISTS(
    SELECT 1 FROM project_members 
    WHERE project_id = project_uuid AND user_id = user_uuid
  ) INTO has_access;
  
  IF NOT has_access THEN
    RETURN NULL;
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json)
    FROM (
      SELECT 
        tk.id,
        tk.project_id,
        tk.title,
        tk.description,
        tk.status,
        tk.due_date,
        tk.created_at,
        tk.updated_at,
        tk.assignee_id,
        tk.created_by,
        CASE WHEN tk.assignee_id IS NOT NULL THEN
          json_build_object(
            'id', assignee.id,
            'name', assignee.name,
            'email', assignee.email
          )
        ELSE NULL END as assignee,
        json_build_object(
          'id', creator.id,
          'name', creator.name
        ) as created_by_user
      FROM tasks tk
      LEFT JOIN users assignee ON assignee.id = tk.assignee_id
      LEFT JOIN users creator ON creator.id = tk.created_by
      WHERE tk.project_id = project_uuid
    ) t
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_project_tasks(UUID, UUID) TO authenticated;

-- =============================================================================
-- 4. DATABASE FUNCTION: Get Chat Messages with User Info
-- Fetches messages with user data efficiently
-- =============================================================================

CREATE OR REPLACE FUNCTION get_project_messages(
  project_uuid UUID, 
  user_uuid UUID,
  message_limit INT DEFAULT 100,
  before_timestamp TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  -- Check access
  SELECT EXISTS(
    SELECT 1 FROM project_members 
    WHERE project_id = project_uuid AND user_id = user_uuid
  ) INTO has_access;
  
  IF NOT has_access THEN
    RETURN NULL;
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(m) ORDER BY m.created_at ASC), '[]'::json)
    FROM (
      SELECT 
        cm.id,
        cm.project_id,
        cm.content,
        cm.created_at,
        cm.user_id,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'avatar_url', u.avatar_url
        ) as user
      FROM chat_messages cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.project_id = project_uuid
        AND (before_timestamp IS NULL OR cm.created_at < before_timestamp)
      ORDER BY cm.created_at DESC
      LIMIT message_limit
    ) m
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_project_messages(UUID, UUID, INT, TIMESTAMPTZ) TO authenticated;

-- =============================================================================
-- 5. DATABASE FUNCTION: Get Notes with User Info
-- =============================================================================

CREATE OR REPLACE FUNCTION get_project_notes(project_uuid UUID, user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  -- Check access
  SELECT EXISTS(
    SELECT 1 FROM project_members 
    WHERE project_id = project_uuid AND user_id = user_uuid
  ) INTO has_access;
  
  IF NOT has_access THEN
    RETURN NULL;
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(n) ORDER BY n.created_at DESC), '[]'::json)
    FROM (
      SELECT 
        nt.id,
        nt.project_id,
        nt.content,
        nt.created_at,
        nt.updated_at,
        nt.user_id,
        json_build_object(
          'id', u.id,
          'name', u.name
        ) as user
      FROM notes nt
      JOIN users u ON u.id = nt.user_id
      WHERE nt.project_id = project_uuid
    ) n
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_project_notes(UUID, UUID) TO authenticated;

-- =============================================================================
-- 6. DATABASE FUNCTION: Get Files with Uploader Info
-- =============================================================================

CREATE OR REPLACE FUNCTION get_project_files(project_uuid UUID, user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  -- Check access
  SELECT EXISTS(
    SELECT 1 FROM project_members 
    WHERE project_id = project_uuid AND user_id = user_uuid
  ) INTO has_access;
  
  IF NOT has_access THEN
    RETURN NULL;
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(f) ORDER BY f.created_at DESC), '[]'::json)
    FROM (
      SELECT 
        fl.id,
        fl.project_id,
        fl.file_name,
        fl.file_path,
        fl.file_size,
        fl.mime_type,
        fl.created_at,
        fl.uploaded_by,
        json_build_object(
          'id', u.id,
          'name', u.name
        ) as uploaded_by_user
      FROM files fl
      JOIN users u ON u.id = fl.uploaded_by
      WHERE fl.project_id = project_uuid
    ) f
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_project_files(UUID, UUID) TO authenticated;

-- =============================================================================
-- 7. DATABASE VIEW: Portfolio Complete
-- Fetches portfolio with all related data in a single query
-- =============================================================================

DROP VIEW IF EXISTS portfolio_complete;

CREATE VIEW portfolio_complete AS
SELECT 
  p.id,
  p.user_id,
  p.display_name,
  p.title,
  p.bio,
  p.location,
  p.github_url,
  p.linkedin_url,
  p.website_url,
  p.created_at,
  p.updated_at,
  COALESCE(
    (SELECT json_agg(row_to_json(ps)) FROM portfolio_skills ps WHERE ps.portfolio_id = p.id),
    '[]'::json
  ) as skills,
  COALESCE(
    (SELECT json_agg(row_to_json(pe)) FROM portfolio_experience pe WHERE pe.portfolio_id = p.id),
    '[]'::json
  ) as experience,
  COALESCE(
    (SELECT json_agg(row_to_json(ped)) FROM portfolio_education ped WHERE ped.portfolio_id = p.id),
    '[]'::json
  ) as education,
  COALESCE(
    (SELECT json_agg(row_to_json(pp)) FROM portfolio_projects pp WHERE pp.portfolio_id = p.id),
    '[]'::json
  ) as projects
FROM portfolios p;

-- Grant access to the view
GRANT SELECT ON portfolio_complete TO authenticated;
GRANT SELECT ON portfolio_complete TO anon;

-- =============================================================================
-- 8. COMPOSITE INDEXES for Common Query Patterns
-- =============================================================================

-- Composite index for project membership lookups
CREATE INDEX IF NOT EXISTS idx_project_members_composite 
  ON project_members(project_id, user_id);

-- Composite index for project members with role
CREATE INDEX IF NOT EXISTS idx_project_members_project_role 
  ON project_members(project_id, role);

-- Composite index for tasks by project and status
CREATE INDEX IF NOT EXISTS idx_tasks_project_status 
  ON tasks(project_id, status);

-- Composite index for tasks by assignee
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_project 
  ON tasks(assignee_id, project_id) WHERE assignee_id IS NOT NULL;

-- Composite index for chat messages by project and time
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_created 
  ON chat_messages(project_id, created_at DESC);

-- Composite index for notes by project and time
CREATE INDEX IF NOT EXISTS idx_notes_project_created 
  ON notes(project_id, created_at DESC);

-- Composite index for files by project and time
CREATE INDEX IF NOT EXISTS idx_files_project_created 
  ON files(project_id, created_at DESC);

-- Index for user email lookups (for adding members)
CREATE INDEX IF NOT EXISTS idx_users_email_lower 
  ON users(LOWER(email));

-- Index for portfolio lookups
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id 
  ON portfolios(user_id);

-- =============================================================================
-- 9. DATABASE FUNCTION: Get User Profile (for caching)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT row_to_json(u)
    FROM (
      SELECT id, email, name, bio, avatar_url, role, university, major, created_at, updated_at
      FROM users
      WHERE id = user_uuid
    ) u
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;

-- =============================================================================
-- 10. OPTIMIZED RLS HELPER FUNCTION
-- Reduces RLS policy overhead by caching membership checks
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

-- =============================================================================
-- DONE! Your database is now optimized for performance.
-- =============================================================================

