import { useProjectList } from './useProjectList';
import { useProjectDetail } from './useProjectDetail';
import { useProjectMutations } from './useProjectMutations';

// Re-export for sub-modules
export { useProjectDetail };

// Aggregator hook for backward compatibility
export const useProjects = () => {
  const list = useProjectList();
  const mutations = useProjectMutations();

  return {
    ...list,
    ...mutations,
    // Add any missing methods that were in the original hook but might be named differently
    projects: list.projects,
    isLoading: list.isLoading,
  };
};
