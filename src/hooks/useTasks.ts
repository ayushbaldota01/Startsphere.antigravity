import { useState, useEffect } from 'react';
import { supabase, type Task } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

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

export const useTasks = (projectId: string | undefined) => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<TaskWithAssignee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
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
      setTasks(data as TaskWithAssignee[]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load tasks.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    // Subscribe to realtime changes
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
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const createTask = async (taskData: {
    title: string;
    description?: string;
    assignee_id?: string;
    due_date?: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  }, userId: string) => {
    if (!projectId) return;

    try {
      const { error } = await supabase.from('tasks').insert([
        {
          ...taskData,
          project_id: projectId,
          created_by: userId,
          status: taskData.status || 'TODO',
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task created successfully!',
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create task.',
      });
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task updated successfully!',
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update task.',
      });
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete task.',
      });
      throw error;
    }
  };

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks: fetchTasks,
  };
};



