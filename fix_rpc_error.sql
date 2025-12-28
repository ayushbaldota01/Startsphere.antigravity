-- Fix for "42702: column reference 'project_id' is ambiguous"
-- This error happens when the function parameter name conflicts with a table column name.
-- We also need to match the parameters sent by the frontend: { project_uuid, user_uuid }

-- Drop all variations of the function to start clean
DROP FUNCTION IF EXISTS get_project_tasks(uuid);
DROP FUNCTION IF EXISTS get_project_tasks(uuid, uuid);

-- Recreate the function with distinct parameter names that match the frontend call
CREATE OR REPLACE FUNCTION get_project_tasks(project_uuid uuid, user_uuid uuid DEFAULT NULL)
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
  updated_at timestamptz,
  assignee jsonb,
  created_by_user jsonb
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
    t.updated_at,
    -- Join assignee details
    COALESCE(
      (SELECT jsonb_build_object('id', u.id, 'name', u.name, 'email', u.email)
       FROM users u WHERE u.id = t.assignee_id),
      NULL
    ) as assignee,
    -- Join creator details
    COALESCE(
      (SELECT jsonb_build_object('id', u2.id, 'name', u2.name)
       FROM users u2 WHERE u2.id = t.created_by),
      NULL
    ) as created_by_user
  FROM tasks t
  WHERE t.project_id = get_project_tasks.project_uuid -- Fully qualified reference
  ORDER BY t.created_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_project_tasks(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_tasks(uuid, uuid) TO service_role;
