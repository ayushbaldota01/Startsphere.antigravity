import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryClient';
import { useEffect } from 'react';

export interface MentorRequest {
  id: string;
  project_id: string;
  mentor_id: string;
  requested_by: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  message?: string;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
    description?: string;
  };
  requester?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  mentor?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    role: string;
  };
}

// Fetch pending mentor requests using RPC
const fetchPendingMentorRequests = async (mentorId: string): Promise<MentorRequest[]> => {
  const { data, error } = await supabase.rpc('get_pending_mentor_requests', {
    mentor_uuid: mentorId,
  });

  if (error) {
    console.error('Error fetching mentor requests:', error);
    throw error;
  }

  return data || [];
};

// Fallback: Fetch pending requests without RPC
const fetchPendingMentorRequestsFallback = async (mentorId: string): Promise<MentorRequest[]> => {
  const { data, error } = await supabase
    .from('mentor_requests')
    .select(`
      *,
      project:projects(id, name, description),
      requester:users!mentor_requests_requested_by_fkey(id, name, email, avatar_url)
    `)
    .eq('mentor_id', mentorId)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as any) || [];
};

// Fetch project mentor requests (for students to see their sent requests)
const fetchProjectMentorRequests = async (projectId: string): Promise<MentorRequest[]> => {
  const { data, error } = await supabase.rpc('get_project_mentor_requests', {
    project_uuid: projectId,
  });

  if (error) {
    console.error('Error fetching project mentor requests:', error);
    throw error;
  }

  return data || [];
};

// Fallback for project mentor requests
const fetchProjectMentorRequestsFallback = async (projectId: string): Promise<MentorRequest[]> => {
  const { data, error } = await supabase
    .from('mentor_requests')
    .select(`
      *,
      mentor:users!mentor_requests_mentor_id_fkey(id, name, email, avatar_url, role)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as any) || [];
};

// Hook for mentors to view their pending requests
export const useMentorRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Main requests query
  const {
    data: requests = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.mentorRequests.pending(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        return await fetchPendingMentorRequests(user.id);
      } catch (rpcError) {
        console.warn('RPC failed, using fallback:', rpcError);
        return await fetchPendingMentorRequestsFallback(user.id);
      }
    },
    enabled: !!user?.id && user?.role === 'mentor',
    staleTime: 30 * 1000, // 30 seconds
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!user?.id || user?.role !== 'mentor') return;

    const channel = supabase
      .channel('mentor-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mentor_requests',
          filter: `mentor_id=eq.${user.id}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.role, refetch]);

  // Accept request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.rpc('accept_mentor_request', {
        request_uuid: requestId,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mentorRequests.pending(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentorProjects.list(user?.id || '') });
      toast({
        title: 'Success',
        description: 'Request accepted! You can now access the project.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to accept request.',
      });
    },
  });

  // Reject request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.rpc('reject_mentor_request', {
        request_uuid: requestId,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mentorRequests.pending(user?.id || '') });
      toast({
        title: 'Request rejected',
        description: 'The mentor request has been declined.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to reject request.',
      });
    },
  });

  const acceptRequest = async (requestId: string) => {
    return acceptRequestMutation.mutateAsync(requestId);
  };

  const rejectRequest = async (requestId: string) => {
    return rejectRequestMutation.mutateAsync(requestId);
  };

  return {
    requests,
    isLoading,
    error,
    acceptRequest,
    rejectRequest,
    refreshRequests: refetch,
    acceptRequestMutation,
    rejectRequestMutation,
  };
};

// Hook for students to manage mentor requests for their projects
export const useProjectMentorRequests = (projectId: string | undefined) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for project's mentor requests
  const {
    data: requests = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.mentorRequests.byProject(projectId || ''),
    queryFn: async () => {
      if (!projectId) return [];

      try {
        return await fetchProjectMentorRequests(projectId);
      } catch (rpcError) {
        console.warn('RPC failed, using fallback:', rpcError);
        return await fetchProjectMentorRequestsFallback(projectId);
      }
    },
    enabled: !!projectId && !!user?.id,
    staleTime: 30 * 1000,
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-mentor-requests-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mentor_requests',
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

  // Create mentor request mutation
  const createRequestMutation = useMutation({
    mutationFn: async ({
      mentorEmail,
      message,
    }: {
      mentorEmail: string;
      message?: string;
    }) => {
      if (!projectId) throw new Error('No project ID');

      // Find mentor by email
      const { data: mentorData, error: mentorError } = await supabase
        .from('users')
        .select('id, role')
        .eq('email', mentorEmail)
        .single();

      if (mentorError || !mentorData) {
        throw new Error('User not found with that email address.');
      }

      if (mentorData.role !== 'mentor') {
        throw new Error('This user is not registered as a mentor.');
      }

      // Create the request
      const { data, error } = await supabase
        .from('mentor_requests')
        .insert({
          project_id: projectId,
          mentor_id: mentorData.id,
          requested_by: user!.id,
          message,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A request has already been sent to this mentor.');
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mentorRequests.byProject(projectId || '') });
      toast({
        title: 'Success',
        description: 'Mentor request sent successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send mentor request.',
      });
    },
  });

  // Delete/cancel request mutation
  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('mentor_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mentorRequests.byProject(projectId || '') });
      toast({
        title: 'Request cancelled',
        description: 'Mentor request has been cancelled.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to cancel request.',
      });
    },
  });

  const createRequest = async (mentorEmail: string, message?: string) => {
    return createRequestMutation.mutateAsync({ mentorEmail, message });
  };

  const cancelRequest = async (requestId: string) => {
    return cancelRequestMutation.mutateAsync(requestId);
  };

  return {
    requests,
    isLoading,
    error,
    createRequest,
    cancelRequest,
    refreshRequests: refetch,
    createRequestMutation,
    cancelRequestMutation,
  };
};

