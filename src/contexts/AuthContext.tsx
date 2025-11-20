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

  const fetchUserProfile = async (userId: string, retries = 3, delay = 1000): Promise<User | null> => {
    console.log(`[AuthContext] Fetching user profile for ${userId}, retries left: ${retries}`);
    try {
      console.log(`[AuthContext] About to call supabase.from('users').select...`);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase query timeout after 10s')), 10000)
      );

      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      const { data, error } = result;

      console.log(`[AuthContext] Supabase call completed. Data:`, data, 'Error:', error);

      if (error) {
        console.error(`[AuthContext] Error fetching profile:`, error);
        if (retries > 0) {
          console.log(`[AuthContext] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchUserProfile(userId, retries - 1, delay * 1.5);
        }
        throw error;
      }
      console.log(`[AuthContext] Profile fetched successfully:`, data);
      return data as User;
    } catch (error) {
      console.error('[AuthContext] Error fetching user profile:', error);
      if (retries > 0 && error instanceof Error && error.message.includes('timeout')) {
        console.log(`[AuthContext] Timeout occurred, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchUserProfile(userId, retries - 1, delay * 1.5);
      }
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted) {
          setSession(session);
          if (session?.user) {
            const profile = await fetchUserProfile(session.user.id);
            if (mounted) {
              setUser(profile);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

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

