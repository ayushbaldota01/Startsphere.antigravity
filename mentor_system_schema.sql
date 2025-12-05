-- =============================================================================
-- MENTOR SYSTEM SCHEMA
-- Run this SQL in your Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- 1. CREATE MENTOR_REQUESTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mentor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, mentor_id)
);

-- =============================================================================
-- 2. ENABLE RLS ON MENTOR_REQUESTS
-- =============================================================================

ALTER TABLE public.mentor_requests ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. RLS POLICIES FOR MENTOR_REQUESTS
-- =============================================================================

-- Students can view requests for their projects
CREATE POLICY "Project members can view mentor requests" ON public.mentor_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = mentor_requests.project_id
      AND project_members.user_id = auth.uid()
    )
    OR auth.uid() = mentor_id
  );

-- Students can create mentor requests for their projects
CREATE POLICY "Project admins can create mentor requests" ON public.mentor_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = mentor_requests.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.role = 'ADMIN'
    )
    AND auth.uid() = requested_by
  );

-- Mentors can update their own requests (accept/reject)
CREATE POLICY "Mentors can update their requests" ON public.mentor_requests
  FOR UPDATE USING (auth.uid() = mentor_id);

-- Project admins can delete requests
CREATE POLICY "Project admins can delete requests" ON public.mentor_requests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = mentor_requests.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.role = 'ADMIN'
    )
  );

-- =============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_mentor_requests_mentor_id 
  ON public.mentor_requests(mentor_id, status);

CREATE INDEX IF NOT EXISTS idx_mentor_requests_project_id 
  ON public.mentor_requests(project_id, status);

CREATE INDEX IF NOT EXISTS idx_mentor_requests_status 
  ON public.mentor_requests(status) WHERE status = 'PENDING';

-- =============================================================================
-- 5. TRIGGER FOR UPDATED_AT
-- =============================================================================

CREATE TRIGGER set_mentor_requests_updated_at
  BEFORE UPDATE ON public.mentor_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 6. ENABLE REALTIME FOR MENTOR_REQUESTS
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.mentor_requests;

-- =============================================================================
-- 7. RPC FUNCTIONS FOR MENTOR OPERATIONS
-- =============================================================================

-- Get all projects a mentor is guiding
CREATE OR REPLACE FUNCTION get_mentor_projects(mentor_uuid UUID)
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
  WHERE pm.user_id = mentor_uuid
  ORDER BY p.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_mentor_projects(UUID) TO authenticated;

-- Get pending mentor requests for a mentor
CREATE OR REPLACE FUNCTION get_pending_mentor_requests(mentor_uuid UUID)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(r) ORDER BY r.created_at DESC), '[]'::json)
    FROM (
      SELECT 
        mr.id,
        mr.project_id,
        mr.mentor_id,
        mr.requested_by,
        mr.status,
        mr.message,
        mr.created_at,
        mr.updated_at,
        json_build_object(
          'id', p.id,
          'name', p.name,
          'description', p.description
        ) as project,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'avatar_url', u.avatar_url
        ) as requester
      FROM mentor_requests mr
      JOIN projects p ON p.id = mr.project_id
      JOIN users u ON u.id = mr.requested_by
      WHERE mr.mentor_id = mentor_uuid
      AND mr.status = 'PENDING'
    ) r
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_pending_mentor_requests(UUID) TO authenticated;

-- Accept a mentor request
CREATE OR REPLACE FUNCTION accept_mentor_request(request_uuid UUID)
RETURNS JSON AS $$
DECLARE
  request_record RECORD;
  result JSON;
BEGIN
  -- Get the request details
  SELECT * INTO request_record
  FROM mentor_requests
  WHERE id = request_uuid
  AND mentor_id = auth.uid()
  AND status = 'PENDING';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Request not found or already processed');
  END IF;

  -- Update request status
  UPDATE mentor_requests
  SET status = 'ACCEPTED', updated_at = NOW()
  WHERE id = request_uuid;

  -- Add mentor as MEMBER to the project
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (request_record.project_id, request_record.mentor_id, 'MEMBER')
  ON CONFLICT (project_id, user_id) DO NOTHING;

  result := json_build_object(
    'success', true,
    'message', 'Request accepted and added to project',
    'project_id', request_record.project_id
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION accept_mentor_request(UUID) TO authenticated;

-- Reject a mentor request
CREATE OR REPLACE FUNCTION reject_mentor_request(request_uuid UUID)
RETURNS JSON AS $$
DECLARE
  request_record RECORD;
  result JSON;
BEGIN
  -- Get the request details
  SELECT * INTO request_record
  FROM mentor_requests
  WHERE id = request_uuid
  AND mentor_id = auth.uid()
  AND status = 'PENDING';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Request not found or already processed');
  END IF;

  -- Update request status
  UPDATE mentor_requests
  SET status = 'REJECTED', updated_at = NOW()
  WHERE id = request_uuid;

  result := json_build_object(
    'success', true,
    'message', 'Request rejected',
    'project_id', request_record.project_id
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reject_mentor_request(UUID) TO authenticated;

-- Get all mentor requests for a project
CREATE OR REPLACE FUNCTION get_project_mentor_requests(project_uuid UUID)
RETURNS JSON AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  -- Check if user has access to this project
  SELECT EXISTS(
    SELECT 1 FROM project_members
    WHERE project_id = project_uuid AND user_id = auth.uid()
  ) INTO has_access;

  IF NOT has_access THEN
    RETURN NULL;
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(r) ORDER BY r.created_at DESC), '[]'::json)
    FROM (
      SELECT 
        mr.id,
        mr.mentor_id,
        mr.status,
        mr.message,
        mr.created_at,
        mr.updated_at,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'avatar_url', u.avatar_url,
          'role', u.role
        ) as mentor
      FROM mentor_requests mr
      JOIN users u ON u.id = mr.mentor_id
      WHERE mr.project_id = project_uuid
    ) r
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_project_mentor_requests(UUID) TO authenticated;

-- =============================================================================
-- DONE! Mentor system schema is ready.
-- =============================================================================

