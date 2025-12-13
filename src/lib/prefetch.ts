/**
 * Prefetch utilities for faster navigation
 */

import { queryClient, queryKeys } from './queryClient';
import { supabase } from './supabase';

/**
 * Prefetch project detail when user hovers over project card
 */
export const prefetchProjectDetail = async (projectId: string, userId: string) => {
  // Only prefetch if not already in cache
  const cached = queryClient.getQueryData(queryKeys.projects.detail(projectId));
  if (cached) return;

  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.projects.detail(projectId),
      queryFn: async () => {
        const { data, error } = await supabase.rpc('get_project_full_detail', {
          project_uuid: projectId,
          user_uuid: userId,
        });

        if (error) throw error;
        return data?.[0] || null;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  } catch (error) {
    // Silently fail - prefetch is optional
    console.debug('[Prefetch] Failed to prefetch project:', error);
  }
};

/**
 * Prefetch user projects on dashboard load
 */
export const prefetchUserProjects = async (userId: string) => {
  const cached = queryClient.getQueryData(queryKeys.projects.list(userId));
  if (cached) return;

  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.projects.list(userId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('*, project_members!inner(*)')
          .eq('project_members.user_id', userId)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        return data || [];
      },
      staleTime: 2 * 60 * 1000,
    });
  } catch (error) {
    console.debug('[Prefetch] Failed to prefetch projects:', error);
  }
};

