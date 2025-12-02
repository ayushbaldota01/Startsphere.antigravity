import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, type ChatMessage } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryClient';
import { useEffect, useCallback, useRef } from 'react';

export interface ChatMessageWithUser extends ChatMessage {
  user: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

// Fetch messages using RPC function
const fetchProjectMessages = async (
  projectId: string,
  userId: string
): Promise<ChatMessageWithUser[]> => {
  const { data, error } = await supabase.rpc('get_project_messages', {
    project_uuid: projectId,
    user_uuid: userId,
    message_limit: 100,
  });

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  return data || [];
};

// Fallback fetch without RPC
const fetchProjectMessagesFallback = async (
  projectId: string
): Promise<ChatMessageWithUser[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      user:users(id, name, avatar_url)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as ChatMessageWithUser[];
};

export const useChat = (projectId: string | undefined) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Main messages query
  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.chat.messages(projectId || ''),
    queryFn: async () => {
      if (!projectId || !user?.id) return [];

      try {
        return await fetchProjectMessages(projectId, user.id);
      } catch (rpcError) {
        console.warn('RPC not available, using fallback query');
        return await fetchProjectMessagesFallback(projectId);
      }
    },
    enabled: !!projectId && !!user?.id,
    staleTime: 10 * 1000, // 10 seconds - chat updates frequently
  });

  // Handle new message from realtime - add directly to cache
  const handleNewMessage = useCallback(
    async (payload: any) => {
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
        queryClient.setQueryData<ChatMessageWithUser[]>(
          queryKeys.chat.messages(projectId || ''),
          (old) => {
            // Avoid duplicates
            if (old?.some((msg) => msg.id === data.id)) {
              return old;
            }
            return [...(old || []), data as ChatMessageWithUser];
          }
        );
      }
    },
    [projectId, queryClient]
  );

  // Setup realtime subscription for new messages
  useEffect(() => {
    if (!projectId) return;

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel(`chat-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `project_id=eq.${projectId}`,
        },
        handleNewMessage
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [projectId, handleNewMessage]);

  // Send message mutation with optimistic update
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      content,
      userId,
    }: {
      content: string;
      userId: string;
    }) => {
      if (!projectId || !content.trim()) {
        throw new Error('Invalid message');
      }

      const { data, error } = await supabase
        .from('chat_messages')
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
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.chat.messages(projectId || ''),
      });

      // Snapshot previous messages
      const previousMessages = queryClient.getQueryData<ChatMessageWithUser[]>(
        queryKeys.chat.messages(projectId || '')
      );

      // Optimistically add the message
      const optimisticMessage: ChatMessageWithUser = {
        id: `temp-${Date.now()}`,
        project_id: projectId!,
        user_id: userId,
        content: content.trim(),
        created_at: new Date().toISOString(),
        user: {
          id: userId,
          name: user?.name || 'You',
          avatar_url: user?.avatar_url,
        },
      };

      queryClient.setQueryData<ChatMessageWithUser[]>(
        queryKeys.chat.messages(projectId || ''),
        (old) => [...(old || []), optimisticMessage]
      );

      return { previousMessages };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.chat.messages(projectId || ''),
          context.previousMessages
        );
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send message.',
      });
    },
    // Don't invalidate on success - realtime will add the real message
    onSettled: () => {
      // Remove optimistic message after a short delay
      // The real message should have arrived via realtime by then
      setTimeout(() => {
        queryClient.setQueryData<ChatMessageWithUser[]>(
          queryKeys.chat.messages(projectId || ''),
          (old) => old?.filter((msg) => !msg.id.startsWith('temp-'))
        );
      }, 500);
    },
  });

  // Legacy API compatibility
  const sendMessage = async (content: string, userId: string) => {
    return sendMessageMutation.mutateAsync({ content, userId });
  };

  return {
    messages,
    isLoading,
    sendMessage,
    refreshMessages: refetch,
    sendMessageMutation,
  };
};
