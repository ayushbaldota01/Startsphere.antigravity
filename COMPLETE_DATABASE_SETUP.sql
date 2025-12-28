-- ============================================================================
-- COMPLETE DATABASE SETUP - Run this ONCE in Supabase SQL Editor
-- This file contains ALL RPC functions needed by the application
-- ============================================================================

-- ============================================================================
-- PART 1: CORE PROJECT FUNCTIONS
-- ============================================================================

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS get_user_projects(uuid);
DROP FUNCTION IF EXISTS get_project_full_detail(uuid, uuid);
DROP FUNCTION IF EXISTS get_project_tasks(uuid, uuid);

-- 1. Get User Projects (for Dashboard)
CREATE OR REPLACE FUNCTION get_user_projects(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  updated_at timestamptz,
  role text,
  member_count bigint,
  task_stats jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.updated_at,
    pm.role,
    (
      SELECT COUNT(*)
      FROM project_members all_pm
      WHERE all_pm.project_id = p.id
    ) as member_count,
    COALESCE(
      (
        SELECT jsonb_build_object(
          'total', COUNT(*),
          'todo', COUNT(*) FILTER (WHERE t.status = 'TODO'),
          'in_progress', COUNT(*) FILTER (WHERE t.status = 'IN_PROGRESS'),
          'done', COUNT(*) FILTER (WHERE t.status = 'DONE')
        )
        FROM tasks t
        WHERE t.project_id = p.id
      ),
      '{"total": 0, "todo": 0, "in_progress": 0, "done": 0}'::jsonb
    ) as task_stats
  FROM project_members pm
  JOIN projects p ON p.id = pm.project_id
  WHERE pm.user_id = user_uuid
  ORDER BY p.updated_at DESC;
END;
$$;

-- 2. Get Project Full Detail (for Project Detail Page)
CREATE OR REPLACE FUNCTION get_project_full_detail(p_project_id uuid, user_uuid uuid)
RETURNS TABLE (
  project jsonb,
  members jsonb,
  stats jsonb,
  user_role text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(p.*) as project,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email,
            'avatar_url', u.avatar_url,
            'role', mem.role,
            'project_role', mem.role,
            'user_role', u.role,
            'is_mentor', u.role = 'mentor',
            'joined_at', mem.joined_at
          )
        )
        FROM project_members mem
        JOIN users u ON u.id = mem.user_id
        WHERE mem.project_id = p.id
      ),
      '[]'::jsonb
    ) as members,
    COALESCE(
      (
        SELECT jsonb_build_object(
          'task_count', COUNT(*),
          'todo_count', COUNT(*) FILTER (WHERE t.status = 'TODO'),
          'active_count', COUNT(*) FILTER (WHERE t.status = 'IN_PROGRESS'),
          'completed_count', COUNT(*) FILTER (WHERE t.status = 'DONE')
        )
        FROM tasks t
        WHERE t.project_id = p.id
      ),
      '{"task_count": 0, "todo_count": 0, "active_count": 0, "completed_count": 0}'::jsonb
    ) as stats,
    (
      SELECT pm.role 
      FROM project_members pm 
      WHERE pm.project_id = p.id AND pm.user_id = user_uuid
    ) as user_role
  FROM projects p
  WHERE p.id = p_project_id;
END;
$$;

-- 3. Get Project Tasks
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
    COALESCE(
      (SELECT jsonb_build_object('id', u.id, 'name', u.name, 'email', u.email)
       FROM users u WHERE u.id = t.assignee_id),
      NULL
    ) as assignee,
    COALESCE(
      (SELECT jsonb_build_object('id', u2.id, 'name', u2.name)
       FROM users u2 WHERE u2.id = t.created_by),
      NULL
    ) as created_by_user
  FROM tasks t
  WHERE t.project_id = get_project_tasks.project_uuid
  ORDER BY t.created_at DESC;
END;
$$;

-- ============================================================================
-- PART 2: CHAT & MESSAGING FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS get_project_messages(uuid);
DROP FUNCTION IF EXISTS get_project_notes(uuid);
DROP FUNCTION IF EXISTS get_project_files(uuid);

-- 4. Get Project Messages (Chat)
CREATE OR REPLACE FUNCTION get_project_messages(project_uuid uuid)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  user_id uuid,
  message text,
  created_at timestamptz,
  user_name text,
  user_avatar text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.project_id,
    m.user_id,
    m.message,
    m.created_at,
    u.name as user_name,
    u.avatar_url as user_avatar
  FROM chat_messages m
  JOIN users u ON u.id = m.user_id
  WHERE m.project_id = project_uuid
  ORDER BY m.created_at ASC;
END;
$$;

-- 5. Get Project Notes
CREATE OR REPLACE FUNCTION get_project_notes(project_uuid uuid)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  user_id uuid,
  content text,
  created_at timestamptz,
  updated_at timestamptz,
  user_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.project_id,
    n.user_id,
    n.content,
    n.created_at,
    n.updated_at,
    u.name as user_name
  FROM notes n
  JOIN users u ON u.id = n.user_id
  WHERE n.project_id = project_uuid
  ORDER BY n.updated_at DESC;
END;
$$;

-- 6. Get Project Files
CREATE OR REPLACE FUNCTION get_project_files(project_uuid uuid)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  file_name text,
  file_path text,
  file_size bigint,
  uploaded_by uuid,
  created_at timestamptz,
  uploader_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.project_id,
    f.file_name,
    f.file_path,
    f.file_size,
    f.uploaded_by,
    f.created_at,
    u.name as uploader_name
  FROM files f
  JOIN users u ON u.id = f.uploaded_by
  WHERE f.project_id = project_uuid
  ORDER BY f.created_at DESC;
END;
$$;

-- ============================================================================
-- PART 3: MENTOR FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS get_mentor_projects(uuid);
DROP FUNCTION IF EXISTS get_pending_mentor_requests(uuid);
DROP FUNCTION IF EXISTS get_project_mentor_requests(uuid);
DROP FUNCTION IF EXISTS accept_mentor_request(uuid);
DROP FUNCTION IF EXISTS reject_mentor_request(uuid);
DROP FUNCTION IF EXISTS get_mentor_conversations(uuid);
DROP FUNCTION IF EXISTS send_mentor_message(uuid, uuid, text, uuid);
DROP FUNCTION IF EXISTS mark_mentor_messages_read(uuid, uuid);
DROP FUNCTION IF EXISTS get_mentor_unread_count(uuid);
DROP FUNCTION IF EXISTS get_message_thread(uuid);

-- 7. Get Mentor Projects
CREATE OR REPLACE FUNCTION get_mentor_projects(mentor_uuid uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  student_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id AND pm.role != 'MENTOR') as student_count
  FROM projects p
  JOIN project_members pm ON pm.project_id = p.id
  WHERE pm.user_id = mentor_uuid AND pm.role = 'MENTOR'
  ORDER BY p.updated_at DESC;
END;
$$;

-- 8. Get Pending Mentor Requests
CREATE OR REPLACE FUNCTION get_pending_mentor_requests(mentor_uuid uuid)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  project_name text,
  requested_at timestamptz,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mr.id,
    mr.project_id,
    p.name as project_name,
    mr.created_at as requested_at,
    mr.status
  FROM mentor_requests mr
  JOIN projects p ON p.id = mr.project_id
  WHERE mr.mentor_id = mentor_uuid AND mr.status = 'PENDING'
  ORDER BY mr.created_at DESC;
END;
$$;

-- 9. Get Project Mentor Requests
CREATE OR REPLACE FUNCTION get_project_mentor_requests(project_uuid uuid)
RETURNS TABLE (
  id uuid,
  mentor_id uuid,
  mentor_name text,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mr.id,
    mr.mentor_id,
    u.name as mentor_name,
    mr.status,
    mr.created_at
  FROM mentor_requests mr
  JOIN users u ON u.id = mr.mentor_id
  WHERE mr.project_id = project_uuid
  ORDER BY mr.created_at DESC;
END;
$$;

-- 10. Accept Mentor Request
CREATE OR REPLACE FUNCTION accept_mentor_request(request_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id uuid;
  v_mentor_id uuid;
BEGIN
  SELECT project_id, mentor_id INTO v_project_id, v_mentor_id
  FROM mentor_requests
  WHERE id = request_uuid;

  UPDATE mentor_requests SET status = 'ACCEPTED' WHERE id = request_uuid;
  
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (v_project_id, v_mentor_id, 'MENTOR')
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 11. Reject Mentor Request
CREATE OR REPLACE FUNCTION reject_mentor_request(request_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE mentor_requests SET status = 'REJECTED' WHERE id = request_uuid;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 12. Get Mentor Conversations
CREATE OR REPLACE FUNCTION get_mentor_conversations(mentor_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(conversation)
    FROM (
      SELECT DISTINCT ON (mm.project_id)
        jsonb_build_object(
          'project_id', mm.project_id,
          'project_name', p.name,
          'last_message', mm.message,
          'last_message_at', mm.created_at,
          'unread_count', (
            SELECT COUNT(*) 
            FROM mentor_messages 
            WHERE project_id = mm.project_id 
            AND is_from_mentor = false 
            AND read_at IS NULL
          )
        ) as conversation
      FROM mentor_messages mm
      JOIN projects p ON p.id = mm.project_id
      WHERE mm.mentor_id = mentor_uuid
      ORDER BY mm.project_id, mm.created_at DESC
    ) conversations
  );
END;
$$;

-- 13. Send Mentor Message
CREATE OR REPLACE FUNCTION send_mentor_message(
  p_project_id uuid,
  p_mentor_id uuid,
  p_message text,
  p_sender_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_from_mentor boolean;
BEGIN
  v_is_from_mentor := (p_sender_id = p_mentor_id);

  INSERT INTO mentor_messages (project_id, mentor_id, message, is_from_mentor, sender_id)
  VALUES (p_project_id, p_mentor_id, p_message, v_is_from_mentor, p_sender_id);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 14. Mark Mentor Messages as Read
CREATE OR REPLACE FUNCTION mark_mentor_messages_read(p_project_id uuid, p_mentor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE mentor_messages
  SET read_at = NOW()
  WHERE project_id = p_project_id 
  AND mentor_id = p_mentor_id 
  AND read_at IS NULL;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 15. Get Mentor Unread Count
CREATE OR REPLACE FUNCTION get_mentor_unread_count(mentor_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'count', (
      SELECT COUNT(*)
      FROM mentor_messages
      WHERE mentor_id = mentor_uuid
      AND is_from_mentor = false
      AND read_at IS NULL
    )
  );
END;
$$;

-- 16. Get Message Thread
CREATE OR REPLACE FUNCTION get_message_thread(thread_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', mm.id,
        'message', mm.message,
        'is_from_mentor', mm.is_from_mentor,
        'created_at', mm.created_at,
        'sender_name', u.name
      )
    )
    FROM mentor_messages mm
    JOIN users u ON u.id = mm.sender_id
    WHERE mm.project_id = thread_uuid
    ORDER BY mm.created_at ASC
  );
END;
$$;

-- ============================================================================
-- PART 4: SUBSCRIPTION/TIER FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS get_user_limits();
DROP FUNCTION IF EXISTS redeem_promo_code(TEXT);

-- 17. Get User Limits
CREATE OR REPLACE FUNCTION get_user_limits()
RETURNS jsonb AS $$
DECLARE
  user_id UUID;
  user_tier TEXT;
  user_max_projects INTEGER;
  current_project_count INTEGER;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN jsonb_build_object(
      'tier', 'FREE',
      'max_projects', 0,
      'current_projects', 0,
      'can_create', false
    );
  END IF;

  SELECT tier, max_projects INTO user_tier, user_max_projects
  FROM users WHERE id = user_id;

  SELECT COUNT(*) INTO current_project_count
  FROM project_members
  WHERE user_id = user_id AND role = 'ADMIN';

  RETURN jsonb_build_object(
    'tier', COALESCE(user_tier, 'FREE'),
    'max_projects', COALESCE(user_max_projects, 3),
    'current_projects', current_project_count,
    'can_create', (COALESCE(user_tier, 'FREE') = 'PRO' OR current_project_count < COALESCE(user_max_projects, 3))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. Redeem Promo Code
CREATE OR REPLACE FUNCTION redeem_promo_code(code_text TEXT)
RETURNS jsonb AS $$
DECLARE
  user_id UUID;
  current_tier TEXT;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Not authenticated'
    );
  END IF;

  SELECT tier INTO current_tier FROM users WHERE id = user_id;

  IF current_tier = 'PRO' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'You are already a Pro user!'
    );
  END IF;

  IF UPPER(code_text) = 'BALLI200' THEN
    UPDATE users 
    SET tier = 'PRO', max_projects = -1
    WHERE id = user_id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Congratulations! You have been upgraded to Pro!'
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid promo code'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_user_projects(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_full_detail(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_tasks(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_messages(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_notes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_files(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_mentor_projects(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_mentor_requests(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_mentor_requests(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_mentor_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_mentor_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_mentor_conversations(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION send_mentor_message(uuid, uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_mentor_messages_read(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_mentor_unread_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_message_thread(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_limits() TO authenticated;
GRANT EXECUTE ON FUNCTION redeem_promo_code(TEXT) TO authenticated;

-- ============================================================================
-- DONE! All RPC functions are now created.
-- ============================================================================
