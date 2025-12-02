import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, isLoading, isProfileLoading } = useAuth();

  // Show loading spinner while checking session
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

  // No session = not authenticated
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // If session exists but user profile is missing (and not loading), we might have a data consistency issue
  // But we shouldn't block access if we have a session, just maybe show a warning or degraded state
  // The AuthContext will try to fetch the profile in the background

  // Session exists - allow access immediately
  // Profile loading happens in background and doesn't block rendering
  // Components will use cached profile or show loading states for profile-dependent content
  return (
    <>
      {isProfileLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-primary/20 z-50">
          <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }} />
        </div>
      )}
      {children}
    </>
  );
};
