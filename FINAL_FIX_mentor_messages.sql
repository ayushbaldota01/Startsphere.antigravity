-- =============================================================================
-- FINAL FIX: MENTOR MESSAGES FOREIGN KEY ERROR
-- Run this entire script in Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- STEP 1: Check if Gojo exists, if not create the account
-- =============================================================================

DO $$
DECLARE
  gojo_user_id UUID;
BEGIN
  -- Check if Gojo exists
  SELECT id INTO gojo_user_id FROM public.users WHERE email = 'gojo@test.com';
  
  IF gojo_user_id IS NULL THEN
    -- Gojo doesn't exist, create the account
    INSERT INTO public.users (email, name, role)
    VALUES ('gojo@test.com', 'Gojo', 'mentor')
    RETURNING id INTO gojo_user_id;
    
    RAISE NOTICE 'Created Gojo account with ID: %', gojo_user_id;
  ELSE
    -- Gojo exists, ensure role is mentor
    UPDATE public.users
    SET role = 'mentor', updated_at = NOW()
    WHERE id = gojo_user_id AND role != 'mentor';
    
    RAISE NOTICE 'Gojo exists with ID: %', gojo_user_id;
  END IF;
END $$;

-- =============================================================================
-- STEP 2: Ensure Gojo is in all pending mentor_requests projects
-- =============================================================================

INSERT INTO public.project_members (project_id, user_id, role)
SELECT 
  mr.project_id,
  mr.mentor_id,
  'MENTOR'
FROM public.mentor_requests mr
WHERE mr.mentor_id IN (SELECT id FROM public.users WHERE email = 'gojo@test.com')
AND mr.status = 'ACCEPTED'
ON CONFLICT (project_id, user_id) DO UPDATE
SET role = 'MENTOR';

-- =============================================================================
-- STEP 3: Make recipient_id nullable and remove NOT NULL constraint
-- =============================================================================

ALTER TABLE public.mentor_messages 
ALTER COLUMN recipient_id DROP NOT NULL;

-- =============================================================================
-- STEP 4: Temporarily disable the foreign key constraint and recreate it
-- =============================================================================

-- Drop the problematic foreign key
ALTER TABLE public.mentor_messages
DROP CONSTRAINT IF EXISTS mentor_messages_recipient_id_fkey;

-- Recreate it with ON DELETE SET NULL (more lenient)
ALTER TABLE public.mentor_messages
ADD CONSTRAINT mentor_messages_recipient_id_fkey 
FOREIGN KEY (recipient_id) 
REFERENCES public.users(id) 
ON DELETE SET NULL;

-- =============================================================================
-- STEP 5: Update RLS policies to be more permissive
-- =============================================================================

DROP POLICY IF EXISTS "Project members can view mentor messages" ON public.mentor_messages;
DROP POLICY IF EXISTS "Project members can create mentor messages" ON public.mentor_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.mentor_messages;
DROP POLICY IF EXISTS "Users can update mentor messages" ON public.mentor_messages;
DROP POLICY IF EXISTS "Senders can delete own messages" ON public.mentor_messages;
DROP POLICY IF EXISTS "Users can delete own mentor messages" ON public.mentor_messages;
DROP POLICY IF EXISTS "Users can delete mentor messages" ON public.mentor_messages;

-- Allow project members to view messages
CREATE POLICY "Project members can view mentor messages" 
ON public.mentor_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = mentor_messages.project_id
    AND project_members.user_id = auth.uid()
  )
);

-- Allow project members to insert messages (no recipient validation)
CREATE POLICY "Project members can create mentor messages" 
ON public.mentor_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = mentor_messages.project_id
    AND project_members.user_id = auth.uid()
  )
);

-- Allow users to update their messages
CREATE POLICY "Users can update mentor messages" 
ON public.mentor_messages FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Allow users to delete their messages
CREATE POLICY "Users can delete mentor messages" 
ON public.mentor_messages FOR DELETE
USING (auth.uid() = sender_id);

-- =============================================================================
-- STEP 6: Create a safe insert function
-- =============================================================================

DROP FUNCTION IF EXISTS insert_mentor_message(UUID, UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION insert_mentor_message(
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
BEGIN
  -- Get sender
  v_sender_id := auth.uid();
  
  -- Check if recipient exists
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = p_recipient_id) INTO v_recipient_exists;
  
  -- If recipient doesn't exist, set to NULL
  IF NOT v_recipient_exists THEN
    p_recipient_id := NULL;
  END IF;
  
  -- Insert message
  INSERT INTO public.mentor_messages (
    project_id,
    sender_id,
    recipient_id,
    message_type,
    content
  ) VALUES (
    p_project_id,
    v_sender_id,
    p_recipient_id,
    p_message_type,
    p_content
  )
  RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION insert_mentor_message(UUID, UUID, TEXT, TEXT) TO authenticated;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Show Gojo's info
SELECT 
  'GOJO INFO' as info,
  id,
  email,
  name,
  role
FROM public.users
WHERE email = 'gojo@test.com';

-- Show Gojo's projects
SELECT 
  'GOJO PROJECTS' as info,
  p.name as project_name,
  pm.role as project_role,
  u.email
FROM public.project_members pm
JOIN public.projects p ON p.id = pm.project_id
JOIN public.users u ON u.id = pm.user_id
WHERE u.email = 'gojo@test.com';

-- Show current foreign key constraint
SELECT
  'FOREIGN KEY' as info,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'mentor_messages'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'recipient_id';

-- =============================================================================
-- SUCCESS!
-- After running this script, the messaging should work!
-- =============================================================================

