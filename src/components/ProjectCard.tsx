import { Calendar, Users, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
    active: 'bg-blue-500 text-white',
    completed: 'bg-green-500 text-white',
    pending: 'bg-amber-500 text-white',
  };

  return (
    <Card
      className="h-full cursor-pointer border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl overflow-hidden group relative"
      onClick={() => navigate(`/project/${id}`)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <CardHeader className="relative">
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
          <Badge className={`${statusColors[status]} shadow-sm`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2 text-base">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground font-medium">Progress</span>
            <span className="font-bold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2.5" />
        </div>

        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{dueDate}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="font-medium">{members}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-primary font-medium text-sm mt-4">
          <span>Open Project</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </CardContent>
    </Card>
  );
};
