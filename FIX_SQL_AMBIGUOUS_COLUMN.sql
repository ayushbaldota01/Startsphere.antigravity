-- Fix ambiguous column reference in get_project_full_detail function
-- Run this in Supabase SQL Editor

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_project_full_detail(uuid);

-- Recreate function with proper table aliases to fix ambiguous column references
CREATE OR REPLACE FUNCTION get_project_full_detail(p_project_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  domain text,
  description text,
  abstract text,
  problem_statement text,
  solution_approach text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  members jsonb,
  task_stats jsonb,
  user_role text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email,
            'role', pm.role,
            'user_role', u.role,
            'is_mentor', u.role = 'mentor',
            'project_role', pm.role,
            'avatar_url', u.avatar_url
          )
        )
        FROM project_members pm
        INNER JOIN users u ON pm.user_id = u.id
        WHERE pm.project_id = p_project_id
      ),
      '[]'::jsonb
    ) as members,
    COALESCE(
      (
        SELECT jsonb_build_object(
          'total', COUNT(*)::int,
          'todo', COUNT(*) FILTER (WHERE t.status = 'TODO')::int,
          'in_progress', COUNT(*) FILTER (WHERE t.status = 'IN_PROGRESS')::int,
          'done', COUNT(*) FILTER (WHERE t.status = 'DONE')::int
        )
        FROM tasks t
        WHERE t.project_id = p_project_id
      ),
      '{"total": 0, "todo": 0, "in_progress": 0, "done": 0}'::jsonb
    ) as task_stats,
    (
      SELECT pm.role
      FROM project_members pm
      WHERE pm.project_id = p_project_id
        AND pm.user_id = auth.uid()
      LIMIT 1
    ) as user_role
  FROM projects p
  WHERE p.id = p_project_id;
END;
$$;

-- Fix ambiguous column reference in get_project_tasks function
DROP FUNCTION IF EXISTS get_project_tasks(uuid);

CREATE OR REPLACE FUNCTION get_project_tasks(p_project_id uuid)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  title text,
  description text,
  status text,
  assignee_id uuid,
  due_date timestamptz,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
    t.updated_at
  FROM tasks t
  WHERE t.project_id = p_project_id
  ORDER BY t.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_project_full_detail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_tasks(uuid) TO authenticated;

