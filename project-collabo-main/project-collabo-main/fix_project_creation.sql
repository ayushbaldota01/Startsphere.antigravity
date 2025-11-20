-- Fix Project Creation RLS Policy
-- This policy allows users to insert rows into project_members if they are the project creator
-- This solves the issue where you can't add yourself as an admin because you aren't an admin yet.

CREATE POLICY "Project creators can add themselves as admin" ON public.project_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_members.project_id
      AND projects.created_by = auth.uid()
    )
    AND auth.uid() = user_id
    AND role = 'ADMIN'
  );

-- Enable Realtime for Projects Table
-- This allows the dashboard to update immediately when a new project is created
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;

-- Enable Realtime for Files Table
-- This allows the file list to update immediately when a file is uploaded
ALTER PUBLICATION supabase_realtime ADD TABLE public.files;
