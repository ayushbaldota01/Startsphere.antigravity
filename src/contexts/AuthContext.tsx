import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, type User } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: 'student' | 'mentor') => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[AuthContext] Error fetching profile:', error);
        return null;
      }

      return data as User;
    } catch (error) {
      console.error('[AuthContext] Error fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('[AuthContext] Initializing auth...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AuthContext] Error getting session:', error);
          throw error;
        }

        console.log('[AuthContext] Session retrieved:', session ? 'exists' : 'null');

        if (mounted) {
          setSession(session);

          if (session?.user) {
            console.log('[AuthContext] Fetching user profile...');
            const profile = await fetchUserProfile(session.user.id);
            if (mounted && profile) {
              console.log('[AuthContext] Profile loaded successfully');
              setUser(profile);
            } else if (mounted && !profile) {
              console.warn('[AuthContext] Profile not found, but session exists');
              // Keep session but set user to null - will trigger profile creation on next action
              setUser(null);
            }
          } else {
            console.log('[AuthContext] No session found');
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
      } finally {
        if (mounted) {
          console.log('[AuthContext] Auth initialization complete, setting isLoading to false');
          setIsLoading(false);
        }
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('[AuthContext] Auth state changed:', event);
      setSession(session);

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        if (mounted) {
          setUser(profile);
        }
      } else {
        if (mounted) {
          setUser(null);
        }
      }

      if (mounted) {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        setUser(profile);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, role: 'student' | 'mentor') => {
    try {
      // Step 1: Sign up the user with metadata
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
      if (!authData.user) throw new Error('User creation failed');

      // Step 2: Wait briefly for the trigger to create the profile
      // The trigger on auth.users will create the public.users row
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Fetch the complete profile
      const profile = await fetchUserProfile(authData.user.id);
      setUser(profile);
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (session?.user) {
      const profile = await fetchUserProfile(session.user.id);
      setUser(profile);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, login, register, logout, isLoading, refreshUser }}>
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

