-- PRODUCTION RLS POLICIES FIX (v2 - Fixed Realtime Issue)
-- Run this in Supabase SQL Editor to ensure all policies are correct

-- ============================================================================
-- 1. PROJECTS TABLE POLICIES
-- ============================================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project creators and admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Project creators and admins can delete projects" ON public.projects;

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

-- Allow authenticated users to create projects
CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Allow creators and admins to update
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

-- Allow creators and admins to delete
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

-- ============================================================================
-- 2. PROJECT_MEMBERS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Manage project members" ON public.project_members;

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

-- ============================================================================
-- 3. USERS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Allow all authenticated users to view all users (for member search)
CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- 4. TASKS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Project members can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Project members can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Project members can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Project members can delete tasks" ON public.tasks;

-- View tasks
CREATE POLICY "Project members can view tasks" ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = tasks.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Create tasks
CREATE POLICY "Project members can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = tasks.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Update tasks
CREATE POLICY "Project members can update tasks" ON public.tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = tasks.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Delete tasks
CREATE POLICY "Project members can delete tasks" ON public.tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = tasks.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. FILES TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Project members can view files" ON public.files;
DROP POLICY IF EXISTS "Project members can upload files" ON public.files;
DROP POLICY IF EXISTS "File uploader can delete" ON public.files;

-- View files
CREATE POLICY "Project members can view files" ON public.files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = files.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Upload files
CREATE POLICY "Project members can upload files" ON public.files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = files.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Delete files (only uploader)
CREATE POLICY "File uploader can delete" ON public.files
  FOR DELETE USING (auth.uid() = uploaded_by);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if policies are enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('projects', 'project_members', 'users', 'tasks', 'files');

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
