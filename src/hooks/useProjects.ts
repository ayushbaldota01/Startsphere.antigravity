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
  members?: any[];
  taskStats?: {
    total: number;
    todo: number;
    in_progress: number;
    done: number;
  };
}

// Fallback: Fetch projects using standard Supabase queries
const fetchUserProjectsFallback = async (userId: string): Promise<ProjectWithRole[]> => {
  // 1. Get project memberships
  const { data: memberships, error: memberError } = await supabase
    .from('project_members')
    .select('role, project_id, projects(*)')
    .eq('user_id', userId);

  if (memberError) throw memberError;

  if (!memberships) return [];

  // 2. For each project, get member count (this is N+1 but necessary for fallback)
  const projectsWithCounts = await Promise.all(
    memberships.map(async (m) => {
      const project = m.projects as unknown as Project;
      const { count } = await supabase
        .from('project_members')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.id);

      return {
        ...project,
        role: m.role,
        memberCount: count || 0,
        member_count: count || 0,
      };
    })
  );

  return projectsWithCounts;
};

// Fetch projects using the optimized RPC function with fallback
const fetchUserProjects = async (userId: string): Promise<ProjectWithRole[]> => {
  try {
    // Use the new optimized RPC function that fetches everything needed for dashboard
    const { data, error } = await supabase.rpc('get_user_projects', {
      user_uuid: userId,
    });

    if (error) throw error;

    return (data || []).map((project: any) => ({
      ...project,
      memberCount: project.member_count,
    }));
  } catch (error) {
    console.warn('RPC get_user_projects failed, using fallback:', error);
    return fetchUserProjectsFallback(userId);
  }
};

// Fallback: Fetch project detail using standard Supabase queries
const fetchProjectDetailFallback = async (
  projectId: string,
  userId: string
): Promise<ProjectWithRole | null> => {
  // 1. Check access and get role
  const { data: membership, error: memberError } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single();

  if (memberError || !membership) return null;

  // 2. Get project details
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError || !project) return null;

  // 3. Get members
  const { data: members } = await supabase
    .from('project_members')
    .select('*, users(id, name, email, avatar_url, role)')
    .eq('project_id', projectId);

  const formattedMembers = members?.map((m: any) => ({
    id: m.users.id,
    name: m.users.name,
    email: m.users.email,
    avatar_url: m.users.avatar_url,
    role: m.role, // Project role
    joined_at: m.joined_at
  })) || [];

  // 4. Get task stats
  const { count: total } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', projectId);
  const { count: todo } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', projectId).eq('status', 'TODO');
  const { count: inProgress } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', projectId).eq('status', 'IN_PROGRESS');
  const { count: done } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', projectId).eq('status', 'DONE');

  return {
    ...project,
    role: membership.role,
    members: formattedMembers,
    taskStats: {
      total: total || 0,
      todo: todo || 0,
      in_progress: inProgress || 0,
      done: done || 0
    }
  } as unknown as ProjectWithRole;
};

// Fetch single project detail using RPC with fallback
const fetchProjectDetail = async (
  projectId: string,
  userId: string
): Promise<ProjectWithRole | null> => {
  try {
    // Use the new optimized RPC function that fetches EVERYTHING in one go
    const { data, error } = await supabase.rpc('get_project_full_detail', {
      project_uuid: projectId,
      user_uuid: userId,
    });

    if (error) {
      // If function doesn't exist yet (migration not run), fall back to old RPC
      if (error.message.includes('function get_project_full_detail') || error.code === '42883') {
        console.warn('New RPC not found, falling back to get_project_detail');
        const { data: oldData, error: oldError } = await supabase.rpc('get_project_detail', {
          project_uuid: projectId,
          user_uuid: userId,
        });

        if (oldError) throw oldError;
        if (!oldData || !oldData.project) return null;

        return {
          ...oldData.project,
          role: oldData.user_role,
          members: oldData.members,
          taskStats: oldData.task_stats,
        } as ProjectWithRole;
      }
      throw error;
    }

    if (!data || !data.project) {
      return null;
    }

    return {
      ...data.project,
      role: data.user_role,
      members: data.members,
      taskStats: data.stats ? {
        total: data.stats.task_count,
        // These might need to be calculated if not in stats
        todo: 0,
        in_progress: 0,
        done: 0
      } : undefined,
      // Store the full data for other components to use if needed
      fullData: data
    } as ProjectWithRole;
  } catch (error) {
    console.warn('RPC get_project_full_detail failed, using fallback:', error);
    return fetchProjectDetailFallback(projectId, userId);
  }
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
  // Setup realtime subscription with debouncing
  useEffect(() => {
    if (!user?.id) return;

    let timeoutId: NodeJS.Timeout;

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
          // Debounce invalidations
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            queryClient.invalidateQueries({
              queryKey: queryKeys.projects.list(user.id)
            });
          }, 1000); // Wait 1s before refetching
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

      return fetchProjectDetail(projectId, user.id);
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
    project: query.data || null,
    members: query.data?.members || [],
    userRole: query.data?.role,
    taskStats: query.data?.taskStats,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
