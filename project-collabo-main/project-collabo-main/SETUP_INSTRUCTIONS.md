# Setup Instructions

## Step 1: Install Supabase Dependency

Run this command in your terminal:

```bash
cd "project-collabo-main\project-collabo-main"
npm install @supabase/supabase-js
```

## Step 2: Run Database Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the entire contents of `supabase-schema.sql` file
6. Paste it into the SQL Editor
7. Click "Run" to execute the schema

This will create all tables, RLS policies, indexes, and triggers.

## Step 3: Create Storage Bucket

1. In your Supabase Dashboard, go to "Storage" in the left sidebar
2. Click "Create a new bucket"
3. Name it: `project-files`
4. Set it to **Private** (not public)
5. Click "Create bucket"

### Add Storage Policy

After creating the bucket, add this policy:

1. Click on the `project-files` bucket
2. Go to "Policies" tab
3. Click "New Policy"
4. Use this SQL:

```sql
-- Allow project members to upload files
CREATE POLICY "Project members can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] IN (
    SELECT project_id::text FROM project_members 
    WHERE user_id = auth.uid()
  )
);

-- Allow project members to view files
CREATE POLICY "Project members can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] IN (
    SELECT project_id::text FROM project_members 
    WHERE user_id = auth.uid()
  )
);

-- Allow file uploaders to delete their files
CREATE POLICY "Users can delete their uploaded files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-files' AND
  owner = auth.uid()
);
```

## Step 4: Enable Email Auth

1. Go to "Authentication" → "Providers"
2. Make sure "Email" is enabled
3. Configure email settings if needed

## Step 5: Start Development Server

```bash
npm run dev
```

Your app should now be running at `http://localhost:8080`

## What's Been Implemented

✅ Supabase client configuration
✅ Real authentication (login/register/logout)
✅ User profile management
✅ Database schema with RLS policies
✅ Session persistence

## Next Steps

The implementation will continue with:
- Project CRUD operations
- Task management
- Real-time chat
- File uploads
- Portfolio system
- PDF reports



