import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Crown, AlertCircle } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeDialog } from '@/components/UpgradeDialog';

export const CreateProjectDialog = () => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { createProject } = useProjects();
  const { limits, canCreateProject, isPro } = useSubscription();

  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: '',
    abstract: '',
    problem_statement: '',
    solution_approach: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canCreateProject) {
      return; // Should not happen due to UI disabled state
    }

    setIsLoading(true);

    try {
      await createProject(formData);
      setOpen(false);
      setFormData({
        name: '',
        domain: '',
        description: '',
        abstract: '',
        problem_statement: '',
        solution_approach: '',
      });
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={!canCreateProject}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
          {isPro && <Crown className="w-3 h-3 ml-2 text-yellow-500" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new project. Only the name is required.
          </DialogDescription>
        </DialogHeader>

        {/* Limit Warning */}
        {!canCreateProject && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                You've reached the limit of {limits.max_projects} projects on the Free plan.
              </span>
              <UpgradeDialog>
                <Button variant="outline" size="sm">
                  Upgrade to Pro
                </Button>
              </UpgradeDialog>
            </AlertDescription>
          </Alert>
        )}

        {/* Free Plan Info */}
        {!isPro && canCreateProject && (
          <Alert>
            <AlertDescription className="text-sm">
              Free Plan: {limits.current_projects}/{limits.max_projects} projects used.
              <UpgradeDialog>
                <Button variant="link" size="sm" className="ml-2 h-auto p-0">
                  Upgrade for unlimited projects
                </Button>
              </UpgradeDialog>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter project name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={!canCreateProject}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain / Category</Label>
              <Input
                id="domain"
                placeholder="e.g., Web Development, AI/ML, Mobile App"
                value={formData.domain}
                onChange={(e) =>
                  setFormData({ ...formData, domain: e.target.value })
                }
                disabled={!canCreateProject}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your project"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                disabled={!canCreateProject}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="abstract">Abstract</Label>
              <Textarea
                id="abstract"
                placeholder="Detailed abstract of your project"
                value={formData.abstract}
                onChange={(e) =>
                  setFormData({ ...formData, abstract: e.target.value })
                }
                rows={4}
                disabled={!canCreateProject}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="problem_statement">Problem Statement</Label>
              <Textarea
                id="problem_statement"
                placeholder="What problem does this project solve?"
                value={formData.problem_statement}
                onChange={(e) =>
                  setFormData({ ...formData, problem_statement: e.target.value })
                }
                rows={3}
                disabled={!canCreateProject}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="solution_approach">Solution Approach</Label>
              <Textarea
                id="solution_approach"
                placeholder="How will you solve this problem?"
                value={formData.solution_approach}
                onChange={(e) =>
                  setFormData({ ...formData, solution_approach: e.target.value })
                }
                rows={3}
                disabled={!canCreateProject}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !canCreateProject}>
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};




