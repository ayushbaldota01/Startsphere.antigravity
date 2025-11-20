import { Sidebar } from '@/components/Sidebar';
import { ProjectCard } from '@/components/ProjectCard';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { CreateProjectDialog } from '@/components/CreateProjectDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { FolderOpen } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { projects, isLoading } = useProjects();

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-14 flex items-center border-b px-4 gap-2">
          <SidebarTrigger />
          <div className="flex-1" />
          {user?.role === 'student' && <CreateProjectDialog />}
        </header>
        
        <main className="flex-1 p-6 bg-background overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-1">
              Welcome back, {user?.name}! 👋
            </h3>
            <p className="text-muted-foreground">
              Here's what's happening with your projects today.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {user?.role === 'student'
                    ? 'Create your first project to get started!'
                    : 'You haven\'t been added to any projects yet.'}
                </p>
                {user?.role === 'student' && <CreateProjectDialog />}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  title={project.name}
                  description={project.description || 'No description provided'}
                  progress={0} // We'll calculate this later based on tasks
                  dueDate="No due date" // We'll add this field later
                  members={project.memberCount || 0}
                  status="active"
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default Dashboard;
