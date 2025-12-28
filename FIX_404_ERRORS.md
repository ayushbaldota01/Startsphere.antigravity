# 🔴 CRITICAL: Fix 404 Errors - Database Setup Required

## Root Cause Analysis

The **404 errors** you're seeing are NOT frontend issues. They occur because:

1. **Your frontend code is calling RPC functions** (like `get_project_full_detail`, `get_user_projects`, etc.)
2. **These RPC functions DON'T EXIST in your Supabase database yet**
3. When Supabase can't find the function, it returns a 404 error

This is like calling a phone number that doesn't exist - the call fails before it even connects.

## The Solution (One-Time Setup)

You need to **create all the RPC functions** in your Supabase database. I've prepared a complete SQL file that does this.

### Step-by-Step Instructions:

#### 1. Open Supabase Dashboard
- Go to https://supabase.com
- Open your project
- Click on **"SQL Editor"** in the left sidebar

#### 2. Run the Complete Setup Script
- Open the file: `COMPLETE_DATABASE_SETUP.sql`
- **Copy the ENTIRE contents** of that file
- **Paste it into the Supabase SQL Editor**
- Click **"Run"** button (or press Ctrl+Enter)

#### 3. Verify Success
- You should see a success message
- No errors should appear
- The script creates 18 RPC functions

#### 4. Refresh Your App
- Go back to your application
- **Hard refresh** your browser (Ctrl+Shift+R or Cmd+Shift+R)
- The 404 errors should be **completely gone**

## What This Script Does

The `COMPLETE_DATABASE_SETUP.sql` file creates ALL the RPC functions your app needs:

### Core Project Functions (3)
- ✅ `get_user_projects` - Fetches project list for dashboard
- ✅ `get_project_full_detail` - Fetches full project details
- ✅ `get_project_tasks` - Fetches tasks for a project

### Chat & Messaging (3)
- ✅ `get_project_messages` - Fetches chat messages
- ✅ `get_project_notes` - Fetches project notes
- ✅ `get_project_files` - Fetches project files

### Mentor Functions (10)
- ✅ `get_mentor_projects` - Lists mentor's projects
- ✅ `get_pending_mentor_requests` - Pending mentor requests
- ✅ `get_project_mentor_requests` - Project's mentor requests
- ✅ `accept_mentor_request` - Accept a mentor request
- ✅ `reject_mentor_request` - Reject a mentor request
- ✅ `get_mentor_conversations` - Mentor chat conversations
- ✅ `send_mentor_message` - Send mentor message
- ✅ `mark_mentor_messages_read` - Mark messages as read
- ✅ `get_mentor_unread_count` - Count unread messages
- ✅ `get_message_thread` - Get message thread

### Subscription/Tier Functions (2)
- ✅ `get_user_limits` - Check user's project limits
- ✅ `redeem_promo_code` - Redeem BALLI200 code

## Why This Happened

During development, we created the **frontend code** that calls these functions, but we never ran the SQL scripts to create them in the database. This is a common issue in full-stack development - the frontend and backend need to be in sync.

## After Running the Script

Once you run `COMPLETE_DATABASE_SETUP.sql`:
- ✅ All 404 errors will disappear
- ✅ Dashboard will load projects correctly
- ✅ Project details will load instantly
- ✅ Chat, files, notes will all work
- ✅ Mentor features will be functional
- ✅ Subscription system (BALLI200 code) will work

## Important Notes

- **Run this script ONLY ONCE** - Running it multiple times is safe (it drops and recreates functions)
- **No data will be lost** - This only creates functions, doesn't modify your tables
- **Instant effect** - Changes take effect immediately after running

## Still Seeing Errors?

If you still see 404 errors after running the script:
1. Check the Supabase SQL Editor for any error messages
2. Make sure you're logged into the correct Supabase project
3. Hard refresh your browser (clear cache)
4. Check browser console for the specific RPC function name that's failing

---

**TL;DR:** Run `COMPLETE_DATABASE_SETUP.sql` in Supabase SQL Editor → All 404 errors gone ✅
