import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserMinus } from 'lucide-react';
import type { ProjectWithRole } from '@/hooks/useProjects';

interface OfficeOverviewProps {
  project: ProjectWithRole;
  members: Array<{ id: string; name: string; email: string; role: string }>;
  taskStats?: {
    total: number;
    todo: number;
    in_progress: number;
    done: number;
  };
  onRemoveMember?: (userId: string) => void;
  currentUserId?: string;
}

export const OfficeOverview = ({ project, members, taskStats, onRemoveMember, currentUserId }: OfficeOverviewProps) => {
  const progress = taskStats?.total ? Math.round((taskStats.done / taskStats.total) * 100) : 0;
  const isAdmin = project.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">{project.name}</h2>
        {project.domain && (
          <Badge variant="secondary" className="mb-4">
            {project.domain}
          </Badge>
        )}
        {project.description && (
          <p className="text-muted-foreground">{project.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Team Members</CardDescription>
            <CardTitle className="text-3xl">{members.length}</CardTitle>
          </CardHeader>
        </Card>
        {taskStats && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Tasks</CardDescription>
                <CardTitle className="text-3xl">{taskStats.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Progress</CardDescription>
                <CardTitle className="text-3xl">{progress}%</CardTitle>
              </CardHeader>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.abstract && (
            <div>
              <h4 className="font-semibold mb-2">Abstract</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {project.abstract}
              </p>
            </div>
          )}
          {project.problem_statement && (
            <div>
              <h4 className="font-semibold mb-2">Problem Statement</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {project.problem_statement}
              </p>
            </div>
          )}
          {project.solution_approach && (
            <div>
              <h4 className="font-semibold mb-2">Solution Approach</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {project.solution_approach}
              </p>
            </div>
          )}
          {!project.abstract && !project.problem_statement && !project.solution_approach && (
            <p className="text-sm text-muted-foreground">
              No additional project details available.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Project collaborators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
                <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'}>
                  {member.role}
                </Badge>
                {isAdmin && onRemoveMember && member.id !== currentUserId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveMember(member.id)}
                    title="Remove member"
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};



