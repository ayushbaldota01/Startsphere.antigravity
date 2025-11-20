import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { NavLink } from '@/components/NavLink';
import { Home, FolderKanban, User, LogOut, BarChart3, ChevronRight } from 'lucide-react';
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

  const { projects: userProjects } = useProjects();
  
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
                <SidebarMenuButton asChild isActive={isActive('/dashboard')}>
                  <NavLink to="/dashboard" activeClassName="bg-accent text-accent-foreground font-medium">
                    <Home className="w-4 h-4" />
                    {!collapsed && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {user?.role === 'mentor' && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/reports')}>
                    <NavLink to="/reports" activeClassName="bg-accent text-accent-foreground font-medium">
                      <BarChart3 className="w-4 h-4" />
                      {!collapsed && <span>Reports</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Projects Section */}
        {user?.role === 'student' && !collapsed && (
          <SidebarGroup>
            <Collapsible defaultOpen={isProjectActive} className="group/collapsible">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4" />
                    Projects
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
                        No projects yet
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
            <SidebarMenuButton asChild isActive={isActive('/profile') || isActive('/profile/portfolio')}>
              <NavLink to="/profile" activeClassName="bg-accent text-accent-foreground font-medium">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
                  </div>
                )}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {!collapsed && (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={logout}>
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
