import { Sidebar } from '@/components/Sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { useMentorProjects } from '@/hooks/useMentorProjects';
import { useMentorRequests } from '@/hooks/useMentorRequests';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SkeletonProjectGrid } from '@/components/ui/skeleton-card';
import { Badge } from '@/components/ui/badge';
import { MentorRequestCard } from '@/components/MentorRequestCard';
import { FolderOpen, GraduationCap, Users, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const MentorDashboard = () => {
  const { user } = useAuth();
  const { projects, isLoading: projectsLoading } = useMentorProjects();
  const { requests, isLoading: requestsLoading } = useMentorRequests();

  // Calculate stats
  const totalProjects = projects.length;
  const totalStudents = projects.reduce((sum, project) => sum + (project.memberCount || 0), 0);
  const pendingRequests = requests.length;

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-14 flex items-center border-b px-4 gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Mentor Portal</span>
          </div>
          <div className="flex-1" />
          <ThemeToggle />
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
                Welcome, Prof. {user?.name}!
              </h3>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Mentor
              </Badge>
            </div>
            <p className="text-muted-foreground text-lg">
              Here's an overview of your guided projects and pending requests.
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Guided Projects</p>
                    <h3 className="text-3xl font-bold mt-2">{totalProjects}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FolderOpen className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                    <h3 className="text-3xl font-bold mt-2">{totalStudents}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                    <h3 className="text-3xl font-bold mt-2">{pendingRequests}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending Requests Section */}
          {pendingRequests > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Pending Mentor Requests
              </h4>
              {requestsLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <div className="animate-pulse space-y-3">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <MentorRequestCard key={request.id} request={request} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Guided Projects Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              My Guided Projects
            </h4>

            {projectsLoading ? (
              <SkeletonProjectGrid />
            ) : projects.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.3 }}
                  >
                    <GraduationCap className="w-20 h-20 text-muted-foreground mb-6" />
                  </motion.div>
                  <h3 className="text-2xl font-semibold mb-2">No guided projects yet</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-md">
                    You haven't been assigned to any projects yet. Students can send you mentor requests.
                  </p>
                  {pendingRequests > 0 && (
                    <p className="text-sm text-primary">
                      You have {pendingRequests} pending request{pendingRequests !== 1 ? 's' : ''} above!
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link to={`/project/${project.id}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-xl line-clamp-1">{project.name}</CardTitle>
                            <Badge variant="outline" className="ml-2">
                              {project.role}
                            </Badge>
                          </div>
                          <CardDescription className="line-clamp-2">
                            {project.description || 'No description provided'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{project.memberCount || 0} members</span>
                            </div>
                            {project.domain && (
                              <Badge variant="secondary" className="text-xs">
                                {project.domain}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default MentorDashboard;

