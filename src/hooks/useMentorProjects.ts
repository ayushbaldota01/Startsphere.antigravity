import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/queryClient';
import { useEffect } from 'react';
import type { ProjectWithRole } from './useProjects';

// Fetch mentor's guided projects using RPC function
const fetchMentorProjects = async (mentorId: string): Promise<ProjectWithRole[]> => {
  const { data, error } = await supabase.rpc('get_mentor_projects', {
    mentor_uuid: mentorId,
  });

  if (error) {
    console.error('Error fetching mentor projects:', error);
    throw error;
  }

  return (data || []).map((project: any) => ({
    ...project,
    memberCount: project.member_count,
  }));
};

// Fallback: Fetch mentor projects using standard query
const fetchMentorProjectsFallback = async (mentorId: string): Promise<ProjectWithRole[]> => {
  // Get project memberships where user is a mentor
  const { data: memberships, error: memberError } = await supabase
    .from('project_members')
    .select('role, project_id, projects(*)')
    .eq('user_id', mentorId);

  if (memberError) throw memberError;

  if (!memberships) return [];

  // For each project, get member count
  const projectsWithCounts = await Promise.all(
    memberships.map(async (m) => {
      const project = m.projects as any;
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

export const useMentorProjects = () => {
  const { user } = useAuth();

  // Main mentor projects query
  const {
    data: projects = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.mentorProjects.list(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        return await fetchMentorProjects(user.id);
      } catch (rpcError) {
        console.warn('RPC get_mentor_projects failed, using fallback:', rpcError);
        return await fetchMentorProjectsFallback(user.id);
      }
    },
    enabled: !!user?.id && user?.role === 'mentor',
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Setup realtime subscription for projects and project_members changes
  useEffect(() => {
    if (!user?.id || user?.role !== 'mentor') return;

    const channel = supabase
      .channel('mentor-projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        () => {
          refetch();
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
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.role, refetch]);

  return {
    projects,
    isLoading,
    error: error as Error | null,
    refreshProjects: refetch,
  };
};

