/**
 * Prefetch utilities for faster navigation
 */

import { queryClient, queryKeys } from './queryClient';
import { supabase } from './supabase';

/**
 * Prefetch project detail when user hovers over project card
 */
export const prefetchProjectDetail = async (projectId: string, userId: string) => {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: async () => {
      // Use the new optimized RPC function
      const { data, error } = await supabase.rpc('get_project_full_detail', {
        p_project_id: projectId, // matches SQL parameter name
        user_uuid: userId,
      });

      if (error) {
        console.error('Prefetch RPC failed:', error);
        throw error;
      }

      if (!data || data.length === 0) return null;

      const result = data[0];

      return {
        ...result.project,
        role: result.user_role,
        members: result.members,
        taskStats: {
          total: result.stats.task_count,
          todo: result.stats.todo_count,
          in_progress: result.stats.active_count,
          done: result.stats.completed_count
        }
      };
    },
    staleTime: 60 * 1000,
  });
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
