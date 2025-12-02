import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, type Project } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryClient';
import { useEffect } from 'react';

export interface ProjectWithRole extends Project {
  role: 'ADMIN' | 'MEMBER';
  member_count?: number;
  memberCount?: number;
}

// Fetch projects using the optimized RPC function
const fetchUserProjects = async (userId: string): Promise<ProjectWithRole[]> => {
  const { data, error } = await supabase.rpc('get_user_projects', {
    user_uuid: userId,
  });

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }

  return (data || []).map((project: Project & { member_count: number }) => ({
    ...project,
    memberCount: project.member_count,
  }));
};

// Fetch single project detail using RPC
const fetchProjectDetail = async (
  projectId: string,
  userId: string
): Promise<ProjectWithRole | null> => {
  const { data, error } = await supabase.rpc('get_project_detail', {
    project_uuid: projectId,
    user_uuid: userId,
  });

  if (error) {
    console.error('Error fetching project detail:', error);
    throw error;
  }

  if (!data || !data.project) {
    return null;
  }

  return {
    ...data.project,
    role: data.user_role,
    members: data.members,
    taskStats: data.task_stats,
  } as ProjectWithRole;
};

export const useProjects = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Main projects query
  const {
    data: projects = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.projects.list(user?.id || ''),
    queryFn: () => fetchUserProjects(user!.id),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        () => {
          // Invalidate and refetch
          queryClient.invalidateQueries({
            queryKey: queryKeys.projects.list(user.id)
          });
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
          queryClient.invalidateQueries({
            queryKey: queryKeys.projects.list(user.id)
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: {
      name: string;
      domain?: string;
      description?: string;
      abstract?: string;
      problem_statement?: string;
      solution_approach?: string;
    }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([
          {
            ...projectData,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (projectError) throw projectError;

      // Add creator as admin
      const { error: memberError } = await supabase
        .from('project_members')
        .insert([
          {
            project_id: project.id,
            user_id: user.id,
            role: 'ADMIN',
          },
        ]);

      if (memberError) throw memberError;

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.list(user?.id || '')
      });
      toast({
        title: 'Success',
        description: 'Project created successfully!',
      });
    },
    onError: (err: Error) => {
      console.error('[createProject] ERROR:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to create project. Please try again.',
      });
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({
      projectId,
      updates,
    }: {
      projectId: string;
      updates: Partial<Project>;
    }) => {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.list(user?.id || '')
      });
      toast({
        title: 'Success',
        description: 'Project updated successfully!',
      });
    },
    onError: (err: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update project. Please try again.',
      });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.list(user?.id || '')
      });
      toast({
        title: 'Success',
        description: 'Project deleted successfully!',
      });
    },
    onError: (err: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete project. Please try again.',
      });
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({
      projectId,
      email,
      role = 'MEMBER',
    }: {
      projectId: string;
      email: string;
      role?: 'ADMIN' | 'MEMBER';
    }) => {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        throw new Error('User not found with that email address.');
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', userData.id)
        .single();

      if (existingMember) {
        throw new Error('User is already a member of this project.');
      }

      // Add the member
      const { error: insertError } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: userData.id,
          role,
        });

      if (insertError) throw insertError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.list(user?.id || '')
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(variables.projectId)
      });
      toast({
        title: 'Success',
        description: 'Member added successfully!',
      });
    },
    onError: (err: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to add member. Please try again.',
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({
      projectId,
      userId,
    }: {
      projectId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.list(user?.id || '')
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(variables.projectId)
      });
      toast({
        title: 'Success',
        description: 'Member removed successfully!',
      });
    },
    onError: (err: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove member. Please try again.',
      });
    },
  });

  // Legacy API compatibility functions
  const createProject = async (projectData: {
    name: string;
    domain?: string;
    description?: string;
    abstract?: string;
    problem_statement?: string;
    solution_approach?: string;
  }) => {
    return createProjectMutation.mutateAsync(projectData);
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    return updateProjectMutation.mutateAsync({ projectId, updates });
  };

  const deleteProject = async (projectId: string) => {
    return deleteProjectMutation.mutateAsync(projectId);
  };

  const getProject = async (projectId: string): Promise<ProjectWithRole | null> => {
    if (!user) return null;
    return fetchProjectDetail(projectId, user.id);
  };

  const addMember = async (
    projectId: string,
    email: string,
    role: 'ADMIN' | 'MEMBER' = 'MEMBER'
  ) => {
    return addMemberMutation.mutateAsync({ projectId, email, role });
  };

  const removeMember = async (projectId: string, userId: string) => {
    return removeMemberMutation.mutateAsync({ projectId, userId });
  };

  const getProjectMembers = async (projectId: string) => {
    const { data, error } = await supabase
      .from('project_members')
      .select(`
        id,
        role,
        joined_at,
        user_id,
        users (
          id,
          name,
          email,
          avatar_url,
          role
        )
      `)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching project members:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load members. Please try again.',
      });
      return [];
    }

    return data || [];
  };

  return {
    projects,
    isLoading,
    error: error as Error | null,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    addMember,
    removeMember,
    getProjectMembers,
    refreshProjects: refetch,
    // Expose mutations for optimistic updates
    createProjectMutation,
    updateProjectMutation,
    deleteProjectMutation,
  };
};

// Hook for fetching a single project detail
export const useProjectDetail = (projectId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.projects.detail(projectId || ''),
    queryFn: async () => {
      if (!projectId || !user?.id) return null;

      const { data, error } = await supabase.rpc('get_project_detail', {
        project_uuid: projectId,
        user_uuid: user.id,
      });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId && !!user?.id,
    staleTime: 60 * 1000, // 1 minute
  });

  // Setup realtime subscription for project detail
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-detail-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.projects.detail(projectId)
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_members',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.projects.detail(projectId)
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return {
    project: query.data?.project || null,
    members: query.data?.members || [],
    userRole: query.data?.user_role,
    taskStats: query.data?.task_stats,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
