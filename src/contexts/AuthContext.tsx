import { createContext, useContext, useEffect, ReactNode, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, type User, setAuthStorage, clearAuthStorage } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, name: string, role: 'student' | 'mentor') => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isProfileLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Get the session
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
    staleTime: Infinity, // Rely on onAuthStateChange to invalidate
    gcTime: Infinity,
  });

  // 2. Profile Query - Dependent on Session
  const { data: user, isLoading: isProfileLoading, refetch: refetchProfile } = useQuery({
    queryKey: queryKeys.user.profile(session?.user?.id || ''),
    queryFn: async () => {
      if (!session?.user?.id) return null;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      return data as User;
    },
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Monitor Auth State Changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      logger.debug('[AuthContext] Auth state changed:', event);

      // Update session in query cache
      queryClient.setQueryData(['session'], newSession);

      if (event === 'SIGNED_OUT') {
        queryClient.removeQueries(); // Clear all data
        clearAuthStorage();
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Profile query will automatically refetch/enable due to session change
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const login = async (email: string, password: string, rememberMe = true) => {
    try {
      clearAuthStorage();
      setAuthStorage(!rememberMe);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        navigate('/dashboard');
      }
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, role: 'student' | 'mentor') => {
    try {
      logger.debug('[AuthContext] Registering user with role:', role);
      clearAuthStorage();
      setAuthStorage(false);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Poll for profile creation
        let retries = 5;
        while (retries > 0) {
          await new Promise(r => setTimeout(r, 1000));
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (profile) {
            queryClient.setQueryData(queryKeys.user.profile(authData.user.id), profile);
            break;
          }
          retries--;
        }

        navigate('/dashboard');
      }
    } catch (error) {
      logger.error('[AuthContext] Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    await refetchProfile();
  };

  const value = useMemo(() => ({
    user: user || null,
    session: session || null,
    login,
    register,
    logout,
    isLoading: isSessionLoading || (!!session && isProfileLoading),
    isProfileLoading,
    refreshUser
  }), [user, session, isSessionLoading, isProfileLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
