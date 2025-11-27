import { useEffect, useState } from 'react';
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
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { AddMemberDialog } from '@/components/AddMemberDialog';
import { useAuth } from '@/contexts/AuthContext';
import { TeamWorkspace } from '@/components/workspace/TeamWorkspace';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { getProject, addMember, removeMember, getProjectMembers } = useProjects();
  const { tasks } = useTasks(id);

  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);

        // Fetch project
        const projectData = await getProject(id);
        if (!projectData) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Project not found or you don\'t have access.',
          });
          navigate('/dashboard');
          return;
        }
        setProject(projectData);

        // Fetch members
        const { data: membersData, error } = await supabase
          .from('project_members')
          .select(`
            id,
            role,
            user:users(id, name, email)
          `)
          .eq('project_id', id);

        if (error) throw error;

        const formattedMembers = membersData.map((m: any) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
        }));

        setMembers(formattedMembers);
      } catch (error) {
        console.error('Error fetching project:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load project data.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [id]);

  const handleAddMember = async (email: string, role: 'ADMIN' | 'MEMBER') => {
    if (!id) return;
    await addMember(id, email, role);
    // Refresh members list
    const updatedMembers = await getProjectMembers(id);
    const formattedMembers = updatedMembers.map((m: any) => ({
      id: m.users.id,
      name: m.users.name,
      email: m.users.email,
      role: m.role,
    }));
    setMembers(formattedMembers);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id) return;
    await removeMember(id, userId);
    // Refresh members list
    const updatedMembers = await getProjectMembers(id);
    const formattedMembers = updatedMembers.map((m: any) => ({
      id: m.users.id,
      name: m.users.name,
      email: m.users.email,
      role: m.role,
    }));
    setMembers(formattedMembers);
  };

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'TODO').length,
    in_progress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    done: tasks.filter((t) => t.status === 'DONE').length,
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
          {project.role === 'ADMIN' && (
            <AddMemberDialog projectId={id!} onAddMember={handleAddMember} />
          )}
        </header>

        <main className="flex-1 p-6 bg-background overflow-y-auto">
          <Tabs defaultValue="workspace" className="space-y-4">
            <TabsList>
              <TabsTrigger value="workspace">Team Workspace</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Work Table</TabsTrigger>
              <TabsTrigger value="chat">Conference Room</TabsTrigger>
              <TabsTrigger value="notes">Scratch Pad</TabsTrigger>
              <TabsTrigger value="files">File Shelf</TabsTrigger>
            </TabsList>

            <TabsContent value="workspace" className="h-[calc(100vh-12rem)]">
              <TeamWorkspace projectId={id!} />
            </TabsContent>

            <TabsContent value="overview">
              <OfficeOverview
                project={project}
                members={members}
                taskStats={taskStats}
                onRemoveMember={handleRemoveMember}
                currentUserId={user?.id}
              />
            </TabsContent>

            <TabsContent value="tasks">
              <WorkTable projectId={id!} members={members} />
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
      </div>
    </>
  );
};

export default ProjectDetail;
