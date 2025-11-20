import { useState, useEffect } from 'react';
import { supabase, type Portfolio } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface PortfolioData extends Portfolio {
  skills: Array<{ id: string; category: string; skills: string[] }>;
  experience: Array<{
    id: string;
    role: string;
    company: string;
    period: string;
    description: string;
  }>;
  education: Array<{
    id: string;
    degree: string;
    institution: string;
    period: string;
    gpa: string | null;
  }>;
  projects: Array<{
    id: string;
    title: string;
    description: string;
    technologies: string[];
    github_url: string | null;
    demo_url: string | null;
    status: string;
  }>;
}

export const usePortfolio = (userId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPortfolio, setHasPortfolio] = useState(false);

  const targetUserId = userId || user?.id;

  const fetchPortfolio = async () => {
    if (!targetUserId) return;

    try {
      setIsLoading(true);

      // Fetch portfolio
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (portfolioError && portfolioError.code !== 'PGRST116') {
        throw portfolioError;
      }

      if (!portfolioData) {
        setHasPortfolio(false);
        setPortfolio(null);
        setIsLoading(false);
        return;
      }

      setHasPortfolio(true);

      // Fetch related data
      const [skillsResult, experienceResult, educationResult, projectsResult] = await Promise.all([
        supabase.from('portfolio_skills').select('*').eq('portfolio_id', portfolioData.id),
        supabase.from('portfolio_experience').select('*').eq('portfolio_id', portfolioData.id),
        supabase.from('portfolio_education').select('*').eq('portfolio_id', portfolioData.id),
        supabase.from('portfolio_projects').select('*').eq('portfolio_id', portfolioData.id),
      ]);

      const completePortfolio: PortfolioData = {
        ...portfolioData,
        skills: skillsResult.data || [],
        experience: experienceResult.data || [],
        education: educationResult.data || [],
        projects: projectsResult.data || [],
      };

      setPortfolio(completePortfolio);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      if (!userId) {
        // Only show error if it's the current user's portfolio
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load portfolio.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [targetUserId]);

  const createOrUpdatePortfolio = async (data: {
    display_name: string;
    title?: string;
    bio?: string;
    location?: string;
    github_url?: string;
    linkedin_url?: string;
    website_url?: string;
  }) => {
    if (!user) return;

    try {
      if (hasPortfolio && portfolio) {
        // Update existing portfolio
        const { error } = await supabase
          .from('portfolios')
          .update(data)
          .eq('id', portfolio.id);

        if (error) throw error;
      } else {
        // Create new portfolio
        const { error } = await supabase.from('portfolios').insert([
          {
            user_id: user.id,
            ...data,
          },
        ]);

        if (error) throw error;
      }

      await fetchPortfolio();

      toast({
        title: 'Success',
        description: 'Portfolio updated successfully!',
      });
    } catch (error) {
      console.error('Error updating portfolio:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update portfolio.',
      });
      throw error;
    }
  };

  const addSkill = async (category: string, skills: string[]) => {
    if (!portfolio) return;

    try {
      const { error } = await supabase.from('portfolio_skills').insert([
        {
          portfolio_id: portfolio.id,
          category,
          skills,
        },
      ]);

      if (error) throw error;
      await fetchPortfolio();

      toast({
        title: 'Success',
        description: 'Skills added successfully!',
      });
    } catch (error) {
      console.error('Error adding skill:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add skills.',
      });
    }
  };

  const deleteSkill = async (skillId: string) => {
    try {
      const { error } = await supabase.from('portfolio_skills').delete().eq('id', skillId);

      if (error) throw error;
      await fetchPortfolio();

      toast({
        title: 'Success',
        description: 'Skills deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete skills.',
      });
    }
  };

  const addExperience = async (data: {
    role: string;
    company: string;
    period: string;
    description: string;
  }) => {
    if (!portfolio) return;

    try {
      const { error } = await supabase.from('portfolio_experience').insert([
        {
          portfolio_id: portfolio.id,
          ...data,
        },
      ]);

      if (error) throw error;
      await fetchPortfolio();

      toast({
        title: 'Success',
        description: 'Experience added successfully!',
      });
    } catch (error) {
      console.error('Error adding experience:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add experience.',
      });
    }
  };

  const deleteExperience = async (experienceId: string) => {
    try {
      const { error } = await supabase.from('portfolio_experience').delete().eq('id', experienceId);

      if (error) throw error;
      await fetchPortfolio();

      toast({
        title: 'Success',
        description: 'Experience deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting experience:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete experience.',
      });
    }
  };

  const addEducation = async (data: {
    degree: string;
    institution: string;
    period: string;
    gpa?: string;
  }) => {
    if (!portfolio) return;

    try {
      const { error } = await supabase.from('portfolio_education').insert([
        {
          portfolio_id: portfolio.id,
          ...data,
        },
      ]);

      if (error) throw error;
      await fetchPortfolio();

      toast({
        title: 'Success',
        description: 'Education added successfully!',
      });
    } catch (error) {
      console.error('Error adding education:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add education.',
      });
    }
  };

  const deleteEducation = async (educationId: string) => {
    try {
      const { error } = await supabase.from('portfolio_education').delete().eq('id', educationId);

      if (error) throw error;
      await fetchPortfolio();

      toast({
        title: 'Success',
        description: 'Education deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting education:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete education.',
      });
    }
  };

  const addProject = async (data: {
    title: string;
    description: string;
    technologies: string[];
    github_url?: string;
    demo_url?: string;
    status: string;
  }) => {
    if (!portfolio) return;

    try {
      const { error } = await supabase.from('portfolio_projects').insert([
        {
          portfolio_id: portfolio.id,
          ...data,
        },
      ]);

      if (error) throw error;
      await fetchPortfolio();

      toast({
        title: 'Success',
        description: 'Project added successfully!',
      });
    } catch (error) {
      console.error('Error adding project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add project.',
      });
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase.from('portfolio_projects').delete().eq('id', projectId);

      if (error) throw error;
      await fetchPortfolio();

      toast({
        title: 'Success',
        description: 'Project deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete project.',
      });
    }
  };

  return {
    portfolio,
    isLoading,
    hasPortfolio,
    createOrUpdatePortfolio,
    addSkill,
    deleteSkill,
    addExperience,
    deleteExperience,
    addEducation,
    deleteEducation,
    addProject,
    deleteProject,
    refreshPortfolio: fetchPortfolio,
  };
};



