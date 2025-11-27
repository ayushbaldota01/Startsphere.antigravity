-- Team Workspace Schema Updates
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. ACTIVITY LOGS TABLE (The Pulse)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- e.g., 'FILE_UPLOAD', 'FILE_LOCK', 'CODE_PUSH', 'MEMBER_ADD'
  entity_type TEXT NOT NULL, -- e.g., 'FILE', 'REPO', 'PROJECT'
  entity_id UUID, -- Can be null if generic project action
  details JSONB DEFAULT '{}'::jsonb, -- Store extra info like filename, version, commit message
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Project members can view activity logs" ON public.activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = activity_logs.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can insert activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = activity_logs.project_id
      AND project_members.user_id = auth.uid()
    ) AND auth.uid() = user_id
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

-- Index
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON public.activity_logs(project_id);


-- ============================================================================
-- 2. PROJECT REPOSITORIES TABLE (Coding Zone)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.project_repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  repo_url TEXT NOT NULL,
  repo_type TEXT DEFAULT 'github',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id) -- One repo per project for now
);

-- Enable RLS
ALTER TABLE public.project_repositories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Project members can view repositories" ON public.project_repositories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = project_repositories.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Project admins can manage repositories" ON public.project_repositories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = project_repositories.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.role = 'ADMIN'
    )
  );

-- ============================================================================
-- 3. FILES TABLE UPDATES (Engineering Zone - Versioning & Locking)
-- ============================================================================

-- Add new columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'version') THEN
        ALTER TABLE public.files ADD COLUMN version INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'is_latest') THEN
        ALTER TABLE public.files ADD COLUMN is_latest BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'parent_id') THEN
        ALTER TABLE public.files ADD COLUMN parent_id UUID REFERENCES public.files(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'is_locked') THEN
        ALTER TABLE public.files ADD COLUMN is_locked BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'locked_by') THEN
        ALTER TABLE public.files ADD COLUMN locked_by UUID REFERENCES public.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'locked_at') THEN
        ALTER TABLE public.files ADD COLUMN locked_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Update RLS for locking (Allow update if user is member)
-- We need a policy that allows updating the lock status specifically
CREATE POLICY "Project members can update file lock status" ON public.files
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = files.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Index for versioning
CREATE INDEX IF NOT EXISTS idx_files_parent_id ON public.files(parent_id);
