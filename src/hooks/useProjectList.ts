import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/queryClient';
import { useEffect } from 'react';

export interface ProjectSummary {
    id: string;
    name: string;
    description?: string;
    updated_at: string;
    role: 'ADMIN' | 'MEMBER';
    memberCount: number;
    taskStats: {
        total: number;
        todo: number;
        in_progress: number;
        done: number;
    };
}

export const useProjectList = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const {
        data: projects = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: queryKeys.projects.list(user?.id || ''),
        queryFn: async () => {
            if (!user?.id) return [];

            // Improved RPC call
            const { data, error } = await supabase.rpc('get_user_projects', {
                user_uuid: user.id,
            });

            if (error) {
                console.error('RPC get_user_projects failed:', error);
                throw error;
            }

            return (data || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                updated_at: p.updated_at,
                role: p.role,
                memberCount: p.member_count,
                taskStats: p.task_stats
            }));
        },
        enabled: !!user?.id,
        staleTime: 5 * 60 * 1000,
    });

    // Realtime subscription
    useEffect(() => {
        if (!user?.id) return;

        let timeoutId: NodeJS.Timeout;
        const channel = supabase
            .channel('projects-list-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'projects',
                },
                () => {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => {
                        queryClient.invalidateQueries({
                            queryKey: queryKeys.projects.list(user.id)
                        });
                    }, 1000);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'project_members',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => {
                        queryClient.invalidateQueries({
                            queryKey: queryKeys.projects.list(user.id)
                        });
                    }, 1000);
                }
            )
            .subscribe();

        return () => {
            clearTimeout(timeoutId);
            supabase.removeChannel(channel);
        };
    }, [user?.id, queryClient]);

    return {
        projects,
        isLoading,
        error,
        refetch,
    };
};
