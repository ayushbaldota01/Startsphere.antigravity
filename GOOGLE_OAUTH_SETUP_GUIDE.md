# Google OAuth Authentication Setup Guide

This guide will walk you through adding Google OAuth authentication to your StartSphere application step by step.

---

## Prerequisites

- A Google account
- Access to your Supabase project dashboard
- Your application running locally or deployed

---

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. If you don't have a project, click **"Create Project"**:
   - Project name: `StartSphere` (or any name you prefer)
   - Click **"Create"**

### 1.2 Enable Google+ API

1. In the Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"Google Identity Services API"**
3. Click on it and click **"Enable"**

### 1.3 Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (unless you have a Google Workspace account)
3. Click **"Create"**
4. Fill in the required information:
   - **App name**: `StartSphere`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click **"Save and Continue"**
6. On **"Scopes"** page, click **"Save and Continue"** (default scopes are fine)
7. On **"Test users"** page (if in testing), you can add test emails or skip
8. Click **"Save and Continue"**
9. Review and click **"Back to Dashboard"**

### 1.4 Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Select **"Web application"** as the application type
4. Fill in the details:
   - **Name**: `StartSphere Web Client`
   - **Authorized JavaScript origins**:
     - For local development: `http://localhost:8080` (or your dev port)
     - For production: `https://yourdomain.com`
     - Add both if needed
   - **Authorized redirect URIs**:
     - For local development: `http://localhost:8080` (Supabase will handle the callback)
     - For production: `https://yourdomain.com`
     - **IMPORTANT**: Also add your Supabase callback URL:
       - Format: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
       - Replace `YOUR_PROJECT_REF` with your actual Supabase project reference
5. Click **"Create"**
6. **Copy and save**:
   - **Client ID** (you'll need this for Supabase)
   - **Client Secret** (you'll need this for Supabase)
   - ⚠️ **Keep these secure!**

---

## Step 2: Configure Supabase

### 2.1 Enable Google Provider in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **"Authentication"** → **"Providers"**
4. Find **"Google"** in the list
5. Toggle **"Enable Google provider"** to ON
6. Enter your credentials:
   - **Client ID (for OAuth)**: Paste your Google Client ID
   - **Client Secret (for OAuth)**: Paste your Google Client Secret
7. Click **"Save"**

### 2.2 Configure Redirect URLs

1. Still in **"Authentication"** → **"URL Configuration"**
2. Check your **"Site URL"**:
   - For local: `http://localhost:8080`
   - For production: `https://yourdomain.com`
3. Add **"Redirect URLs"** if needed:
   - `http://localhost:8080/**` (for local development)
   - `https://yourdomain.com/**` (for production)

---

## Step 3: Update Frontend Code

### 3.1 Update AuthContext to Support Google Login

You need to add a `signInWithGoogle` function to your `AuthContext.tsx`:

**File: `src/contexts/AuthContext.tsx`**

Add this function inside the `AuthProvider` component (around line 323, after the `login` function):

```typescript
const signInWithGoogle = async (rememberMe = true) => {
  try {
    // Configure storage before sign-in based on "Remember me" selection
    clearAuthStorage();
    setAuthStorage(!rememberMe);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    // Note: Navigation happens automatically via redirect
  } catch (error) {
    console.error('Google sign-in failed:', error);
    throw error;
  }
};
```

Then add it to the context interface and provider value:

**Update the interface** (around line 14):

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signInWithGoogle: (rememberMe?: boolean) => Promise<void>; // Add this line
  register: (email: string, password: string, name: string, role: 'student' | 'mentor') => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isProfileLoading: boolean;
  refreshUser: () => Promise<void>;
}
```

**Update the provider value** (around line 414):

```typescript
return (
  <AuthContext.Provider value={{
    user,
    session,
    login,
    signInWithGoogle, // Add this line
    register,
    logout,
    isLoading,
    isProfileLoading,
    refreshUser
  }}>
    {children}
  </AuthContext.Provider>
);
```

### 3.2 Handle OAuth Callback in AuthContext

The existing `useEffect` in `AuthContext.tsx` should already handle the OAuth callback via `onAuthStateChange`. However, you may need to handle the case where a Google user signs in for the first time and needs a profile created.

**Update the `handleSession` function** (around line 152) to handle Google OAuth users:

```typescript
const handleSession = async (currentSession: Session | null) => {
  if (!mounted) return;

  // Prevent concurrent handling
  if (initLock) {
    console.log('[AuthContext] Session handling locked, skipping');
    return;
  }
  initLock = true;

  try {
    if (currentSession?.user) {
      setSession(currentSession);

      // Check if this is a new OAuth user (no profile exists)
      const cachedUser = getCachedProfile(currentSession.user.id);
      if (cachedUser) {
        console.log('[AuthContext] Using cached profile for instant load');
        setUser(cachedUser);
        setIsLoading(false);

        // Refresh in background
        fetchUserProfile(currentSession.user.id, false).then(freshProfile => {
          if (mounted && freshProfile) {
            if (JSON.stringify(freshProfile) !== JSON.stringify(cachedUser)) {
              setUser(freshProfile);
            }
          }
        });
      } else {
        // Try to fetch profile
        const profile = await fetchUserProfile(currentSession.user.id, false);
        
        if (!profile) {
          // New OAuth user - create profile from metadata
          const metadata = currentSession.user.user_metadata;
          if (metadata && metadata.name) {
            // Profile will be created by database trigger, but we can create a temp user
            const tempUser: User = {
              id: currentSession.user.id,
              email: currentSession.user.email!,
              name: metadata.name || metadata.full_name || 'User',
              role: metadata.role || 'student', // Default to student
              created_at: currentSession.user.created_at,
              updated_at: currentSession.user.updated_at || new Date().toISOString(),
            };
            setUser(tempUser);
            setIsLoading(false);
            
            // Wait a moment for trigger to create profile, then fetch
            setTimeout(() => {
              fetchUserProfile(currentSession.user.id, false).then(freshProfile => {
                if (mounted && freshProfile) {
                  setUser(freshProfile);
                }
              });
            }, 1000);
          } else {
            // Fallback
            setIsProfileLoading(true);
            const fetchedProfile = await fetchUserProfile(currentSession.user.id, false);
            if (mounted) {
              if (fetchedProfile) {
                setUser(fetchedProfile);
              }
              setIsProfileLoading(false);
              setIsLoading(false);
            }
          }
        } else {
          // Existing user
          setUser(profile);
          setIsLoading(false);
        }
      }
    } else {
      // No session
      setSession(null);
      setUser(null);
      clearCachedProfile();
      setIsLoading(false);
    }
  } catch (error) {
    console.error('[AuthContext] Error handling session:', error);
    if (mounted) setIsLoading(false);
  } finally {
    initLock = false;
  }
};
```

### 3.3 Add Google Login Button to Login Page

**File: `src/pages/Login.tsx`**

Add the Google login button. Update the imports first:

```typescript
import { GraduationCap } from 'lucide-react';
// Add this import if not already present
```

Then add the Google button in the form (after the "Remember me" checkbox, before the submit button):

```typescript
<div className="flex items-center space-x-2">
  <input
    id="remember-me"
    type="checkbox"
    className="h-4 w-4 accent-primary"
    checked={rememberMe}
    onChange={(e) => setRememberMe(e.target.checked)}
  />
  <Label htmlFor="remember-me" className="font-normal">
    Remember me
  </Label>
</div>

{/* Add Google Login Button */}
<div className="relative">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
  </div>
</div>

<Button
  type="button"
  variant="outline"
  className="w-full"
  onClick={async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle(rememberMe);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Google sign-in failed',
        description: 'Please try again.',
      });
      setIsLoading(false);
    }
  }}
  disabled={isLoading}
>
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
  Continue with Google
</Button>

<Button type="submit" className="w-full" disabled={isLoading}>
  {isLoading ? 'Signing in...' : 'Sign in'}
</Button>
```

Don't forget to add `signInWithGoogle` to the destructured `useAuth()`:

```typescript
const { login, signInWithGoogle } = useAuth();
```

### 3.4 Add Google Login Button to Register Page (Optional)

You can also add Google sign-in to the register page. Follow the same pattern as above.

---

## Step 4: Database Setup for OAuth Users

### 4.1 Ensure Database Trigger Handles OAuth Users

Your database should have a trigger that automatically creates a user profile when a new user signs up via OAuth. Check if you have this trigger:

**Run this SQL in Supabase SQL Editor** (if not already present):

```sql
-- Function to handle new user creation (including OAuth users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'student'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Step 5: Testing

### 5.1 Test Local Development

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the login page: `http://localhost:8080/login`

3. Click **"Continue with Google"**

4. You should be redirected to Google's sign-in page

5. Sign in with your Google account

6. You should be redirected back to your app at `/dashboard`

7. Check that:
   - You are logged in
   - Your profile is created
   - You can access protected routes

### 5.2 Common Issues and Solutions

**Issue: "redirect_uri_mismatch" error**
- **Solution**: Make sure you added the correct redirect URI in Google Cloud Console:
  - Format: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

**Issue: User profile not created after Google sign-in**
- **Solution**: Check that the database trigger is set up correctly (Step 4.1)

**Issue: "Invalid client" error**
- **Solution**: Verify your Client ID and Client Secret in Supabase match what's in Google Cloud Console

**Issue: OAuth works but user can't access dashboard**
- **Solution**: Check that the `handleSession` function in AuthContext properly handles OAuth users

---

## Step 6: Production Deployment

### 6.1 Update Google OAuth Credentials

1. Go back to Google Cloud Console → **"Credentials"**
2. Edit your OAuth 2.0 Client ID
3. Add your production domain to:
   - **Authorized JavaScript origins**: `https://yourdomain.com`
   - **Authorized redirect URIs**: `https://yourdomain.com`

### 6.2 Update Supabase Configuration

1. In Supabase Dashboard → **"Authentication"** → **"URL Configuration"**
2. Update **"Site URL"** to your production domain
3. Add production redirect URLs if needed

### 6.3 Test Production

1. Deploy your application
2. Test Google OAuth on the production site
3. Verify everything works as expected

---

## Additional Notes

- **User Role Selection**: Currently, Google OAuth users default to "student" role. If you want users to select their role, you can:
  - Show a role selection dialog after first Google sign-in
  - Store the role preference in user metadata during OAuth flow

- **Profile Picture**: Google provides profile pictures. You can extract them from `user_metadata.avatar_url` if needed.

- **Email Verification**: Google OAuth emails are automatically verified, so you don't need to handle email verification for OAuth users.

---

## Security Best Practices

1. **Never commit** your Google Client Secret to version control
2. Keep your OAuth credentials secure in Supabase (they're stored encrypted)
3. Regularly rotate your OAuth credentials
4. Monitor OAuth usage in Google Cloud Console
5. Use HTTPS in production (required for OAuth)

---

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase logs in the Dashboard
3. Verify all URLs match exactly (no trailing slashes, correct protocol)
4. Ensure your Google OAuth consent screen is published (if going to production)

---

**Congratulations!** You've successfully set up Google OAuth authentication for your StartSphere application! 🎉

