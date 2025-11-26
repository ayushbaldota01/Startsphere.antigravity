import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, session, isLoading } = useAuth();

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
  // This prevents the flash of redirect while profile is loading
  if (session && !user) {
    console.log('[ProtectedRoute] Session exists but user profile loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
