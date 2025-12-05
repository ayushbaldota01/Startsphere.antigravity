-- =============================================================================
-- ADVANCED RPC FUNCTIONS FOR PERFORMANCE
-- Run this in your Supabase SQL Editor
-- =============================================================================

-- 1. Get Dashboard Data (Single Query)
-- Fetches user profile, projects, and recent activity in one go
CREATE OR REPLACE FUNCTION get_dashboard_data(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user', (SELECT get_user_profile(user_uuid)),
    'projects', (SELECT json_agg(p) FROM (SELECT * FROM get_user_projects(user_uuid)) p),
    'recent_activity', (
      SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json)
      FROM (
        SELECT * FROM activity_logs 
        WHERE user_id = user_uuid 
        ORDER BY created_at DESC 
        LIMIT 10
      ) a
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_dashboard_data(UUID) TO authenticated;

-- 2. Get Project Full Detail (Single Query)
-- Fetches EVERYTHING needed for the project detail page
CREATE OR REPLACE FUNCTION get_project_full_detail(project_uuid UUID, user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  user_role TEXT;
BEGIN
  -- Check access
  SELECT role INTO user_role
  FROM project_members
  WHERE project_id = project_uuid AND user_id = user_uuid;
  
  IF user_role IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'project', (SELECT row_to_json(p) FROM (SELECT * FROM projects WHERE id = project_uuid) p),
    'members', (SELECT get_project_members_json(project_uuid)),
    'tasks', (SELECT get_project_tasks(project_uuid, user_uuid)),
    'user_role', user_role,
    'stats', (
      SELECT json_build_object(
        'task_count', (SELECT COUNT(*) FROM tasks WHERE project_id = project_uuid),
        'file_count', (SELECT COUNT(*) FROM files WHERE project_id = project_uuid),
        'note_count', (SELECT COUNT(*) FROM notes WHERE project_id = project_uuid),
        'message_count', (SELECT COUNT(*) FROM chat_messages WHERE project_id = project_uuid)
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function for members
CREATE OR REPLACE FUNCTION get_project_members_json(project_uuid UUID)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(m)), '[]'::json)
    FROM (
      SELECT pm.id, pm.role, pm.joined_at, u.id as user_id, u.name, u.email, u.avatar_url
      FROM project_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = project_uuid
    ) m
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_project_full_detail(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_members_json(UUID) TO authenticated;

-- 3. Batch Update Task Status
CREATE OR REPLACE FUNCTION batch_update_task_status(
  task_ids UUID[], 
  new_status TEXT,
  user_uuid UUID
)
RETURNS JSON AS $$
DECLARE
  updated_count INT;
BEGIN
  -- Verify user is member of projects for these tasks
  -- This is a simplified check, ideally we check per task
  
  UPDATE tasks
  SET status = new_status, updated_at = NOW()
  WHERE id = ANY(task_ids)
  AND EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = tasks.project_id
    AND pm.user_id = user_uuid
  );
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN json_build_object('success', true, 'updated_count', updated_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION batch_update_task_status(UUID[], TEXT, UUID) TO authenticated;
