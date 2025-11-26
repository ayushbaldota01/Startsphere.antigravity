-- Fix User Profile Access Issue
-- This script ensures users can always read their own profile and other users' profiles

-- First, let's check if the policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users';

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Recreate policies with proper permissions
-- Policy 1: Allow all authenticated users to view all profiles
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT 
  TO authenticated
  USING (true);

-- Policy 2: Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Test query to ensure current user can read their own profile
-- Run this after the policies are created:
-- SELECT * FROM public.users WHERE id = auth.uid();
