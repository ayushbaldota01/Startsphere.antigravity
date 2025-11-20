-- SUPABASE STORAGE BUCKET SETUP FOR FILE UPLOADS
-- Run these steps in your Supabase Dashboard

-- ============================================================================
-- STEP 1: Create Storage Bucket (via Supabase Dashboard UI)
-- ============================================================================
-- 1. Go to Storage in your Supabase Dashboard
-- 2. Click "New Bucket"
-- 3. Name: project-files
-- 4. Public: NO (keep it private)
-- 5. Click "Create Bucket"

-- ============================================================================
-- STEP 2: Set up Storage Policies (run in SQL Editor)
-- ============================================================================

-- Policy: Allow authenticated users to upload files to their projects
CREATE POLICY "Users can upload files to their projects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] IN (
    SELECT project_id::text 
    FROM project_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Allow project members to view/download files
CREATE POLICY "Project members can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] IN (
    SELECT project_id::text 
    FROM project_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Allow file uploaders to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-files' AND
  owner = auth.uid()
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After setup, you should be able to:
-- 1. Upload files from the File Shelf tab
-- 2. Download files
-- 3. Delete your own files
-- 4. See files uploaded by other team members
