-- =============================================================================
-- FIX: MENTOR CAN'T SEE MESSAGES SENT BY STUDENTS
-- Run this entire script in Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- STEP 1: Update get_mentor_conversations RPC function
-- =============================================================================

DROP FUNCTION IF EXISTS get_mentor_conversations(UUID, UUID);

CREATE OR REPLACE FUNCTION get_mentor_conversations(
  project_uuid UUID,
  user_uuid UUID
)
RETURNS JSON AS $$
DECLARE
  has_access BOOLEAN;
  user_is_mentor BOOLEAN;
  user_role_value TEXT;
BEGIN
  -- Check if user has access to this project
  SELECT EXISTS(
    SELECT 1 FROM project_members 
    WHERE project_id = project_uuid AND user_id = user_uuid
  ) INTO has_access;
  
  IF NOT has_access THEN
    RAISE EXCEPTION 'User does not have access to this project';
  END IF;

  -- Get user role
  SELECT role INTO user_role_value
  FROM users WHERE id = user_uuid;
  
  user_is_mentor := (user_role_value = 'mentor');

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(msg) ORDER BY msg.created_at DESC), '[]'::json)
    FROM (
      SELECT 
        mm.id,
        mm.project_id,
        mm.sender_id,
        mm.recipient_id,
        mm.message_type,
        mm.content,
        mm.is_read,
        mm.parent_message_id,
        mm.created_at,
        mm.updated_at,
        json_build_object(
          'id', sender.id,
          'name', sender.name,
          'email', sender.email,
          'avatar_url', sender.avatar_url,
          'role', sender.role
        ) as sender,
        CASE WHEN mm.recipient_id IS NOT NULL THEN
          json_build_object(
            'id', recipient.id,
            'name', recipient.name,
            'email', recipient.email,
            'avatar_url', recipient.avatar_url,
            'role', recipient.role
          )
        ELSE NULL END as recipient,
        (
          SELECT COUNT(*)
          FROM mentor_messages replies
          WHERE replies.parent_message_id = mm.id
        )::integer as reply_count
      FROM mentor_messages mm
      JOIN users sender ON sender.id = mm.sender_id
      LEFT JOIN users recipient ON recipient.id = mm.recipient_id
      WHERE mm.project_id = project_uuid
        AND mm.parent_message_id IS NULL
        AND (
          -- UPDATED LOGIC: More inclusive for mentors
          (user_is_mentor AND (
            -- Messages directed to this mentor
            mm.recipient_id = user_uuid 
            -- OR messages sent by this mentor
            OR mm.sender_id = user_uuid
            -- OR messages with no specific recipient (broadcast to all mentors)
            OR mm.recipient_id IS NULL
            -- OR messages from students in this project (mentor sees all)
            OR EXISTS (
              SELECT 1 FROM project_members pm
              WHERE pm.user_id = mm.sender_id
              AND pm.project_id = project_uuid
              AND pm.role != 'MENTOR'
            )
          ))
          OR
          -- Students see all messages in their projects
          (NOT user_is_mentor)
        )
    ) msg
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_mentor_conversations(UUID, UUID) TO authenticated;

-- =============================================================================
-- STEP 2: Update send_mentor_message function
-- =============================================================================

DROP FUNCTION IF EXISTS send_mentor_message(UUID, UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION send_mentor_message(
  p_project_id UUID,
  p_recipient_id UUID,
  p_message_type TEXT,
  p_content TEXT
)
RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
  v_sender_id UUID;
  v_recipient_exists BOOLEAN;
  v_sender_in_project BOOLEAN;
  v_final_recipient_id UUID;
BEGIN
  -- Get sender
  v_sender_id := auth.uid();
  
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Verify sender is in the project
  SELECT EXISTS(
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id
    AND user_id = v_sender_id
  ) INTO v_sender_in_project;
  
  IF NOT v_sender_in_project THEN
    RAISE EXCEPTION 'User is not a member of this project';
  END IF;
  
  -- Check if recipient exists
  IF p_recipient_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.users WHERE id = p_recipient_id
    ) INTO v_recipient_exists;
    
    IF v_recipient_exists THEN
      v_final_recipient_id := p_recipient_id;
    ELSE
      v_final_recipient_id := NULL;
    END IF;
  ELSE
    v_final_recipient_id := NULL;
  END IF;
  
  -- Insert message
  INSERT INTO public.mentor_messages (
    project_id,
    sender_id,
    recipient_id,
    message_type,
    content,
    is_read
  ) VALUES (
    p_project_id,
    v_sender_id,
    v_final_recipient_id,
    COALESCE(p_message_type, 'general'),
    p_content,
    false
  )
  RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION send_mentor_message(UUID, UUID, TEXT, TEXT) TO authenticated;

-- =============================================================================
-- STEP 3: Create debug function
-- =============================================================================

DROP FUNCTION IF EXISTS debug_mentor_messages(UUID);

CREATE OR REPLACE FUNCTION debug_mentor_messages(p_project_id UUID)
RETURNS TABLE (
  message_id UUID,
  sender_name TEXT,
  sender_role TEXT,
  recipient_name TEXT,
  recipient_role TEXT,
  content_preview TEXT,
  message_type TEXT,
  created_at TIMESTAMPTZ,
  recipient_id_is_null BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mm.id,
    s.name as sender_name,
    s.role as sender_role,
    COALESCE(r.name, 'NO RECIPIENT') as recipient_name,
    COALESCE(r.role, 'N/A') as recipient_role,
    LEFT(mm.content, 50) as content_preview,
    mm.message_type,
    mm.created_at,
    (mm.recipient_id IS NULL) as recipient_id_is_null
  FROM mentor_messages mm
  JOIN users s ON s.id = mm.sender_id
  LEFT JOIN users r ON r.id = mm.recipient_id
  WHERE mm.project_id = p_project_id
  ORDER BY mm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION debug_mentor_messages(UUID) TO authenticated;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check total messages
SELECT 
  'TOTAL MESSAGES' as check_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE recipient_id IS NULL) as without_recipient,
  COUNT(*) FILTER (WHERE recipient_id IS NOT NULL) as with_recipient
FROM mentor_messages;

-- Check messages by project
SELECT 
  'MESSAGES BY PROJECT' as check_name,
  p.name as project_name,
  COUNT(*) as message_count
FROM mentor_messages mm
JOIN projects p ON p.id = mm.project_id
GROUP BY p.id, p.name
ORDER BY message_count DESC
LIMIT 10;

-- Check if functions exist
SELECT 
  'FUNCTIONS CHECK' as check_name,
  routine_name,
  'EXISTS' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('send_mentor_message', 'get_mentor_conversations', 'debug_mentor_messages')
ORDER BY routine_name;

-- Summary
SELECT '==============================================';
SELECT 'MENTOR MESSAGE VISIBILITY FIX COMPLETE';
SELECT '==============================================';
SELECT 'What was fixed:';
SELECT '✅ get_mentor_conversations - mentors see all student messages';
SELECT '✅ send_mentor_message - handles NULL recipients';
SELECT '✅ debug_mentor_messages - troubleshooting tool';
SELECT '';
SELECT 'Next steps:';
SELECT '1. Refresh your app (Ctrl+Shift+R)';
SELECT '2. Log in as mentor';
SELECT '3. Open a project and check messages';
SELECT '==============================================';

