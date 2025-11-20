import { useState, useEffect } from 'react';
import { supabase, type ChatMessage } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessageWithUser extends ChatMessage {
  user: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export const useChat = (projectId: string | undefined) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessageWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          user:users(id, name, avatar_url)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data as ChatMessageWithUser[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load chat messages.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to realtime changes
    if (!projectId) return;

    const channel = supabase
      .channel(`chat-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          // Fetch the complete message with user data
          const { data } = await supabase
            .from('chat_messages')
            .select(`
              *,
              user:users(id, name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data as ChatMessageWithUser]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const sendMessage = async (content: string, userId: string) => {
    if (!projectId || !content.trim()) return;

    try {
      const { error } = await supabase.from('chat_messages').insert([
        {
          project_id: projectId,
          user_id: userId,
          content: content.trim(),
        },
      ]);

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send message.',
      });
      throw error;
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    refreshMessages: fetchMessages,
  };
};



