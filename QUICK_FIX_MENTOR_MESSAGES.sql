-- =============================================================================
-- QUICK FIX FOR MENTOR MESSAGE ERROR
-- Run this in Supabase SQL Editor if you need a fast fix
-- =============================================================================

-- =============================================================================
-- THE PROBLEM:
-- When sending a message, you get: 
-- "violates foreign key constraint mentor_messages_recipient_id_fkey"
-- 
-- This means the recipient_id (Gojo's user ID) doesn't exist in users table
-- =============================================================================

-- =============================================================================
-- SOLUTION 1: Make recipient_id nullable and fix the constraint
-- =============================================================================

-- Make recipient_id nullable
ALTER TABLE public.mentor_messages 
ALTER COLUMN recipient_id DROP NOT NULL;

-- Drop the strict foreign key
ALTER TABLE public.mentor_messages
DROP CONSTRAINT IF EXISTS mentor_messages_recipient_id_fkey;

-- Recreate with lenient constraint
ALTER TABLE public.mentor_messages
ADD CONSTRAINT mentor_messages_recipient_id_fkey 
FOREIGN KEY (recipient_id) 
REFERENCES public.users(id) 
ON DELETE SET NULL;

-- =============================================================================
-- SOLUTION 2: Update the INSERT policy to be less strict
-- =============================================================================

DROP POLICY IF EXISTS "Project members can create mentor messages" ON public.mentor_messages;

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

-- =============================================================================
-- SOLUTION 3: Create a safe RPC function for sending messages
-- =============================================================================

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
BEGIN
  v_sender_id := auth.uid();
  
  -- Insert message (will use NULL if recipient doesn't exist)
  INSERT INTO public.mentor_messages (
    project_id,
    sender_id,
    recipient_id,
    message_type,
    content
  ) VALUES (
    p_project_id,
    v_sender_id,
    CASE 
      WHEN EXISTS(SELECT 1 FROM public.users WHERE id = p_recipient_id) 
      THEN p_recipient_id 
      ELSE NULL 
    END,
    COALESCE(p_message_type, 'general'),
    p_content
  )
  RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION send_mentor_message(UUID, UUID, TEXT, TEXT) TO authenticated;

-- =============================================================================
-- VERIFICATION: Check if everything is OK now
-- =============================================================================

-- 1. Check Gojo exists
SELECT 
  'Step 1: Verify Gojo exists' as step,
  id,
  email,
  name,
  role
FROM public.users
WHERE email = 'gojo@test.com';
-- If this returns nothing, Gojo doesn't exist!

-- 2. Check all mentors
SELECT 
  'Step 2: All mentors in system' as step,
  id,
  email,
  name,
  role
FROM public.users
WHERE role = 'mentor';

-- 3. Check Gojo's projects
SELECT 
  'Step 3: Gojo project memberships' as step,
  p.name as project_name,
  pm.role
FROM public.project_members pm
JOIN public.projects p ON p.id = pm.project_id
JOIN public.users u ON u.id = pm.user_id
WHERE u.email = 'gojo@test.com';

-- 4. Check the constraint
SELECT
  'Step 4: Foreign key constraint' as step,
  constraint_name,
  column_name
FROM information_schema.key_column_usage
WHERE table_name = 'mentor_messages'
  AND column_name = 'recipient_id';

-- =============================================================================
-- DONE! Try sending a message now.
-- =============================================================================

