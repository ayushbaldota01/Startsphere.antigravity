import { Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  progress: number;
  dueDate: string;
  members: number;
  status: 'active' | 'completed' | 'pending';
}

export const ProjectCard = ({ id, title, description, progress, dueDate, members, status }: ProjectCardProps) => {
  const navigate = useNavigate();

  const statusColors = {
    active: 'bg-info text-white',
    completed: 'bg-success text-white',
    pending: 'bg-warning text-white',
  };

  return (
    <Card 
      className="hover:shadow-lg transition-smooth cursor-pointer border-border"
      onClick={() => navigate(`/project/${id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge className={statusColors[status]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{dueDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{members} members</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
