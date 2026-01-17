import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useMentorProjects } from '@/hooks/useMentorProjects';
import { useMentorRequests } from '@/hooks/useMentorRequests';
import { useMentorUnreadCount } from '@/hooks/useMentorMessages';
import { logger } from '@/lib/logger';
import { NavLink } from '@/components/NavLink';
import { Home, FolderKanban, User, LogOut, BarChart3, ChevronRight, GraduationCap, Bell, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from './ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  // Debug logging (only in development)
  logger.debug('[Sidebar] User state:', {
    hasUser: !!user,
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
  });

  const { projects: studentProjects } = useProjects();
  const { projects: mentorProjects } = useMentorProjects();
  const { requests: mentorRequests } = useMentorRequests();
  const { totalUnread: mentorUnreadMessages } = useMentorUnreadCount();

  // Memoize user projects to prevent unnecessary re-renders
  const userProjects = React.useMemo(
    () => user?.role === 'mentor' ? mentorProjects : studentProjects,
    [user?.role, mentorProjects, studentProjects]
  );
  const pendingRequestsCount = React.useMemo(
    () => user?.role === 'mentor' ? mentorRequests.length : 0,
    [user?.role, mentorRequests.length]
  );

  // Map projects with colors
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'];
  const projects = userProjects.map((project, index) => ({
    id: project.id,
    title: project.name.length > 20 ? project.name.substring(0, 20) + '...' : project.name,
    color: colors[index % colors.length],
  }));

  const isActive = (path: string) => location.pathname === path;
  const isProjectActive = location.pathname.startsWith('/project/');

  return (
    <ShadcnSidebar collapsible="icon">
      <SidebarContent>
        {/* Header */}
        <div className="p-4 border-b">
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold text-primary">StartSphere</h1>
              <p className="text-xs text-muted-foreground">Collaborative Workspace</p>
            </div>
          )}
          {collapsed && (
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                S
              </div>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/dashboard')}
                  tooltip="Dashboard"
                  className="group-data-[collapsible=icon]:justify-center"
                >
                  <NavLink to="/dashboard" activeClassName="bg-accent text-accent-foreground font-medium">
                    <Home className="w-4 h-4" />
                    {!collapsed && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {user?.role !== 'mentor' && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/portfolio')}
                    tooltip="Portfolio"
                    className="group-data-[collapsible=icon]:justify-center"
                  >
                    <NavLink to="/portfolio" activeClassName="bg-accent text-accent-foreground font-medium">
                      <Briefcase className="w-4 h-4" />
                      {!collapsed && <span>Portfolio</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {user?.role === 'mentor' && !collapsed && (
                <>
                  {pendingRequestsCount > 0 && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <div className="relative flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-primary/10 text-primary cursor-default">
                          <Bell className="w-4 h-4" />
                          <span className="flex-1">Pending Requests</span>
                          <Badge variant="default" className="h-5 min-w-[1.25rem] px-1 text-xs">
                            {pendingRequestsCount}
                          </Badge>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {mentorUnreadMessages > 0 && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <div className="relative flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-blue-500/10 text-blue-600 cursor-default">
                          <Bell className="w-4 h-4" />
                          <span className="flex-1">Unread Messages</span>
                          <Badge variant="default" className="h-5 min-w-[1.25rem] px-1 text-xs bg-blue-600">
                            {mentorUnreadMessages}
                          </Badge>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Projects Section */}
        {!collapsed && (
          <SidebarGroup>
            <Collapsible defaultOpen={isProjectActive} className="group/collapsible">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-2">
                    {user?.role === 'mentor' ? (
                      <>
                        <GraduationCap className="w-4 h-4" />
                        <span>Guided Projects</span>
                      </>
                    ) : (
                      <>
                        <FolderKanban className="w-4 h-4" />
                        <span>Projects</span>
                      </>
                    )}
                  </span>
                  <ChevronRight className="w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {projects.length > 0 ? (
                      projects.map((project) => (
                        <SidebarMenuItem key={project.id}>
                          <SidebarMenuButton asChild isActive={isActive(`/project/${project.id}`)}>
                            <NavLink
                              to={`/project/${project.id}`}
                              activeClassName="bg-accent text-accent-foreground font-medium"
                            >
                              <div className={`w-3 h-3 rounded-full ${project.color}`} />
                              <span className="truncate">{project.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        {user?.role === 'mentor' ? 'No guided projects yet' : 'No projects yet'}
                      </div>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer with Profile */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/profile')}
              size="lg"
              className="group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center"
            >
              <NavLink to="/profile" activeClassName="bg-accent text-accent-foreground font-medium">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs shrink-0 shadow-lg shadow-primary/20">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0 ml-3">
                    <p className="text-sm font-bold truncate">
                      {user?.name || 'Loading...'}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                      {user?.role || 'User'}
                    </p>
                  </div>
                )}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {!collapsed && (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={logout} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </ShadcnSidebar>
  );
};
