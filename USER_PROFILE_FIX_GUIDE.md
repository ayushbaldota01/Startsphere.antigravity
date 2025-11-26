# User Profile Loading Issue - Fix Guide

## Problem
When entering a project folder, the user profile doesn't load correctly:
- Sidebar shows "U" instead of user name
- Cannot send messages or add tasks
- User appears as unauthenticated

## Root Cause Analysis

The issue is likely one of the following:

### 1. **RLS Policy Issue** (Most Likely)
The Row Level Security policies on the `users` table might not be properly configured to allow authenticated users to read their own profile.

### 2. **Session/Token Issue**
The Supabase session might not be persisting correctly across page navigations.

### 3. **Timing Issue**
The user profile might be loading slower than the components that need it.

## Solution Steps

### Step 1: Fix RLS Policies in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the SQL script from `fix_user_profile_access.sql`:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Recreate with proper permissions
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);
```

4. Click **Run** to execute the script

### Step 2: Verify the Fix

1. **Clear Browser Cache and Cookies**
   - Press `Ctrl + Shift + Delete`
   - Select "Cookies and other site data" and "Cached images and files"
   - Click "Clear data"

2. **Logout and Login Again**
   - Logout from the application
   - Clear local storage: Open DevTools (F12) → Application → Local Storage → Clear All
   - Login again

3. **Test the Project View**
   - Navigate to a project
   - Check if your name appears in the sidebar
   - Try sending a message in Conference Room
   - Try adding a task in Work Table

### Step 3: Debug with Browser Console

If the issue persists, open the browser console (F12) and look for:

1. **AuthContext Logs**:
   ```
   [AuthContext] Initializing auth...
   [AuthContext] Session retrieved: exists
   [AuthContext] Fetching user profile...
   [AuthContext] Profile fetched successfully: {id, name, email, role}
   ```

2. **Sidebar Logs**:
   ```
   [Sidebar] User state: {hasUser: true, userId: "...", userName: "...", userRole: "..."}
   ```

3. **Error Messages**:
   - Look for any red error messages
   - Common errors:
     - "new row violates row-level security policy"
     - "permission denied for table users"
     - "JWT expired"

### Step 4: Check Supabase Logs

1. Go to Supabase Dashboard
2. Navigate to **Logs** → **Postgres Logs**
3. Look for any RLS policy violations or permission errors
4. Filter by your user ID if needed

### Step 5: Verify Database Trigger

Make sure the user profile creation trigger is working:

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- If it doesn't exist, create it:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## What We Changed in the Code

### 1. Enhanced Logging in AuthContext
- Added detailed console logs to track user profile fetching
- Added error details logging for better debugging

### 2. Enhanced Logging in Sidebar
- Added user state logging to track when user object is null

### 3. Better Fallback UI
- Sidebar now shows "Loading..." instead of blank when user is not loaded
- Shows "User" as default role if role is not loaded

## Testing Checklist

After applying the fix, test these scenarios:

- [ ] Login and see your name in sidebar on Dashboard
- [ ] Navigate to a project and see your name in sidebar
- [ ] Send a message in Conference Room
- [ ] Add a task in Work Table
- [ ] Add a note in Scratch Pad
- [ ] Upload a file in File Shelf
- [ ] Refresh the page while in a project
- [ ] Open project in new tab directly via URL

## If Issue Persists

If the issue still occurs after following all steps:

1. **Check Environment Variables**
   - Verify `VITE_SUPABASE_URL` is correct
   - Verify `VITE_SUPABASE_ANON_KEY` is correct
   - Restart dev server after changing env vars

2. **Check Supabase Project Status**
   - Ensure your Supabase project is active
   - Check if there are any service outages

3. **Try Incognito Mode**
   - Open the app in incognito/private browsing
   - This rules out browser extension conflicts

4. **Check Network Tab**
   - Open DevTools → Network
   - Filter by "supabase"
   - Look for failed requests (red status codes)
   - Check request/response details

## Contact Support

If none of the above works, provide these details:

1. Browser console logs (all messages starting with [AuthContext] or [Sidebar])
2. Network tab screenshot showing failed requests
3. Supabase Postgres logs screenshot
4. Steps to reproduce the issue

## Quick Diagnostic Commands

Run these in the browser console while logged in:

```javascript
// Check session
const { data: { session } } = await window.supabase.auth.getSession();
console.log('Session:', session);

// Check user profile
const { data, error } = await window.supabase
  .from('users')
  .select('*')
  .eq('id', session?.user?.id)
  .single();
console.log('Profile:', data, 'Error:', error);

// Check project membership
const projectId = window.location.pathname.split('/')[2];
const { data: membership, error: memberError } = await window.supabase
  .from('project_members')
  .select('*')
  .eq('project_id', projectId)
  .eq('user_id', session?.user?.id);
console.log('Membership:', membership, 'Error:', memberError);
```

---

**Last Updated**: November 26, 2024
