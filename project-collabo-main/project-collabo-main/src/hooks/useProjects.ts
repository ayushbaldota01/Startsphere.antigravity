import { useState, useEffect } from 'react';
import { supabase, type Project, type ProjectMember } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ProjectWithRole extends Project {
  role: 'ADMIN' | 'MEMBER';
  memberCount?: number;
}

export const useProjects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch projects where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select(`
          role,
          project_id,
          projects (*)
        `)
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      // Get member counts for each project
      const projectsWithRole: ProjectWithRole[] = await Promise.all(
        (memberData || []).map(async (member: any) => {
          const { count } = await supabase
            .from('project_members')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', member.project_id);

          return {
            ...member.projects,
            role: member.role,
            memberCount: count || 0,
          };
        })
      );

      setProjects(projectsWithRole);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err as Error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load projects. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();

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
          fetchProjects();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_members',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createProject = async (projectData: {
    name: string;
    domain?: string;
    description?: string;
    abstract?: string;
    problem_statement?: string;
    solution_approach?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    try {
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

      // Refresh projects list
      await fetchProjects();

      toast({
        title: 'Success',
        description: 'Project created successfully!',
      });

      return project;
    } catch (err) {
      console.error('Error creating project:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create project. Please try again.',
      });
      throw err;
    }
  };

  const updateProject = async (
    projectId: string,
    updates: Partial<Project>
  ) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;

      await fetchProjects();

      toast({
        title: 'Success',
        description: 'Project updated successfully!',
      });
    } catch (err) {
      console.error('Error updating project:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update project. Please try again.',
      });
      throw err;
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      await fetchProjects();

      toast({
        title: 'Success',
        description: 'Project deleted successfully!',
      });
    } catch (err) {
      console.error('Error deleting project:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete project. Please try again.',
      });
      throw err;
    }
  };

  const getProject = async (projectId: string): Promise<ProjectWithRole | null> => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select(`
          role,
          projects (*)
        `)
        .eq('project_id', projectId)
        .eq('user_id', user?.id)
        .single();

      if (memberError) throw memberError;

      const project = memberData.projects as any;

      return {
        ...project,
        role: memberData.role,
      } as ProjectWithRole;
    } catch (err) {
      console.error('Error fetching project:', err);
      return null;
    }
  };

  const addMember = async (projectId: string, email: string, role: 'ADMIN' | 'MEMBER' = 'MEMBER') => {
    try {
      // First, find the user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'User not found with that email address.',
        });
        throw new Error('User not found');
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', userData.id)
        .single();

      if (existingMember) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'User is already a member of this project.',
        });
        throw new Error('User already a member');
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

      await fetchProjects();

      toast({
        title: 'Success',
        description: 'Member added successfully!',
      });
    } catch (err) {
      console.error('Error adding member:', err);
      if ((err as Error).message !== 'User not found' && (err as Error).message !== 'User already a member') {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to add member. Please try again.',
        });
      }
      throw err;
    }
  };

  const removeMember = async (projectId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) throw error;

      await fetchProjects();

      toast({
        title: 'Success',
        description: 'Member removed successfully!',
      });
    } catch (err) {
      console.error('Error removing member:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove member. Please try again.',
      });
      throw err;
    }
  };

  const getProjectMembers = async (projectId: string) => {
    try {
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

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error fetching project members:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load members. Please try again.',
      });
      return [];
    }
  };

  return {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    addMember,
    removeMember,
    getProjectMembers,
    refreshProjects: fetchProjects,
  };
};



