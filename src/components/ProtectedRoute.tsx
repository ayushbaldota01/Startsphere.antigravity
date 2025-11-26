import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, session, isLoading } = useAuth();
  const [profileLoadTimeout, setProfileLoadTimeout] = useState(false);

  // Set a timeout for profile loading to prevent infinite loading
  useEffect(() => {
    if (session && !user && !isLoading) {
      console.log('[ProtectedRoute] Profile not loading, setting 10s timeout...');
      const timer = setTimeout(() => {
        console.warn('[ProtectedRoute] Profile load timeout - allowing access anyway');
        setProfileLoadTimeout(true);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timer);
    }
  }, [session, user, isLoading]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // CRITICAL FIX: Check session first, not user
  // Session persists in localStorage and loads immediately
  // User profile loads asynchronously and may take time
  // If we have a session, user is authenticated even if profile hasn't loaded yet
  if (!session) {
    console.log('[ProtectedRoute] No session found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If we have a session but no user profile yet, show loading
  // BUT: Allow access after timeout to prevent infinite loading
  if (session && !user && !profileLoadTimeout) {
    console.log('[ProtectedRoute] Session exists but user profile loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
          <p className="text-xs text-muted-foreground mt-2">This is taking longer than usual...</p>
        </div>
      </div>
    );
  }

  // If timeout occurred, allow access even without full profile
  // The app will handle missing user data gracefully
  if (session && !user && profileLoadTimeout) {
    console.warn('[ProtectedRoute] Allowing access despite missing profile (timeout)');
  }

  return <>{children}</>;
};
