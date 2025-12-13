import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, type User, setAuthStorage, clearAuthStorage } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Session storage key for caching profile
const PROFILE_CACHE_KEY = 'startsphere-profile-cache';

interface CachedProfile {
  user: User;
  timestamp: number;
}

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
        logger.debug('[AuthContext] Using cached profile');
        return cachedUser;
      }
    }

    const fetchWithRetry = async (retries = 3, delay = 1000): Promise<User | null> => {
      try {
        logger.debug(`[AuthContext] Fetching profile from database (attempts left: ${retries})`);

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
          logger.error('[AuthContext] Error fetching profile:', error.message);
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(retries - 1, delay * 1.5);
          }
          return null;
        }

        if (data) {
          // Cache the profile
          setCachedProfile(data as User);
          logger.debug('[AuthContext] Profile fetched and cached');
          return data as User;
        }

        return null;
      } catch (error: any) {
        logger.error('[AuthContext] Exception fetching profile:', error);

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

      // Prevent concurrent handling
      if (initLock) {
        logger.debug('[AuthContext] Session handling locked, skipping');
        return;
      }
      initLock = true;

      try {
        if (currentSession?.user) {
          setSession(currentSession);

          // Try cache first for instant load
          const cachedUser = getCachedProfile(currentSession.user.id);
          if (cachedUser) {
            logger.debug('[AuthContext] Using cached profile for instant load');
            setUser(cachedUser);
            setIsLoading(false);

            // Refresh in background (non-blocking)
            fetchUserProfile(currentSession.user.id, false).then(freshProfile => {
              if (mounted && freshProfile) {
                // Only update if data actually changed (avoid unnecessary re-renders)
                const cachedStr = JSON.stringify(cachedUser);
                const freshStr = JSON.stringify(freshProfile);
                if (cachedStr !== freshStr) {
                  setUser(freshProfile);
                }
              }
            }).catch(() => {
              // Silently fail background refresh - cached data is fine
            });
          } else {
            // OPTIMIZATION: Use session metadata for immediate UI rendering
            // This prevents the "delay" the user is seeing
            const metadata = currentSession.user.user_metadata;
            if (metadata && metadata.name) {
              logger.debug('[AuthContext] Hydrating from session metadata for instant load');
              const tempUser: User = {
                id: currentSession.user.id,
                email: currentSession.user.email!,
                name: metadata.name,
                role: metadata.role || 'student',
                created_at: currentSession.user.created_at,
                updated_at: currentSession.user.updated_at || new Date().toISOString(),
                // Optional fields might be missing, but that's okay for initial render
              };
              setUser(tempUser);
              setIsLoading(false); // UNBLOCK UI IMMEDIATELY

              // Fetch full profile in background (non-blocking)
              fetchUserProfile(currentSession.user.id, false).then(profile => {
                if (mounted && profile) {
                  setUser(profile);
                }
              }).catch(() => {
                // Silently fail - temp user is fine for now
              });
            } else {
              // Fallback to blocking load if no metadata (rare)
              setIsProfileLoading(true);
              const profile = await fetchUserProfile(currentSession.user.id, false);

              if (mounted) {
                if (profile) {
                  setUser(profile);
                }
                setIsProfileLoading(false);
                setIsLoading(false);
              }
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
        logger.error('[AuthContext] Error handling session:', error);
        if (mounted) setIsLoading(false);
      } finally {
        initLock = false;
      }
    };

    // Initial check
    const init = async () => {
      if (initLock) return;
      initLock = true;

      logger.debug('[AuthContext] Initializing...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('[AuthContext] Error getting session:', error);
          if (mounted) setIsLoading(false);
          return;
        }

        if (session) {
          await handleSession(session);
        } else {
          // No session found (user not logged in)
          console.log('[AuthContext] No session found, user must login');
          setSession(null);
          setUser(null);
          clearCachedProfile();
          setIsLoading(false);
        }
      } catch (err) {
        logger.error('[AuthContext] Initialization error:', err);
        if (mounted) setIsLoading(false);
      } finally {
        initLock = false;
      }
    };

    init();

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug('[AuthContext] Auth state changed:', event);

      if (!mounted) return;

      if (event === 'INITIAL_SESSION') {
        // Handled by init()
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

  const login = async (email: string, password: string, rememberMe = true) => {
    try {
      // Configure storage before sign-in based on "Remember me" selection
      clearAuthStorage();
      setAuthStorage(!rememberMe);

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
      logger.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, role: 'student' | 'mentor') => {
    try {
      logger.debug('[AuthContext] Registering user with role:', role);
      // Default new registrations to persistent sessions
      clearAuthStorage();
      setAuthStorage(false);
      
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

      logger.debug('[AuthContext] User created in auth.users, waiting for trigger...');

      // Step 2: Wait for the trigger to create the profile (increased wait time)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Fetch the complete profile (with retry and increased attempts)
      let profile: User | null = null;
      for (let i = 0; i < 5; i++) {
        logger.debug(`[AuthContext] Attempting to fetch profile, attempt ${i + 1}/5`);
        profile = await fetchUserProfile(authData.user.id, false);
        
        if (profile) {
          logger.debug('[AuthContext] Profile fetched successfully');
          
          // Verify the role matches what was requested
          if (profile.role !== role) {
            logger.warn('[AuthContext] Role mismatch! Expected:', role, 'Got:', profile.role);
          }
          
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (profile) {
        setUser(profile);
        logger.debug('[AuthContext] Navigating to dashboard');
        navigate('/dashboard');
      } else {
        logger.warn('[AuthContext] Profile not found after retries, navigating anyway');
        // Still navigate - profile will be fetched on next load
        navigate('/dashboard');
      }
    } catch (error) {
      logger.error('[AuthContext] Registration failed:', error);
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
      clearAuthStorage();

      setUser(null);
      setSession(null);
      navigate('/login');
    } catch (error) {
      logger.error('Logout failed:', error);
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

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    session,
    login,
    register,
    logout,
    isLoading,
    isProfileLoading,
    refreshUser
  }), [user, session, isLoading, isProfileLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
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
