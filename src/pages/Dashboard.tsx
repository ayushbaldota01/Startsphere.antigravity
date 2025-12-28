import React, { useMemo } from 'react';
import { ProjectCard } from '@/components/ProjectCard';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { CreateProjectDialog } from '@/components/CreateProjectDialog';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useSubscription } from '@/hooks/useSubscription';
import { SkeletonProjectGrid } from '@/components/ui/skeleton-card';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Sparkles, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { UpgradeDialog } from '@/components/UpgradeDialog';

const Dashboard = () => {
  const { user } = useAuth();
  const { projects, isLoading } = useProjects();
  const { isPro } = useSubscription();

  // Memoize projects list to prevent unnecessary re-renders
  const memoizedProjects = useMemo(() => projects, [projects]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-14 flex items-center border-b px-4 gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0"
      >
        <SidebarTrigger />
        {isPro && (
          <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
            <Crown className="w-3 h-3 mr-1" />
            Pro
          </Badge>
        )}
        <div className="flex-1" />
        <ThemeToggle />
        {!isPro && user?.role === 'student' && <UpgradeDialog />}
        {user?.role === 'student' && <CreateProjectDialog />}
      </motion.header>

      <main className="flex-1 p-6 bg-gradient-to-br from-background via-background to-muted/10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Welcome back, {user?.name}!
            </h3>
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground text-lg">
            Here's what's happening with your projects today.
          </p>
        </motion.div>

        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <SkeletonProjectGrid />
          </motion.div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.3 }}
                >
                  <FolderOpen className="w-20 h-20 text-muted-foreground mb-6" />
                </motion.div>
                <h3 className="text-2xl font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  {user?.role === 'student'
                    ? 'Create your first project to get started on your journey!'
                    : 'You haven\'t been added to any projects yet. Contact your team to get started.'}
                </p>
                {user?.role === 'student' && <CreateProjectDialog />}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            {memoizedProjects.map((project) => (
              <div key={project.id}>
                <ProjectCard
                  id={project.id}
                  title={project.name}
                  description={project.description || 'No description provided'}
                  progress={0}
                  dueDate="No due date"
                  members={project.memberCount || 0}
                  status="active"
                />
              </div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
