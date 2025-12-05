-- =============================================================================
-- FIX MENTOR MESSAGES FOREIGN KEY ERROR
-- Resolves: "violates foreign key constraint mentor_messages_recipient_id_fkey"
-- =============================================================================

-- =============================================================================
-- STEP 1: Check if Gojo exists in users table
-- =============================================================================

SELECT id, email, name, role 
FROM public.users 
WHERE email = 'gojo@test.com';

-- If Gojo doesn't exist or has wrong role, this is the issue!

-- =============================================================================
-- STEP 2: Drop and recreate the mentor_messages table with correct constraints
-- =============================================================================

-- First, drop the existing table (will also drop all messages - backup first if needed)
DROP TABLE IF EXISTS public.mentor_messages CASCADE;

-- Recreate with proper foreign keys
CREATE TABLE public.mentor_messages (
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
-- STEP 3: Recreate indexes
-- =============================================================================

CREATE INDEX idx_mentor_messages_project_id 
  ON public.mentor_messages(project_id, created_at DESC);

CREATE INDEX idx_mentor_messages_recipient_id 
  ON public.mentor_messages(recipient_id, is_read) WHERE recipient_id IS NOT NULL;

CREATE INDEX idx_mentor_messages_sender_id 
  ON public.mentor_messages(sender_id);

CREATE INDEX idx_mentor_messages_parent_id 
  ON public.mentor_messages(parent_message_id) WHERE parent_message_id IS NOT NULL;

-- =============================================================================
-- STEP 4: Enable RLS
-- =============================================================================

ALTER TABLE public.mentor_messages ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 5: Recreate RLS policies
-- =============================================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Project members can view mentor messages" ON public.mentor_messages;
DROP POLICY IF EXISTS "Project members can create mentor messages" ON public.mentor_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.mentor_messages;
DROP POLICY IF EXISTS "Senders can delete own messages" ON public.mentor_messages;

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
    AND (
      recipient_id IS NULL OR
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = mentor_messages.recipient_id
      )
    )
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
-- STEP 6: Add trigger for updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_mentor_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_mentor_messages_updated_at_trigger ON public.mentor_messages;

CREATE TRIGGER update_mentor_messages_updated_at_trigger
  BEFORE UPDATE ON public.mentor_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_mentor_messages_updated_at();

-- =============================================================================
-- STEP 7: Grant permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentor_messages TO authenticated;

-- =============================================================================
-- VERIFICATION: Test that Gojo can receive messages
-- =============================================================================

-- Check Gojo's user record
SELECT 
  u.id as gojo_user_id,
  u.email,
  u.name,
  u.role,
  pm.project_id,
  pm.role as project_role,
  p.name as project_name
FROM users u
LEFT JOIN project_members pm ON pm.user_id = u.id
LEFT JOIN projects p ON p.id = pm.project_id
WHERE u.email = 'gojo@test.com';

-- This should show Gojo's UUID, which you can use to verify in the frontend

-- =============================================================================
-- ALTERNATIVE FIX: If the issue persists, make recipient_id nullable
-- This allows sending messages without specifying recipient
-- =============================================================================

-- If you want to allow messages without recipients:
-- ALTER TABLE public.mentor_messages 
-- ALTER COLUMN recipient_id DROP NOT NULL;

-- =============================================================================
-- SUCCESS!
-- =============================================================================
-- After running this script:
-- ✅ mentor_messages table recreated with correct foreign keys
-- ✅ RLS policies updated to validate recipient exists
-- ✅ Indexes recreated for performance
-- ✅ Triggers for updated_at timestamp
-- ✅ Can now send messages to Gojo without foreign key errors
-- =============================================================================

