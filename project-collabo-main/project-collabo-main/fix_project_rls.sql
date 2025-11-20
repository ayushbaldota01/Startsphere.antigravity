-- FIX PROJECT CREATION AND VISIBILITY
-- Run this in Supabase SQL Editor

-- 1. Fix PROJECTS Policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view projects they are members of" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Project admins can delete projects" ON public.projects;

-- Allow users to view projects they created OR are members of
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (
    auth.uid() = created_by 
    OR 
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Project creators and admins can update projects" ON public.projects
  FOR UPDATE USING (
    auth.uid() = created_by
    OR
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
      AND project_members.role = 'ADMIN'
    )
  );

CREATE POLICY "Project creators and admins can delete projects" ON public.projects
  FOR DELETE USING (
    auth.uid() = created_by
    OR
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
      AND project_members.role = 'ADMIN'
    )
  );

-- 2. Fix PROJECT_MEMBERS Policies
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view members of their projects" ON public.project_members;
DROP POLICY IF EXISTS "Project admins can add members" ON public.project_members;
DROP POLICY IF EXISTS "Project creators can add themselves as admin" ON public.project_members;
DROP POLICY IF EXISTS "Project admins can remove members" ON public.project_members;
DROP POLICY IF EXISTS "Project admins can update member roles" ON public.project_members;

-- Allow users to view members if they are in the project OR if they are the creator
CREATE POLICY "Users can view project members" ON public.project_members
  FOR SELECT USING (
    user_id = auth.uid() -- Can see own membership
    OR
    EXISTS ( -- Can see members of projects they are in
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
    )
    OR
    EXISTS ( -- Creator can see members
      SELECT 1 FROM public.projects
      WHERE projects.id = project_members.project_id
      AND projects.created_by = auth.uid()
    )
  );

-- Allow project creators to add the FIRST member (themselves) or Admins to add others
CREATE POLICY "Manage project members" ON public.project_members
  FOR ALL USING (
    -- User is the project creator
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_members.project_id
      AND projects.created_by = auth.uid()
    )
    OR
    -- User is an ADMIN member
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'ADMIN'
    )
  );
