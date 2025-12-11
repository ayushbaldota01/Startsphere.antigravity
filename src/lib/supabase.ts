import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Storage configuration ------------------------------------------------------
const AUTH_STORAGE_KEY = 'startsphere.auth.token';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const inMemoryStorage = (): StorageLike => {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => { store.delete(key); }
  };
};

const getBrowserStorage = (type: 'local' | 'session'): StorageLike | null => {
  if (typeof window === 'undefined') return null;
  try {
    const storage = type === 'local' ? window.localStorage : window.sessionStorage;
    const testKey = '__sb_storage_test__';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
};

const pickInitialStorage = (): StorageLike => {
  const local = getBrowserStorage('local');
  const session = getBrowserStorage('session');
  const sessionHasToken = session?.getItem(AUTH_STORAGE_KEY);
  const localHasToken = local?.getItem(AUTH_STORAGE_KEY);

  if (sessionHasToken && !localHasToken && session) return session;
  if (localHasToken && local) return local;
  if (session) return session;
  if (local) return local;
  return inMemoryStorage();
};

let selectedStorage: StorageLike = pickInitialStorage();

export const setAuthStorage = (useSessionStorage: boolean) => {
  selectedStorage =
    getBrowserStorage(useSessionStorage ? 'session' : 'local') ??
    inMemoryStorage();
};

export const clearAuthStorage = () => {
  const storages = [getBrowserStorage('local'), getBrowserStorage('session')];
  storages.forEach((store) => {
    try {
      store?.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
  });
};

const storageAdapter: StorageLike = {
  getItem: (key) => {
    try {
      return selectedStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      selectedStorage.setItem(key, value);
    } catch {
      // ignore write errors (storage full/blocked)
    }
  },
  removeItem: (key) => {
    try {
      selectedStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true, // Keep users logged in across reloads
    detectSessionInUrl: false, // Disable URL session detection
    flowType: 'pkce',
    storage: storageAdapter,
    storageKey: AUTH_STORAGE_KEY,
  },
  global: {
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        // Increase timeout to 30s for slow connections
        signal: AbortSignal.timeout(30000),
      });
    },
  },
  // Improve reliability
  db: {
    schema: 'public',
  },
});

// Types for our database
export interface User {
  id: string;
  email: string;
  name: string;
  bio?: string;
  avatar_url?: string;
  role: 'student' | 'mentor';
  university?: string;
  major?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  domain?: string;
  description?: string;
  abstract?: string;
  problem_statement?: string;
  solution_approach?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'ADMIN' | 'MEMBER';
  joined_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assignee_id?: string;
  due_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Note {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface File {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type?: string;
  uploaded_by: string;
  created_at: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  display_name: string;
  title?: string;
  bio?: string;
  location?: string;
  github_url?: string;
  linkedin_url?: string;
  website_url?: string;
  created_at: string;
  updated_at: string;
}



