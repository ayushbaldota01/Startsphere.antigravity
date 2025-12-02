import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, type Task } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryClient';
import { useEffect } from 'react';

export interface TaskWithAssignee extends Task {
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  created_by_user?: {
    id: string;
    name: string;
  };
}

// Fetch tasks using RPC function
const fetchProjectTasks = async (
  projectId: string,
  userId: string
): Promise<TaskWithAssignee[]> => {
  const { data, error } = await supabase.rpc('get_project_tasks', {
    project_uuid: projectId,
    user_uuid: userId,
  });

  if (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }

  return data || [];
};

// Fallback fetch without RPC (in case RPC not deployed yet)
const fetchProjectTasksFallback = async (
  projectId: string
): Promise<TaskWithAssignee[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:users!tasks_assignee_id_fkey(id, name, email),
      created_by_user:users!tasks_created_by_fkey(id, name)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as TaskWithAssignee[];
};

export const useTasks = (projectId: string | undefined) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Main tasks query
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.tasks.byProject(projectId || ''),
    queryFn: async () => {
      if (!projectId || !user?.id) return [];
      
      try {
        // Try RPC first
        return await fetchProjectTasks(projectId, user.id);
      } catch (rpcError) {
        // Fallback to regular query if RPC not available
        console.warn('RPC not available, using fallback query');
        return await fetchProjectTasksFallback(projectId);
      }
    },
    enabled: !!projectId && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`tasks-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.tasks.byProject(projectId),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  // Create task mutation with optimistic update
  const createTaskMutation = useMutation({
    mutationFn: async ({
      taskData,
      userId,
    }: {
      taskData: {
        title: string;
        description?: string;
        assignee_id?: string;
        due_date?: string;
        status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
      };
      userId: string;
    }) => {
      if (!projectId) throw new Error('No project ID');

      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            ...taskData,
            project_id: projectId,
            created_by: userId,
            status: taskData.status || 'TODO',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ taskData, userId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.tasks.byProject(projectId || ''),
      });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<TaskWithAssignee[]>(
        queryKeys.tasks.byProject(projectId || '')
      );

      // Optimistically add the new task
      const optimisticTask: TaskWithAssignee = {
        id: `temp-${Date.now()}`,
        project_id: projectId!,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || 'TODO',
        assignee_id: taskData.assignee_id,
        due_date: taskData.due_date,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<TaskWithAssignee[]>(
        queryKeys.tasks.byProject(projectId || ''),
        (old) => [optimisticTask, ...(old || [])]
      );

      return { previousTasks };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(
          queryKeys.tasks.byProject(projectId || ''),
          context.previousTasks
        );
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create task.',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.byProject(projectId || ''),
      });
      toast({
        title: 'Success',
        description: 'Task created successfully!',
      });
    },
  });

  // Update task mutation with optimistic update
  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: Partial<Task>;
    }) => {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
    },
    onMutate: async ({ taskId, updates }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.tasks.byProject(projectId || ''),
      });

      const previousTasks = queryClient.getQueryData<TaskWithAssignee[]>(
        queryKeys.tasks.byProject(projectId || '')
      );

      // Optimistically update the task
      queryClient.setQueryData<TaskWithAssignee[]>(
        queryKeys.tasks.byProject(projectId || ''),
        (old) =>
          old?.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          )
      );

      return { previousTasks };
    },
    onError: (err, _, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          queryKeys.tasks.byProject(projectId || ''),
          context.previousTasks
        );
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update task.',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Task updated successfully!',
      });
    },
  });

  // Delete task mutation with optimistic update
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.tasks.byProject(projectId || ''),
      });

      const previousTasks = queryClient.getQueryData<TaskWithAssignee[]>(
        queryKeys.tasks.byProject(projectId || '')
      );

      // Optimistically remove the task
      queryClient.setQueryData<TaskWithAssignee[]>(
        queryKeys.tasks.byProject(projectId || ''),
        (old) => old?.filter((task) => task.id !== taskId)
      );

      return { previousTasks };
    },
    onError: (err, _, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          queryKeys.tasks.byProject(projectId || ''),
          context.previousTasks
        );
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete task.',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Task deleted successfully!',
      });
    },
  });

  // Legacy API compatibility functions
  const createTask = async (
    taskData: {
      title: string;
      description?: string;
      assignee_id?: string;
      due_date?: string;
      status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
    },
    userId: string
  ) => {
    return createTaskMutation.mutateAsync({ taskData, userId });
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    return updateTaskMutation.mutateAsync({ taskId, updates });
  };

  const deleteTask = async (taskId: string) => {
    return deleteTaskMutation.mutateAsync(taskId);
  };

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks: refetch,
    // Expose mutations for direct access
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
  };
};
