import { QueryClient } from '@tanstack/react-query';

// Configure React Query with optimized caching settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache data for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests 2 times with exponential backoff
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect automatically
      refetchOnReconnect: 'always',
      // Network mode
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Network mode
      networkMode: 'offlineFirst',
    },
  },
});

// Query key factories for consistent key management
export const queryKeys = {
  // User/Auth keys
  user: {
    all: ['user'] as const,
    profile: (userId: string) => ['user', 'profile', userId] as const,
  },
  
  // Project keys
  projects: {
    all: ['projects'] as const,
    list: (userId: string) => ['projects', 'list', userId] as const,
    detail: (projectId: string) => ['projects', 'detail', projectId] as const,
    members: (projectId: string) => ['projects', 'members', projectId] as const,
  },
  
  // Task keys
  tasks: {
    all: ['tasks'] as const,
    byProject: (projectId: string) => ['tasks', 'project', projectId] as const,
  },
  
  // Chat keys
  chat: {
    all: ['chat'] as const,
    messages: (projectId: string) => ['chat', 'messages', projectId] as const,
  },
  
  // Notes keys
  notes: {
    all: ['notes'] as const,
    byProject: (projectId: string) => ['notes', 'project', projectId] as const,
  },
  
  // Files keys
  files: {
    all: ['files'] as const,
    byProject: (projectId: string) => ['files', 'project', projectId] as const,
  },
  
  // Portfolio keys
  portfolio: {
    all: ['portfolio'] as const,
    byUser: (userId: string) => ['portfolio', 'user', userId] as const,
  },
};

// Helper to invalidate all project-related queries
export const invalidateProjectQueries = (projectId: string) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.projects.members(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.notes.byProject(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.files.byProject(projectId) });
};

// Helper to prefetch project detail
export const prefetchProjectDetail = async (projectId: string) => {
  // This will be called by the useProjectDetail hook's queryFn
  await queryClient.prefetchQuery({
    queryKey: queryKeys.projects.detail(projectId),
    staleTime: 60 * 1000, // Consider stale after 1 minute for prefetches
  });
};

