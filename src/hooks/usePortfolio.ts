import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, type Portfolio } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryClient';

// Enhanced types for portfolio data
export interface PortfolioSkill {
  id: string;
  category: string;
  skills: string[];
  display_order: number;
}

export interface PortfolioExperience {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
  achievements?: string[];
  is_current?: boolean;
  display_order: number;
}

export interface PortfolioEducation {
  id: string;
  degree: string;
  institution: string;
  period: string;
  gpa: string | null;
  description?: string;
  display_order: number;
}

export interface PortfolioProject {
  id: string;
  source_project_id?: string;
  title: string;
  description: string;
  technologies: string[];
  github_url: string | null;
  demo_url: string | null;
  image_url?: string | null;
  status: string;
  featured: boolean;
  display_order: number;
}

export interface PortfolioCertification {
  id: string;
  name: string;
  issuer: string;
  issue_date?: string;
  credential_url?: string;
  display_order: number;
}

export interface PortfolioData extends Portfolio {
  is_public?: boolean;
  slug?: string;
  theme?: string;
  skills: PortfolioSkill[];
  experience: PortfolioExperience[];
  education: PortfolioEducation[];
  projects: PortfolioProject[];
  certifications?: PortfolioCertification[];
}

// Fetch portfolio using the optimized view
const fetchPortfolioComplete = async (
  userId: string
): Promise<PortfolioData | null> => {
  // Try using the view first (faster - single query)
  const { data, error } = await supabase
    .from('portfolio_complete')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // If view doesn't exist, fallback to multiple queries
    if (error.code === '42P01') {
      return fetchPortfolioFallback(userId);
    }
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    skills: data.skills || [],
    experience: data.experience || [],
    education: data.education || [],
    projects: data.projects || [],
    certifications: data.certifications || [],
  } as PortfolioData;
};

// Fetch portfolio by slug or user ID (for public access)
export const fetchPortfolioPublic = async (
  identifier: string
): Promise<PortfolioData | null> => {
  const { data, error } = await supabase.rpc('get_portfolio', {
    identifier,
  });

  if (error) {
    console.error('Error fetching public portfolio:', error);
    return null;
  }

  return data as PortfolioData | null;
};

// Fallback fetch without view (multiple queries in parallel)
const fetchPortfolioFallback = async (
  userId: string
): Promise<PortfolioData | null> => {
  // Fetch portfolio
  const { data: portfolioData, error: portfolioError } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (portfolioError && portfolioError.code !== 'PGRST116') {
    throw portfolioError;
  }

  if (!portfolioData) {
    return null;
  }

  // Fetch related data in parallel
  const [skillsResult, experienceResult, educationResult, projectsResult, certificationsResult] =
    await Promise.all([
      supabase
        .from('portfolio_skills')
        .select('*')
        .eq('portfolio_id', portfolioData.id)
        .order('display_order'),
      supabase
        .from('portfolio_experience')
        .select('*')
        .eq('portfolio_id', portfolioData.id)
        .order('display_order'),
      supabase
        .from('portfolio_education')
        .select('*')
        .eq('portfolio_id', portfolioData.id)
        .order('display_order'),
      supabase
        .from('portfolio_projects')
        .select('*')
        .eq('portfolio_id', portfolioData.id)
        .order('featured', { ascending: false })
        .order('display_order'),
      supabase
        .from('portfolio_certifications')
        .select('*')
        .eq('portfolio_id', portfolioData.id)
        .order('display_order'),
    ]);

  return {
    ...portfolioData,
    skills: skillsResult.data || [],
    experience: experienceResult.data || [],
    education: educationResult.data || [],
    projects: projectsResult.data || [],
    certifications: certificationsResult.data || [],
  } as PortfolioData;
};

export const usePortfolio = (userId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const targetUserId = userId || user?.id;
  const isOwner = user?.id === targetUserId;

  // Main portfolio query
  const {
    data: portfolio,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.portfolio.byUser(targetUserId || ''),
    queryFn: () => fetchPortfolioComplete(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes - portfolios don't change often
  });

  const hasPortfolio = !!portfolio;

  // Create or update portfolio mutation
  const upsertPortfolioMutation = useMutation({
    mutationFn: async (data: {
      display_name: string;
      title?: string;
      bio?: string;
      location?: string;
      github_url?: string;
      linkedin_url?: string;
      website_url?: string;
      is_public?: boolean;
      theme?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      if (hasPortfolio && portfolio) {
        // Update existing portfolio
        const { error } = await supabase
          .from('portfolios')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', portfolio.id);

        if (error) throw error;
        return portfolio;
      } else {
        // Create new portfolio
        const { data: newPortfolio, error } = await supabase
          .from('portfolios')
          .insert([
            {
              user_id: user.id,
              ...data,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return newPortfolio;
      }
    },
    onSuccess: async () => {
      // Invalidate and refetch the portfolio
      await queryClient.invalidateQueries({
        queryKey: queryKeys.portfolio.byUser(targetUserId || ''),
      });
      // Force a refetch
      await refetch();
      toast({
        title: 'Success',
        description: 'Portfolio updated successfully!',
      });
    },
    onError: (err: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to update portfolio.',
      });
    },
  });

  // Add skill mutation
  const addSkillMutation = useMutation({
    mutationFn: async ({
      category,
      skills,
    }: {
      category: string;
      skills: string[];
    }) => {
      if (!portfolio) throw new Error('No portfolio');

      const { error } = await supabase.from('portfolio_skills').insert([
        {
          portfolio_id: portfolio.id,
          category,
          skills,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.portfolio.byUser(targetUserId || ''),
      });
      toast({
        title: 'Success',
        description: 'Skills added successfully!',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add skills.',
      });
    },
  });

  // Delete skill mutation
  const deleteSkillMutation = useMutation({
    mutationFn: async (skillId: string) => {
      const { error } = await supabase
        .from('portfolio_skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;
    },
    onMutate: async (skillId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.portfolio.byUser(targetUserId || ''),
      });

      const previousPortfolio = queryClient.getQueryData<PortfolioData>(
        queryKeys.portfolio.byUser(targetUserId || '')
      );

      if (previousPortfolio) {
        queryClient.setQueryData<PortfolioData>(
          queryKeys.portfolio.byUser(targetUserId || ''),
          {
            ...previousPortfolio,
            skills: previousPortfolio.skills.filter((s) => s.id !== skillId),
          }
        );
      }

      return { previousPortfolio };
    },
    onError: (err, _, context) => {
      if (context?.previousPortfolio) {
        queryClient.setQueryData(
          queryKeys.portfolio.byUser(targetUserId || ''),
          context.previousPortfolio
        );
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete skills.',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Skills deleted successfully!',
      });
    },
  });

  // Add experience mutation
  const addExperienceMutation = useMutation({
    mutationFn: async (data: {
      role: string;
      company: string;
      period: string;
      description: string;
      achievements?: string[];
      is_current?: boolean;
    }) => {
      if (!portfolio) throw new Error('No portfolio');

      const { error } = await supabase.from('portfolio_experience').insert([
        {
          portfolio_id: portfolio.id,
          ...data,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.portfolio.byUser(targetUserId || ''),
      });
      toast({
        title: 'Success',
        description: 'Experience added successfully!',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add experience.',
      });
    },
  });

  // Delete experience mutation
  const deleteExperienceMutation = useMutation({
    mutationFn: async (experienceId: string) => {
      const { error } = await supabase
        .from('portfolio_experience')
        .delete()
        .eq('id', experienceId);

      if (error) throw error;
    },
    onMutate: async (experienceId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.portfolio.byUser(targetUserId || ''),
      });

      const previousPortfolio = queryClient.getQueryData<PortfolioData>(
        queryKeys.portfolio.byUser(targetUserId || '')
      );

      if (previousPortfolio) {
        queryClient.setQueryData<PortfolioData>(
          queryKeys.portfolio.byUser(targetUserId || ''),
          {
            ...previousPortfolio,
            experience: previousPortfolio.experience.filter(
              (e) => e.id !== experienceId
            ),
          }
        );
      }

      return { previousPortfolio };
    },
    onError: (err, _, context) => {
      if (context?.previousPortfolio) {
        queryClient.setQueryData(
          queryKeys.portfolio.byUser(targetUserId || ''),
          context.previousPortfolio
        );
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete experience.',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Experience deleted successfully!',
      });
    },
  });

  // Add education mutation
  const addEducationMutation = useMutation({
    mutationFn: async (data: {
      degree: string;
      institution: string;
      period: string;
      gpa?: string;
      description?: string;
    }) => {
      if (!portfolio) throw new Error('No portfolio');

      const { error } = await supabase.from('portfolio_education').insert([
        {
          portfolio_id: portfolio.id,
          ...data,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.portfolio.byUser(targetUserId || ''),
      });
      toast({
        title: 'Success',
        description: 'Education added successfully!',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add education.',
      });
    },
  });

  // Delete education mutation
  const deleteEducationMutation = useMutation({
    mutationFn: async (educationId: string) => {
      const { error } = await supabase
        .from('portfolio_education')
        .delete()
        .eq('id', educationId);

      if (error) throw error;
    },
    onMutate: async (educationId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.portfolio.byUser(targetUserId || ''),
      });

      const previousPortfolio = queryClient.getQueryData<PortfolioData>(
        queryKeys.portfolio.byUser(targetUserId || '')
      );

      if (previousPortfolio) {
        queryClient.setQueryData<PortfolioData>(
          queryKeys.portfolio.byUser(targetUserId || ''),
          {
            ...previousPortfolio,
            education: previousPortfolio.education.filter(
              (e) => e.id !== educationId
            ),
          }
        );
      }

      return { previousPortfolio };
    },
    onError: (err, _, context) => {
      if (context?.previousPortfolio) {
        queryClient.setQueryData(
          queryKeys.portfolio.byUser(targetUserId || ''),
          context.previousPortfolio
        );
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete education.',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Education deleted successfully!',
      });
    },
  });

  // Add project mutation (enhanced with source_project_id)
  const addProjectMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      technologies: string[];
      github_url?: string;
      demo_url?: string;
      image_url?: string;
      status: string;
      featured?: boolean;
      source_project_id?: string;
    }) => {
      if (!portfolio) throw new Error('No portfolio');

      const { error } = await supabase.from('portfolio_projects').insert([
        {
          portfolio_id: portfolio.id,
          ...data,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.portfolio.byUser(targetUserId || ''),
      });
      toast({
        title: 'Success',
        description: 'Project added to portfolio!',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add project.',
      });
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({
      projectId,
      data,
    }: {
      projectId: string;
      data: Partial<PortfolioProject>;
    }) => {
      const { error } = await supabase
        .from('portfolio_projects')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.portfolio.byUser(targetUserId || ''),
      });
      toast({
        title: 'Success',
        description: 'Project updated successfully!',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update project.',
      });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('portfolio_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
    },
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.portfolio.byUser(targetUserId || ''),
      });

      const previousPortfolio = queryClient.getQueryData<PortfolioData>(
        queryKeys.portfolio.byUser(targetUserId || '')
      );

      if (previousPortfolio) {
        queryClient.setQueryData<PortfolioData>(
          queryKeys.portfolio.byUser(targetUserId || ''),
          {
            ...previousPortfolio,
            projects: previousPortfolio.projects.filter(
              (p) => p.id !== projectId
            ),
          }
        );
      }

      return { previousPortfolio };
    },
    onError: (err, _, context) => {
      if (context?.previousPortfolio) {
        queryClient.setQueryData(
          queryKeys.portfolio.byUser(targetUserId || ''),
          context.previousPortfolio
        );
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete project.',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Project removed from portfolio!',
      });
    },
  });

  // Add certification mutation
  const addCertificationMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      issuer: string;
      issue_date?: string;
      credential_url?: string;
    }) => {
      if (!portfolio) throw new Error('No portfolio');

      const { error } = await supabase.from('portfolio_certifications').insert([
        {
          portfolio_id: portfolio.id,
          ...data,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.portfolio.byUser(targetUserId || ''),
      });
      toast({
        title: 'Success',
        description: 'Certification added successfully!',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add certification.',
      });
    },
  });

  // Delete certification mutation
  const deleteCertificationMutation = useMutation({
    mutationFn: async (certificationId: string) => {
      const { error } = await supabase
        .from('portfolio_certifications')
        .delete()
        .eq('id', certificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.portfolio.byUser(targetUserId || ''),
      });
      toast({
        title: 'Success',
        description: 'Certification deleted successfully!',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete certification.',
      });
    },
  });

  // Check if a project is already in portfolio
  const isProjectInPortfolio = (sourceProjectId: string): boolean => {
    if (!portfolio?.projects) return false;
    return portfolio.projects.some((p) => p.source_project_id === sourceProjectId);
  };

  // Legacy API compatibility functions
  const createOrUpdatePortfolio = async (data: {
    display_name: string;
    title?: string;
    bio?: string;
    location?: string;
    github_url?: string;
    linkedin_url?: string;
    website_url?: string;
    is_public?: boolean;
    slug?: string;
  }) => {
    return upsertPortfolioMutation.mutateAsync(data);
  };

  const addSkill = async (category: string, skills: string[]) => {
    return addSkillMutation.mutateAsync({ category, skills });
  };

  const deleteSkill = async (skillId: string) => {
    return deleteSkillMutation.mutateAsync(skillId);
  };

  const addExperience = async (data: {
    role: string;
    company: string;
    period: string;
    description: string;
    achievements?: string[];
    is_current?: boolean;
  }) => {
    return addExperienceMutation.mutateAsync(data);
  };

  const deleteExperience = async (experienceId: string) => {
    return deleteExperienceMutation.mutateAsync(experienceId);
  };

  const addEducation = async (data: {
    degree: string;
    institution: string;
    period: string;
    gpa?: string;
    description?: string;
  }) => {
    return addEducationMutation.mutateAsync(data);
  };

  const deleteEducation = async (educationId: string) => {
    return deleteEducationMutation.mutateAsync(educationId);
  };

  const addProject = async (data: {
    title: string;
    description: string;
    technologies: string[];
    github_url?: string;
    demo_url?: string;
    image_url?: string;
    status: string;
    featured?: boolean;
    source_project_id?: string;
  }) => {
    return addProjectMutation.mutateAsync(data);
  };

  const updateProject = async (projectId: string, data: Partial<PortfolioProject>) => {
    return updateProjectMutation.mutateAsync({ projectId, data });
  };

  const deleteProject = async (projectId: string) => {
    return deleteProjectMutation.mutateAsync(projectId);
  };

  const addCertification = async (data: {
    name: string;
    issuer: string;
    issue_date?: string;
    credential_url?: string;
  }) => {
    return addCertificationMutation.mutateAsync(data);
  };

  const deleteCertification = async (certificationId: string) => {
    return deleteCertificationMutation.mutateAsync(certificationId);
  };

  return {
    portfolio,
    isLoading,
    error,
    hasPortfolio,
    isOwner,
    // Portfolio CRUD
    createOrUpdatePortfolio,
    isUpdatingPortfolio: upsertPortfolioMutation.isPending,
    // Skills
    addSkill,
    deleteSkill,
    // Experience
    addExperience,
    deleteExperience,
    // Education
    addEducation,
    deleteEducation,
    // Projects
    addProject,
    updateProject,
    deleteProject,
    isProjectInPortfolio,
    // Certifications
    addCertification,
    deleteCertification,
    // Refresh
    refreshPortfolio: refetch,
  };
};

// Hook for public portfolio viewing
export const usePublicPortfolio = (identifier: string) => {
  const {
    data: portfolio,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['portfolio', 'public', identifier],
    queryFn: () => fetchPortfolioPublic(identifier),
    enabled: !!identifier,
    staleTime: 10 * 60 * 1000, // 10 minutes for public views
  });

  return {
    portfolio,
    isLoading,
    error,
  };
};
