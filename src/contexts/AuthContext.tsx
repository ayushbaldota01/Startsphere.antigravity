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

    const fetchWithRetry = async (retries = 3, delay = 1000): Promise<User | null> => {
      try {
        console.log(`[AuthContext] Fetching profile from database (attempts left: ${retries})`);

        // Create a promise that rejects after 10 seconds
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Profile fetch timeout')), 10000);
        });

        // Race the fetch against the timeout
        const { data, error } = await Promise.race([
          supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single(),
          timeoutPromise
        ]) as any;

        if (error) {
          console.error('[AuthContext] Error fetching profile:', error.message);
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(retries - 1, delay * 1.5);
          }
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
        console.error('[AuthContext] Exception fetching profile:', error);

        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(retries - 1, delay * 1.5);
        }
        return null;
      }
    };

    return fetchWithRetry();
  }, []);

  // Initialize auth
  useEffect(() => {
    let mounted = true;
    let initLock = false;

    const handleSession = async (currentSession: Session | null) => {
      if (!mounted) return;

      try {
        if (currentSession?.user) {
          setSession(currentSession);

          // Try cache first for instant load
          const cachedUser = getCachedProfile(currentSession.user.id);
          if (cachedUser) {
            console.log('[AuthContext] Using cached profile for instant load');
            setUser(cachedUser);
            setIsLoading(false); // Show UI immediately with cached data

            // Refresh in background
            setIsProfileLoading(true);
            const freshProfile = await fetchUserProfile(currentSession.user.id, false);
            if (mounted && freshProfile) {
              setUser(freshProfile);
            }
            if (mounted) setIsProfileLoading(false);
          } else {
            // No cache - blocking load
            setIsProfileLoading(true);
            const profile = await fetchUserProfile(currentSession.user.id, false);

            if (mounted) {
              if (profile) {
                setUser(profile);
              } else {
                // Session exists but profile fetch failed after retries
                console.error('[AuthContext] Critical: Session exists but profile missing');
                // Don't logout automatically to avoid loops, but maybe show error?
                // For now, keep user null so UI handles it (or shows "User")
                // But we must stop loading
              }
              setIsProfileLoading(false);
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
      }
    };

    // Initial check
    const init = async () => {
      if (initLock) return;
      initLock = true;

      console.log('[AuthContext] Initializing...');
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[AuthContext] Error getting session:', error);
        setIsLoading(false);
        return;
      }

      await handleSession(session);
    };

    init();

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state changed:', event);

      if (event === 'INITIAL_SESSION') {
        // Handled by init(), but if init() missed it or race condition, handle here?
        // Usually getSession covers this.
        return;
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        clearCachedProfile();
        setIsLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await handleSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

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
