-- =============================================================================
-- FIX RLS POLICY FOR MENTOR MESSAGES
-- Fixes: "new row violates row-level security policy"
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Project members can view mentor messages" ON public.mentor_messages;
DROP POLICY IF EXISTS "Project members can create mentor messages" ON public.mentor_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.mentor_messages;
DROP POLICY IF EXISTS "Senders can delete own messages" ON public.mentor_messages;

-- Create simple, permissive policies

-- 1. SELECT: Project members can view messages in their projects
CREATE POLICY "Project members can view mentor messages" 
ON public.mentor_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = mentor_messages.project_id
    AND project_members.user_id = auth.uid()
  )
);

-- 2. INSERT: Project members can create messages (simplified)
CREATE POLICY "Project members can create mentor messages" 
ON public.mentor_messages FOR INSERT
WITH CHECK (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  -- User must be in the project
  AND EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = mentor_messages.project_id
    AND project_members.user_id = auth.uid()
  )
  -- User must be the sender
  AND auth.uid() = sender_id
);

-- 3. UPDATE: Users can update messages they sent or received
CREATE POLICY "Users can update mentor messages" 
ON public.mentor_messages FOR UPDATE
USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);

-- 4. DELETE: Senders can delete their own messages
CREATE POLICY "Users can delete own mentor messages" 
ON public.mentor_messages FOR DELETE
USING (
  auth.uid() = sender_id
);

-- Ensure Gojo is set up correctly
UPDATE public.users
SET role = 'mentor'
WHERE email = 'gojo@test.com' AND role != 'mentor';

-- Ensure Gojo has MENTOR role in all projects he's in
UPDATE public.project_members pm
SET role = 'MENTOR'
FROM public.users u
WHERE pm.user_id = u.id
AND u.email = 'gojo@test.com'
AND u.role = 'mentor'
AND pm.role != 'MENTOR';

-- Verification
SELECT 
  'Gojo setup' as check_type,
  u.id as user_id,
  u.email,
  u.role as user_role,
  COUNT(pm.project_id) as project_count
FROM public.users u
LEFT JOIN public.project_members pm ON pm.user_id = u.id
WHERE u.email = 'gojo@test.com'
GROUP BY u.id, u.email, u.role;

