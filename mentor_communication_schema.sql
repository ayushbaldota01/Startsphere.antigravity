-- =============================================================================
-- MENTOR COMMUNICATION SYSTEM
-- Real-time messaging and notifications between students and mentors
-- =============================================================================

-- =============================================================================
-- 1. CREATE MENTOR MESSAGES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mentor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  message_type TEXT DEFAULT 'general' CHECK (message_type IN ('general', 'query', 'reminder', 'note', 'discussion')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  parent_message_id UUID REFERENCES public.mentor_messages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_mentor_messages_project_id 
  ON public.mentor_messages(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mentor_messages_recipient_id 
  ON public.mentor_messages(recipient_id, is_read) WHERE recipient_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mentor_messages_sender_id 
  ON public.mentor_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_mentor_messages_parent_id 
  ON public.mentor_messages(parent_message_id) WHERE parent_message_id IS NOT NULL;

-- =============================================================================
-- 3. ENABLE RLS
-- =============================================================================

ALTER TABLE public.mentor_messages ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 4. RLS POLICIES
-- =============================================================================

-- Project members can view messages in their projects
CREATE POLICY "Project members can view mentor messages" ON public.mentor_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = mentor_messages.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Project members can create messages
CREATE POLICY "Project members can create mentor messages" ON public.mentor_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = mentor_messages.project_id
      AND project_members.user_id = auth.uid()
    )
    AND auth.uid() = sender_id
  );

-- Users can update their own messages (mark as read, edit)
CREATE POLICY "Users can update own messages" ON public.mentor_messages
  FOR UPDATE USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

-- Senders can delete their own messages
CREATE POLICY "Senders can delete own messages" ON public.mentor_messages
  FOR DELETE USING (auth.uid() = sender_id);

-- =============================================================================
-- 5. TRIGGERS
-- =============================================================================

-- Trigger for updated_at
CREATE TRIGGER set_mentor_messages_updated_at
  BEFORE UPDATE ON public.mentor_messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 6. ENABLE REALTIME
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.mentor_messages;

-- =============================================================================
-- 7. RPC FUNCTION: Get Unread Messages Count for Mentors
-- =============================================================================

CREATE OR REPLACE FUNCTION get_mentor_unread_count(mentor_uuid UUID)
RETURNS TABLE (
  project_id UUID,
  project_name TEXT,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mm.project_id,
    p.name as project_name,
    COUNT(*)::BIGINT as unread_count
  FROM mentor_messages mm
  JOIN projects p ON p.id = mm.project_id
  WHERE mm.recipient_id = mentor_uuid
    AND mm.is_read = false
  GROUP BY mm.project_id, p.name
  ORDER BY unread_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_mentor_unread_count(UUID) TO authenticated;

-- =============================================================================
-- 8. RPC FUNCTION: Get Mentor Conversations
-- =============================================================================

CREATE OR REPLACE FUNCTION get_mentor_conversations(
  project_uuid UUID,
  user_uuid UUID
)
RETURNS JSON AS $$
DECLARE
  has_access BOOLEAN;
  user_is_mentor BOOLEAN;
BEGIN
  -- Check access
  SELECT EXISTS(
    SELECT 1 FROM project_members 
    WHERE project_id = project_uuid AND user_id = user_uuid
  ) INTO has_access;
  
  IF NOT has_access THEN
    RETURN NULL;
  END IF;

  -- Check if user is a mentor
  SELECT role = 'mentor' INTO user_is_mentor
  FROM users WHERE id = user_uuid;

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
          -- Mentors see messages directed to them or sent by them
          (user_is_mentor AND (mm.recipient_id = user_uuid OR mm.sender_id = user_uuid))
          OR
          -- Students see all messages in the project
          (NOT user_is_mentor)
        )
    ) msg
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_mentor_conversations(UUID, UUID) TO authenticated;

-- =============================================================================
-- 9. RPC FUNCTION: Mark Messages as Read
-- =============================================================================

CREATE OR REPLACE FUNCTION mark_mentor_messages_read(
  message_ids UUID[]
)
RETURNS void AS $$
BEGIN
  UPDATE mentor_messages
  SET is_read = true, updated_at = NOW()
  WHERE id = ANY(message_ids)
    AND recipient_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION mark_mentor_messages_read(UUID[]) TO authenticated;

-- =============================================================================
-- 10. RPC FUNCTION: Get Message Thread (Replies)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_message_thread(
  parent_message_uuid UUID,
  user_uuid UUID
)
RETURNS JSON AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  -- Check if user has access to the parent message's project
  SELECT EXISTS(
    SELECT 1 FROM mentor_messages mm
    JOIN project_members pm ON pm.project_id = mm.project_id
    WHERE mm.id = parent_message_uuid
      AND pm.user_id = user_uuid
  ) INTO has_access;
  
  IF NOT has_access THEN
    RETURN NULL;
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(reply) ORDER BY reply.created_at ASC), '[]'::json)
    FROM (
      SELECT 
        mm.id,
        mm.content,
        mm.created_at,
        mm.sender_id,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'avatar_url', u.avatar_url,
          'role', u.role
        ) as sender
      FROM mentor_messages mm
      JOIN users u ON u.id = mm.sender_id
      WHERE mm.parent_message_id = parent_message_uuid
    ) reply
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_message_thread(UUID, UUID) TO authenticated;

-- =============================================================================
-- 11. CREATE VIEW: Mentor Notification Summary
-- =============================================================================

CREATE OR REPLACE VIEW mentor_notification_summary AS
SELECT 
  u.id as mentor_id,
  u.name as mentor_name,
  COUNT(DISTINCT mm.project_id) as active_projects,
  COUNT(*) FILTER (WHERE mm.is_read = false) as unread_messages,
  COUNT(*) as total_messages,
  MAX(mm.created_at) as last_message_at
FROM users u
LEFT JOIN mentor_messages mm ON mm.recipient_id = u.id
WHERE u.role = 'mentor'
GROUP BY u.id, u.name;

GRANT SELECT ON mentor_notification_summary TO authenticated;

-- =============================================================================
-- DONE! Mentor communication system is ready
-- =============================================================================

