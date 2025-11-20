import { useState, useEffect } from 'react';
import { supabase, type Note } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface NoteWithUser extends Note {
  user: {
    id: string;
    name: string;
  };
}

export const useNotes = (projectId: string | undefined) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<NoteWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotes = async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          user:users(id, name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data as NoteWithUser[]);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load notes.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();

    // Subscribe to realtime changes
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
          fetchNotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const addNote = async (content: string, userId: string) => {
    if (!projectId || !content.trim()) return;

    try {
      const { error } = await supabase.from('notes').insert([
        {
          project_id: projectId,
          user_id: userId,
          content: content.trim(),
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note added successfully!',
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add note.',
      });
      throw error;
    }
  };

  const updateNote = async (noteId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ content: content.trim() })
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note updated successfully!',
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update note.',
      });
      throw error;
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase.from('notes').delete().eq('id', noteId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete note.',
      });
      throw error;
    }
  };

  return {
    notes,
    isLoading,
    addNote,
    updateNote,
    deleteNote,
    refreshNotes: fetchNotes,
  };
};



