import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { OfficeOverview } from '@/components/project/OfficeOverview';
import { WorkTable } from '@/components/project/WorkTable';
import { ConferenceRoom } from '@/components/project/ConferenceRoom';
import { ScratchPad } from '@/components/project/ScratchPad';
import { FileShelf } from '@/components/project/FileShelf';
import { useProjects, useProjectDetail } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { AddMemberDialog } from '@/components/AddMemberDialog';
import { useAuth } from '@/contexts/AuthContext';
import { TeamWorkspace } from '@/components/workspace/TeamWorkspace';
import { useEffect } from 'react';
import { Layout } from 'lucide-react';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addMember, removeMember } = useProjects();
  const { tasks } = useTasks(id);

  // Use the optimized hook that fetches everything in one RPC call
  const {
    project,
    members,
    userRole,
    taskStats: rpcTaskStats,
    isLoading,
    error,
    refetch
  } = useProjectDetail(id);

  // Handle error - redirect if no access
  useEffect(() => {
    if (error || (!isLoading && !project && id)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Project not found or you don\'t have access.',
      });
      navigate('/dashboard');
    }
  }, [error, isLoading, project, id, navigate, toast]);

  // Format members for child components
  const formattedMembers = (members || []).map((m: { id: string; name: string; email: string; role: 'ADMIN' | 'MEMBER'; avatar_url?: string }) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.role,
    avatar_url: m.avatar_url,
  }));

  // Use RPC task stats if available, otherwise calculate from tasks array
  const taskStats = rpcTaskStats || {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'TODO').length,
    in_progress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    done: tasks.filter((t) => t.status === 'DONE').length,
  };

  const handleAddMember = async (email: string, role: 'ADMIN' | 'MEMBER') => {
    if (!id) return;
    await addMember(id, email, role);
    // React Query will automatically refetch due to invalidation
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id) return;
    await removeMember(id, userId);
    // React Query will automatically refetch due to invalidation
  };

  if (isLoading) {
    return (
      <>
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b px-4 gap-2">
            <SidebarTrigger />
            <Skeleton className="h-6 w-48" />
          </header>
          <main className="flex-1 p-6 bg-background">
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
      </>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-14 flex items-center justify-between border-b px-4 gap-2">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h2 className="text-lg font-semibold">{project.name}</h2>
          </div>
          {userRole === 'ADMIN' && (
            <AddMemberDialog projectId={id!} onAddMember={handleAddMember} />
          )}
        </header>

        <main className="flex-1 p-6 bg-background overflow-y-auto">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Work Table</TabsTrigger>
              <TabsTrigger value="chat">Conference Room</TabsTrigger>
              <TabsTrigger value="notes">Scratch Pad</TabsTrigger>
              <TabsTrigger value="files">File Shelf</TabsTrigger>
              <TabsTrigger value="workspace">Team Workspace</TabsTrigger>
            </TabsList>

            <TabsContent value="workspace" className="h-[calc(100vh-12rem)]">
              <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg bg-muted/10">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <Layout className="w-8 h-8 text-primary opacity-50" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Team Workspace</h3>
                <p className="text-muted-foreground mb-6">This feature is coming soon!</p>
                <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  Under Development
                </div>
              </div>
            </TabsContent>

            <TabsContent value="overview">
              <OfficeOverview
                project={{ ...project, role: userRole }}
                members={formattedMembers}
                taskStats={taskStats}
                onRemoveMember={handleRemoveMember}
                currentUserId={user?.id}
              />
            </TabsContent>

            <TabsContent value="tasks">
              <WorkTable projectId={id!} members={formattedMembers} />
            </TabsContent>

            <TabsContent value="chat">
              <ConferenceRoom projectId={id!} />
            </TabsContent>

            <TabsContent value="notes">
              <ScratchPad projectId={id!} />
            </TabsContent>

            <TabsContent value="files">
              <FileShelf projectId={id!} />
            </TabsContent>
          </Tabs>
        </main>
      </div >
    </>
  );
};

export default ProjectDetail;
