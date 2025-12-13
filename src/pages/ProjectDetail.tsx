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
import { RequestMentorDialog } from '@/components/RequestMentorDialog';
import { MentorNotifications } from '@/components/project/MentorNotifications';
import { ConferenceRoomWithMentor } from '@/components/project/ConferenceRoomWithMentor';
import { ProjectReport } from '@/components/project/ProjectReport';
import { useProjects, useProjectDetail } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { AddMemberDialog } from '@/components/AddMemberDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { MoreVertical, Trash2, GraduationCap, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addMember, removeMember, deleteProject } = useProjects();
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
  const formattedMembers = (members || []).map((m: any) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.project_role || m.role, // Project role (ADMIN/MEMBER/MENTOR)
    avatar_url: m.avatar_url,
    user_role: m.user_role, // User type (student/mentor)
    is_mentor: m.is_mentor || m.user_role === 'mentor' || m.project_role === 'MENTOR' || m.role === 'MENTOR',
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

  // Determine if user is a mentor viewing in read-only mode
  const isMentor = user?.role === 'mentor';
  const isReadOnly = isMentor && userRole === 'MEMBER';

  // Get mentors from project members for mentor messaging
  // Check multiple conditions: user_role, project_role, or is_mentor flag
  const projectMentors = members
    ?.filter((m: any) => 
      m.user_role === 'mentor' || 
      m.project_role === 'MENTOR' || 
      m.role === 'MENTOR' ||
      m.is_mentor === true
    )
    .map((m: any) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      avatar_url: m.avatar_url,
      role: m.project_role || m.role, // This is the project role (ADMIN/MEMBER/MENTOR)
    })) || [];

  // Removed console.logs for production performance

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
            {isMentor && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <GraduationCap className="w-3 h-3 mr-1" />
                Mentor View
              </Badge>
            )}
          </div>
          {userRole === 'ADMIN' && !isMentor && (
            <div className="flex items-center gap-2">
              <RequestMentorDialog projectId={id!} />
              <AddMemberDialog projectId={id!} onAddMember={handleAddMember} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                        deleteProject(id!).then(() => navigate('/dashboard'));
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </header>

        <main className="flex-1 p-6 bg-background overflow-y-auto">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {!isMentor && <TabsTrigger value="tasks">Work Table</TabsTrigger>}
              {!isMentor && <TabsTrigger value="chat">Conference Room</TabsTrigger>}
              {isMentor && <TabsTrigger value="mentor-notifications">Mentor Communications</TabsTrigger>}
              {!isMentor && <TabsTrigger value="notes">Scratch Pad</TabsTrigger>}
              <TabsTrigger value="files">File Shelf</TabsTrigger>
              <TabsTrigger value="reports">
                <FileText className="w-4 h-4 mr-2" />
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OfficeOverview
                project={{ ...project, role: userRole }}
                members={formattedMembers}
                taskStats={taskStats}
                onRemoveMember={handleRemoveMember}
                currentUserId={user?.id}
                readOnly={isReadOnly}
              />
            </TabsContent>

            {!isMentor && (
              <TabsContent value="tasks">
                <WorkTable projectId={id!} members={formattedMembers} />
              </TabsContent>
            )}

            {!isMentor && (
              <TabsContent value="chat">
                <ConferenceRoomWithMentor projectId={id!} mentors={projectMentors} />
              </TabsContent>
            )}

            {isMentor && (
              <TabsContent value="mentor-notifications">
                <MentorNotifications projectId={id!} />
              </TabsContent>
            )}

            {!isMentor && (
              <TabsContent value="notes">
                <ScratchPad projectId={id!} />
              </TabsContent>
            )}

            <TabsContent value="files">
              <FileShelf projectId={id!} readOnly={isReadOnly} />
            </TabsContent>

            <TabsContent value="reports">
              <ProjectReport
                projectId={id!}
                project={project}
                members={formattedMembers}
                isAdmin={userRole === 'ADMIN' || !isMentor}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div >
    </>
  );
};

export default ProjectDetail;
