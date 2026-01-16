import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryClient';

export interface ProjectReport {
  id: string;
  project_id: string;
  project_name: string;
  domain?: string;
  team_members?: Array<{
    name: string;
    email: string;
    role: string;
  }>;
  mentor_name?: string;
  mentor_email?: string;
  abstract?: string;
  problem_statement?: string;
  solution_approach?: string;
  objectives?: string;
  methodology?: string;
  tech_stack?: string[];
  outcomes?: string;
  file_references?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  custom_sections?: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReportData {
  project_id: string;
  project_name: string;
  domain?: string;
  team_members?: Array<{
    name: string;
    email: string;
    role: string;
  }>;
  mentor_name?: string;
  mentor_email?: string;
  abstract?: string;
  problem_statement?: string;
  solution_approach?: string;
  objectives?: string;
  methodology?: string;
  tech_stack?: string[];
  outcomes?: string;
  file_references?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  custom_sections?: Array<{
    id: string;
    title: string;
    content: string;
  }>;
}

// Fetch project report
const fetchProjectReport = async (projectId: string): Promise<ProjectReport | null> => {
  const { data, error } = await supabase
    .from('project_reports')
    .select('*')
    .eq('project_id', projectId)
    .single();

  if (error) {
    // If no report exists, return null (not an error)
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching project report:', error);
    throw error;
  }

  return data;
};

// Create project report
const createProjectReport = async (reportData: CreateReportData): Promise<ProjectReport> => {
  const { data, error } = await supabase
    .from('project_reports')
    .insert(reportData)
    .select()
    .single();

  if (error) {
    console.error('Error creating project report:', error);
    throw error;
  }

  return data;
};

// Update project report
const updateProjectReport = async (
  projectId: string,
  reportData: Partial<CreateReportData>
): Promise<ProjectReport> => {
  const { data, error } = await supabase
    .from('project_reports')
    .update(reportData)
    .eq('project_id', projectId)
    .select()
    .single();

  if (error) {
    console.error('Error updating project report:', error);
    throw error;
  }

  return data;
};

// Delete project report
const deleteProjectReport = async (projectId: string): Promise<void> => {
  const { error } = await supabase
    .from('project_reports')
    .delete()
    .eq('project_id', projectId);

  if (error) {
    console.error('Error deleting project report:', error);
    throw error;
  }
};

// Hook for managing project reports
export const useProjectReport = (projectId: string | undefined) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch report query
  const {
    data: report,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.projectReports.byProject(projectId || ''),
    queryFn: () => fetchProjectReport(projectId!),
    enabled: !!projectId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: createProjectReport,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectReports.byProject(projectId || ''),
      });
      toast({
        title: 'Report created',
        description: 'Project report has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create report.',
      });
    },
  });

  // Update report mutation
  const updateReportMutation = useMutation({
    mutationFn: (data: Partial<CreateReportData>) =>
      updateProjectReport(projectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectReports.byProject(projectId || ''),
      });
      toast({
        title: 'Report updated',
        description: 'Project report has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update report.',
      });
    },
  });

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: () => deleteProjectReport(projectId!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectReports.byProject(projectId || ''),
      });
      toast({
        title: 'Report deleted',
        description: 'Project report has been deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete report.',
      });
    },
  });

  // Helper function to prefill report from project data
  const prefillFromProject = (
    project: any,
    members: any[],
    files: any[]
  ): CreateReportData => {
    const mentors = members.filter(
      (m) => m.is_mentor || m.role === 'MENTOR' || m.user_role === 'mentor'
    );

    return {
      project_id: project.id,
      project_name: project.name,
      domain: project.domain || '',
      team_members: members
        .filter((m) => !m.is_mentor && m.role !== 'MENTOR')
        .map((m) => ({
          name: m.name,
          email: m.email,
          role: m.role || 'MEMBER',
        })),
      mentor_name: mentors[0]?.name || '',
      mentor_email: mentors[0]?.email || '',
      abstract: project.abstract || '',
      problem_statement: project.problem_statement || '',
      solution_approach: project.solution_approach || '',
      objectives: '',
      methodology: '',
      tech_stack: [],
      outcomes: '',
      file_references: files.map((f) => ({
        name: f.original_name || f.name,
        url: f.file_url || f.url,
        type: f.mime_type || f.type || 'file',
      })),
    };
  };

  // Wrapper functions
  const createReport = async (data: CreateReportData) => {
    return createReportMutation.mutateAsync(data);
  };

  const updateReport = async (data: Partial<CreateReportData>) => {
    return updateReportMutation.mutateAsync(data);
  };

  const deleteReport = async () => {
    return deleteReportMutation.mutateAsync();
  };

  return {
    report,
    isLoading,
    error,
    refetch,
    createReport,
    updateReport,
    deleteReport,
    prefillFromProject,
    createReportMutation,
    updateReportMutation,
    deleteReportMutation,
  };
};








