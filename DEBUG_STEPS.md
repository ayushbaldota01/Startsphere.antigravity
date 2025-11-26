# Debug Steps for User Profile Issue

## Issue
When entering a project folder, the user profile doesn't load correctly:
- Sidebar shows "U" instead of user name
- Cannot send messages or add tasks
- User appears as external/unauthenticated

## Potential Causes

### 1. RLS Policy Issue
The user might not have proper access to their own profile in the `users` table when inside a project context.

### 2. AuthContext Not Refreshing
The AuthContext might not be properly maintaining the user state across route changes.

### 3. Session Token Issue
The Supabase session might be expiring or not being properly passed to requests.

## Steps to Debug

1. **Check Browser Console**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for any errors related to:
     - Supabase queries
     - RLS policy violations
     - Authentication errors

2. **Check Network Tab**
   - Open DevTools Network tab
   - Filter by "supabase"
   - Look for failed requests (red status codes)
   - Check if user profile fetch is failing

3. **Check Supabase Logs**
   - Go to Supabase Dashboard
   - Navigate to Logs section
   - Look for RLS policy errors

## Quick Fix to Try

Run this in your browser console while on the project page:

```javascript
// Check if user is authenticated
const { data: { session } } = await window.supabase.auth.getSession();
console.log('Session:', session);

// Try to fetch user profile
const { data, error } = await window.supabase
  .from('users')
  .select('*')
  .eq('id', session?.user?.id)
  .single();
console.log('User Profile:', data, 'Error:', error);
```

## Likely Solution

The issue is probably in the RLS policies. When you're viewing a project, the database might be checking project membership before allowing you to read your own user profile.

We need to ensure the "Users can view all profiles" policy is working correctly.
