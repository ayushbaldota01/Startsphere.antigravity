import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryClient';
import { useEffect, useCallback } from 'react';

export interface MentorMessage {
  id: string;
  project_id: string;
  sender_id: string;
  recipient_id?: string;
  message_type: 'general' | 'query' | 'reminder' | 'note' | 'discussion';
  content: string;
  is_read: boolean;
  parent_message_id?: string;
  created_at: string;
  updated_at: string;
  sender: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    role: string;
  };
  recipient?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    role: string;
  };
  reply_count?: number;
}

// Fetch mentor conversations using RPC
const fetchMentorConversations = async (
  projectId: string,
  userId: string
): Promise<MentorMessage[]> => {
  const { data, error } = await supabase.rpc('get_mentor_conversations', {
    project_uuid: projectId,
    user_uuid: userId,
  });

  if (error) {
    console.error('Error fetching mentor conversations:', error);
    throw error;
  }

  return data || [];
};

// Fallback fetch without RPC
const fetchMentorConversationsFallback = async (
  projectId: string,
  userId: string
): Promise<MentorMessage[]> => {
  const { data, error } = await supabase
    .from('mentor_messages')
    .select(`
      *,
      sender:users!mentor_messages_sender_id_fkey(id, name, email, avatar_url, role),
      recipient:users!mentor_messages_recipient_id_fkey(id, name, email, avatar_url, role)
    `)
    .eq('project_id', projectId)
    .is('parent_message_id', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as any) || [];
};

// Hook for managing mentor messages in a project
export const useMentorMessages = (projectId: string | undefined) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Main messages query
  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.mentorMessages.byProject(projectId || ''),
    queryFn: async () => {
      if (!projectId || !user?.id) return [];

      try {
        return await fetchMentorConversations(projectId, user.id);
      } catch (rpcError) {
        console.warn('RPC failed, using fallback:', rpcError);
        return await fetchMentorConversationsFallback(projectId, user.id);
      }
    },
    enabled: !!projectId && !!user?.id,
    staleTime: 10 * 1000, // 10 seconds
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`mentor-messages-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mentor_messages',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, refetch]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      content,
      messageType,
      recipientId,
    }: {
      content: string;
      messageType?: 'general' | 'query' | 'reminder' | 'note' | 'discussion';
      recipientId?: string;
    }) => {
      if (!projectId || !user?.id || !content.trim()) {
        throw new Error('Invalid message');
      }

      if (!recipientId) {
        throw new Error('Recipient is required');
      }

      console.log('[useMentorMessages] Sending message with params:', {
        projectId,
        senderId: user.id,
        recipientId,
        messageType: messageType || 'general',
      });

      // Try using RPC function first (provides better error messages)
      try {
        const { data, error } = await supabase.rpc('send_mentor_message', {
          p_project_id: projectId,
          p_recipient_id: recipientId,
          p_message_type: messageType || 'general',
          p_content: content.trim(),
        });

        if (error) throw error;
        return data;
      } catch (rpcError: any) {
        console.warn('[useMentorMessages] RPC failed, trying direct insert:', rpcError);
        
        // Fallback to direct insert
        const { data, error } = await supabase
          .from('mentor_messages')
          .insert({
            project_id: projectId,
            sender_id: user.id,
            recipient_id: recipientId,
            content: content.trim(),
            message_type: messageType || 'general',
          })
          .select()
          .single();

        if (error) {
          console.error('[useMentorMessages] Direct insert failed:', error);
          throw new Error(`Failed to send message: ${error.message}`);
        }
        return data;
      }
    },
    onSuccess: () => {
      refetch();
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send message.',
      });
    },
  });

  // Reply to message mutation
  const replyToMessageMutation = useMutation({
    mutationFn: async ({
      parentMessageId,
      content,
    }: {
      parentMessageId: string;
      content: string;
    }) => {
      if (!projectId || !user?.id || !content.trim()) {
        throw new Error('Invalid reply');
      }

      const { data, error } = await supabase
        .from('mentor_messages')
        .insert({
          project_id: projectId,
          sender_id: user.id,
          parent_message_id: parentMessageId,
          content: content.trim(),
          message_type: 'discussion',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetch();
      toast({
        title: 'Reply sent',
        description: 'Your reply has been sent.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send reply.',
      });
    },
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageIds: string[]) => {
      const { error } = await supabase.rpc('mark_mentor_messages_read', {
        message_ids: messageIds,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
    },
  });

  const sendMessage = async (
    content: string,
    options?: {
      messageType?: 'general' | 'query' | 'reminder' | 'note' | 'discussion';
      recipientId?: string;
    }
  ) => {
    return sendMessageMutation.mutateAsync({
      content,
      messageType: options?.messageType,
      recipientId: options?.recipientId,
    });
  };

  const replyToMessage = async (parentMessageId: string, content: string) => {
    return replyToMessageMutation.mutateAsync({ parentMessageId, content });
  };

  const markAsRead = async (messageIds: string[]) => {
    return markAsReadMutation.mutateAsync(messageIds);
  };

  // Filter messages for mentors (only show messages to/from them)
  const filteredMessages = user?.role === 'mentor'
    ? messages.filter(
        (msg) =>
          msg.recipient_id === user.id ||
          msg.sender_id === user.id
      )
    : messages;

  // Count unread messages for current user
  const unreadCount = filteredMessages.filter(
    (msg) => !msg.is_read && msg.recipient_id === user?.id
  ).length;

  return {
    messages: filteredMessages,
    unreadCount,
    isLoading,
    error,
    sendMessage,
    replyToMessage,
    markAsRead,
    refreshMessages: refetch,
    sendMessageMutation,
    replyToMessageMutation,
  };
};

// Hook for getting unread count across all projects (for mentors)
export const useMentorUnreadCount = () => {
  const { user } = useAuth();

  const { data: unreadByProject = [], isLoading } = useQuery({
    queryKey: queryKeys.mentorMessages.unreadCount(user?.id || ''),
    queryFn: async () => {
      if (!user?.id || user?.role !== 'mentor') return [];

      const { data, error } = await supabase.rpc('get_mentor_unread_count', {
        mentor_uuid: user.id,
      });

      if (error) {
        console.error('Error fetching unread count:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id && user?.role === 'mentor',
    staleTime: 30 * 1000,
  });

  const totalUnread = unreadByProject.reduce(
    (sum, project) => sum + (project.unread_count || 0),
    0
  );

  return {
    unreadByProject,
    totalUnread,
    isLoading,
  };
};

// Hook for fetching message thread (replies)
export const useMessageThread = (parentMessageId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.mentorMessages.thread(parentMessageId || ''),
    queryFn: async () => {
      if (!parentMessageId || !user?.id) return [];

      const { data, error } = await supabase.rpc('get_message_thread', {
        parent_message_uuid: parentMessageId,
        user_uuid: user.id,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!parentMessageId && !!user?.id,
    staleTime: 10 * 1000,
  });
};

