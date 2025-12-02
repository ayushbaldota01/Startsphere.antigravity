import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, type Note } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryClient';
import { useEffect } from 'react';

export interface NoteWithUser extends Note {
  user: {
    id: string;
    name: string;
  };
}

// Fetch notes using RPC function
const fetchProjectNotes = async (
  projectId: string,
  userId: string
): Promise<NoteWithUser[]> => {
  const { data, error } = await supabase.rpc('get_project_notes', {
    project_uuid: projectId,
    user_uuid: userId,
  });

  if (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }

  return data || [];
};

// Fallback fetch without RPC
const fetchProjectNotesFallback = async (
  projectId: string
): Promise<NoteWithUser[]> => {
  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      user:users(id, name)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as NoteWithUser[];
};

export const useNotes = (projectId: string | undefined) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Main notes query
  const {
    data: notes = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.notes.byProject(projectId || ''),
    queryFn: async () => {
      if (!projectId || !user?.id) return [];

      try {
        return await fetchProjectNotes(projectId, user.id);
      } catch (rpcError) {
        console.warn('RPC not available, using fallback query');
        return await fetchProjectNotesFallback(projectId);
      }
    },
    enabled: !!projectId && !!user?.id,
    staleTime: 60 * 1000, // 1 minute
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`notes-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.notes.byProject(projectId),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  // Add note mutation with optimistic update
  const addNoteMutation = useMutation({
    mutationFn: async ({
      content,
      userId,
    }: {
      content: string;
      userId: string;
    }) => {
      if (!projectId || !content.trim()) {
        throw new Error('Invalid note');
      }

      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            project_id: projectId,
            user_id: userId,
            content: content.trim(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ content, userId }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notes.byProject(projectId || ''),
      });

      const previousNotes = queryClient.getQueryData<NoteWithUser[]>(
        queryKeys.notes.byProject(projectId || '')
      );

      const optimisticNote: NoteWithUser = {
        id: `temp-${Date.now()}`,
        project_id: projectId!,
        user_id: userId,
        content: content.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: userId,
          name: user?.name || 'You',
        },
      };

      queryClient.setQueryData<NoteWithUser[]>(
        queryKeys.notes.byProject(projectId || ''),
        (old) => [optimisticNote, ...(old || [])]
      );

      return { previousNotes };
    },
    onError: (err, _, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(
          queryKeys.notes.byProject(projectId || ''),
          context.previousNotes
        );
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add note.',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notes.byProject(projectId || ''),
      });
      toast({
        title: 'Success',
        description: 'Note added successfully!',
      });
    },
  });

  // Update note mutation with optimistic update
  const updateNoteMutation = useMutation({
    mutationFn: async ({
      noteId,
      content,
    }: {
      noteId: string;
      content: string;
    }) => {
      const { error } = await supabase
        .from('notes')
        .update({ content: content.trim() })
        .eq('id', noteId);

      if (error) throw error;
    },
    onMutate: async ({ noteId, content }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notes.byProject(projectId || ''),
      });

      const previousNotes = queryClient.getQueryData<NoteWithUser[]>(
        queryKeys.notes.byProject(projectId || '')
      );

      queryClient.setQueryData<NoteWithUser[]>(
        queryKeys.notes.byProject(projectId || ''),
        (old) =>
          old?.map((note) =>
            note.id === noteId
              ? { ...note, content: content.trim(), updated_at: new Date().toISOString() }
              : note
          )
      );

      return { previousNotes };
    },
    onError: (err, _, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(
          queryKeys.notes.byProject(projectId || ''),
          context.previousNotes
        );
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update note.',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Note updated successfully!',
      });
    },
  });

  // Delete note mutation with optimistic update
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', noteId);
      if (error) throw error;
    },
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notes.byProject(projectId || ''),
      });

      const previousNotes = queryClient.getQueryData<NoteWithUser[]>(
        queryKeys.notes.byProject(projectId || '')
      );

      queryClient.setQueryData<NoteWithUser[]>(
        queryKeys.notes.byProject(projectId || ''),
        (old) => old?.filter((note) => note.id !== noteId)
      );

      return { previousNotes };
    },
    onError: (err, _, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(
          queryKeys.notes.byProject(projectId || ''),
          context.previousNotes
        );
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete note.',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Note deleted successfully!',
      });
    },
  });

  // Legacy API compatibility
  const addNote = async (content: string, userId: string) => {
    return addNoteMutation.mutateAsync({ content, userId });
  };

  const updateNote = async (noteId: string, content: string) => {
    return updateNoteMutation.mutateAsync({ noteId, content });
  };

  const deleteNote = async (noteId: string) => {
    return deleteNoteMutation.mutateAsync(noteId);
  };

  return {
    notes,
    isLoading,
    addNote,
    updateNote,
    deleteNote,
    refreshNotes: refetch,
    addNoteMutation,
    updateNoteMutation,
    deleteNoteMutation,
  };
};
