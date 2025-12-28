import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryClient';

export const useProjectMutations = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const createProjectMutation = useMutation({
        mutationFn: async (projectData: {
            name: string;
            domain?: string;
            description?: string;
            abstract?: string;
            problem_statement?: string;
            solution_approach?: string;
        }) => {
            if (!user) throw new Error('User not authenticated');

            const { data: project, error: projectError } = await supabase
                .from('projects')
                .insert([{ ...projectData, created_by: user.id }])
                .select()
                .single();

            if (projectError) throw projectError;

            const { error: memberError } = await supabase
                .from('project_members')
                .insert([{ project_id: project.id, user_id: user.id, role: 'ADMIN' }]);

            if (memberError) throw memberError;

            return project;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.projects.list(user?.id || '') });
            toast({ title: 'Success', description: 'Project created successfully!' });
        },
        onError: (err: Error) => {
            toast({ variant: 'destructive', title: 'Error', description: err.message });
        },
    });

    const deleteProjectMutation = useMutation({
        mutationFn: async (projectId: string) => {
            const { error } = await supabase.from('projects').delete().eq('id', projectId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.projects.list(user?.id || '') });
            toast({ title: 'Success', description: 'Project deleted successfully!' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete project.' });
        },
    });

    const addMemberMutation = useMutation({
        mutationFn: async ({ projectId, email, role = 'MEMBER' }: { projectId: string; email: string; role?: 'ADMIN' | 'MEMBER' }) => {
            const { data: userData, error: userError } = await supabase
                .from('users').select('id').eq('email', email).single();

            if (userError || !userData) throw new Error('User not found.');

            const { error } = await supabase
                .from('project_members')
                .insert({ project_id: projectId, user_id: userData.id, role });

            if (error) throw error;
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(vars.projectId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.projects.list(user?.id || '') });
            toast({ title: 'Success', description: 'Member added!' });
        },
        onError: (err: Error) => {
            toast({ variant: 'destructive', title: 'Error', description: err.message });
        },
    });

    const removeMemberMutation = useMutation({
        mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
            const { error } = await supabase
                .from('project_members')
                .delete()
                .eq('project_id', projectId)
                .eq('user_id', userId);
            if (error) throw error;
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(vars.projectId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.projects.list(user?.id || '') });
            toast({ title: 'Success', description: 'Member removed!' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove member.' });
        },
    });

    return {
        createProject: createProjectMutation.mutateAsync,
        deleteProject: deleteProjectMutation.mutateAsync,
        addMember: addMemberMutation.mutateAsync,
        removeMember: removeMemberMutation.mutateAsync,
    };
};
