import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, type User } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

// Session storage key for caching profile
const PROFILE_CACHE_KEY = 'startsphere-profile-cache';

interface CachedProfile {
  user: User;
  timestamp: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: 'student' | 'mentor') => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isProfileLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache expiry time: 5 minutes
const CACHE_EXPIRY = 5 * 60 * 1000;

// Helper to get cached profile
const getCachedProfile = (userId: string): User | null => {
  try {
    const cached = sessionStorage.getItem(`${PROFILE_CACHE_KEY}-${userId}`);
    if (!cached) return null;

    const { user, timestamp }: CachedProfile = JSON.parse(cached);

    // Check if cache is expired
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      sessionStorage.removeItem(`${PROFILE_CACHE_KEY}-${userId}`);
      return null;
    }

    return user;
  } catch {
    return null;
  }
};

// Helper to set cached profile
const setCachedProfile = (user: User): void => {
  try {
    const cached: CachedProfile = {
      user,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(`${PROFILE_CACHE_KEY}-${user.id}`, JSON.stringify(cached));
  } catch {
    // Ignore storage errors
  }
};

// Helper to clear cached profile
const clearCachedProfile = (userId?: string): void => {
  try {
    if (userId) {
      sessionStorage.removeItem(`${PROFILE_CACHE_KEY}-${userId}`);
    } else {
      // Clear all profile caches
      Object.keys(sessionStorage)
        .filter((key) => key.startsWith(PROFILE_CACHE_KEY))
        .forEach((key) => sessionStorage.removeItem(key));
    }
  } catch {
    // Ignore storage errors
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch user profile with caching and timeout
  const fetchUserProfile = useCallback(async (userId: string, useCache = true): Promise<User | null> => {
    // Try cache first
    if (useCache) {
      const cachedUser = getCachedProfile(userId);
      if (cachedUser) {
        console.log('[AuthContext] Using cached profile');
        return cachedUser;
      }
    }

    try {
      console.log('[AuthContext] Fetching profile from database');

      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
        .abortSignal(controller.signal as any);

      clearTimeout(timeoutId);

      if (error) {
        console.error('[AuthContext] Error fetching profile:', error.message);
        return null;
      }

      if (data) {
        // Cache the profile
        setCachedProfile(data as User);
        console.log('[AuthContext] Profile fetched and cached');
        return data as User;
      }

      return null;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('[AuthContext] Profile fetch timed out');
      } else {
        console.error('[AuthContext] Exception fetching profile:', error);
      }
    }
  }, []);

  // Initialize auth
  useEffect(() => {
    let mounted = true;

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('[AuthContext] Auth state changed:', event);

      // Update session immediately
      setSession(session);

      if (event === 'SIGNED_OUT') {
        clearCachedProfile();
        setUser(null);
        setIsLoading(false);
        return;
      }

      // If we have a session and no user, or if the user ID changed, fetch profile
      if (session?.user) {
        // If we already have the correct user loaded, don't re-fetch unless it's a specific event
        if (user && user.id === session.user.id && event !== 'USER_UPDATED') {
          // We're good, just ensure loading is false
          setIsLoading(false);
          return;
        }

        // Try cache first
        const cachedUser = getCachedProfile(session.user.id);
        if (cachedUser) {
          setUser(cachedUser);
          // If we have cache, we can stop global loading immediately
          setIsLoading(false);

          // Background refresh
          setIsProfileLoading(true);
          fetchUserProfile(session.user.id, false).then((freshProfile) => {
            if (mounted) {
              if (freshProfile) setUser(freshProfile);
              setIsProfileLoading(false);
            }
          });
        } else {
          // No cache - fetch profile
          // Only block global loading if we don't have a user yet
          if (!user) setIsLoading(true);
          setIsProfileLoading(true);

          const profile = await fetchUserProfile(session.user.id, false);
          if (mounted) {
            if (profile) setUser(profile);
            setIsProfileLoading(false);
            setIsLoading(false);
          }
        }
      } else {
        // No session
        setUser(null);
        setIsLoading(false);
      }
    });

    // Safety timeout to prevent infinite loading state
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('[AuthContext] Safety timeout triggered - forcing loading to false');
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, user, isLoading]);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id, false);
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
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Fetch the complete profile (with retry)
      let profile: User | null = null;
      for (let i = 0; i < 3; i++) {
        profile = await fetchUserProfile(authData.user.id, false);
        if (profile) break;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (profile) {
        setUser(profile);
        navigate('/dashboard');
      } else {
        // Still navigate - profile will be fetched on next load
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const userId = user?.id;
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear cache
      if (userId) clearCachedProfile(userId);

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
      setIsProfileLoading(true);
      const profile = await fetchUserProfile(session.user.id, false);
      setUser(profile);
      setIsProfileLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      login,
      register,
      logout,
      isLoading,
      isProfileLoading,
      refreshUser
    }}>
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
