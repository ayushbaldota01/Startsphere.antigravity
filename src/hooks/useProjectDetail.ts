import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/queryClient';
import { useEffect } from 'react';

export const useProjectDetail = (projectId: string | undefined) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.projects.detail(projectId || ''),
        queryFn: async () => {
            if (!projectId || !user?.id) return null;

            const { data, error } = await supabase.rpc('get_project_full_detail', {
                p_project_id: projectId, // Note: param name matches SQL function
                user_uuid: user.id,
            });

            if (error) {
                console.error('RPC get_project_full_detail failed:', error);
                throw error;
            }

            // If no data returned, it means project doesn't exist or no access
            if (!data || data.length === 0) return null;

            const result = data[0]; // RPC returns an array of rows

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
        enabled: !!projectId && !!user?.id,
        staleTime: 60 * 1000,
    });

    // Realtime
    useEffect(() => {
        if (!projectId) return;

        const channel = supabase
            .channel(`project-detail-${projectId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` },
                () => queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'project_members', filter: `project_id=eq.${projectId}` },
                () => queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId, queryClient]);

    return {
        project: query.data || null,
        members: query.data?.members || [],
        userRole: query.data?.role,
        taskStats: query.data?.taskStats,
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
};
