import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  Home, 
  FolderKanban, 
  User, 
  BarChart3, 
  Briefcase,
  Search,
  Moon,
  Sun,
  LogOut
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/theme-provider';
import './command-palette.css';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { user, logout } = useAuth();
  const { setTheme } = useTheme();

  // Toggle with Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-2xl">
        <Command className="rounded-lg border-none">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input 
              placeholder="Type a command or search..." 
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">ESC</span>
            </kbd>
          </div>
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="mb-2">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/dashboard'))}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/profile'))}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Command.Item>
              {/* Temporarily removed portfolio route */}
              {/* <Command.Item
                onSelect={() => runCommand(() => navigate('/profile/portfolio'))}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent"
              >
                <Briefcase className="h-4 w-4" />
                <span>Portfolio</span>
              </Command.Item> */}
              {user?.role === 'mentor' && (
                <Command.Item
                  onSelect={() => runCommand(() => navigate('/reports'))}
                  className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Reports</span>
                </Command.Item>
              )}
            </Command.Group>

            {projects && projects.length > 0 && (
              <Command.Group heading="Projects" className="mb-2">
                {projects.slice(0, 5).map((project) => (
                  <Command.Item
                    key={project.id}
                    onSelect={() => runCommand(() => navigate(`/project/${project.id}`))}
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent"
                  >
                    <FolderKanban className="h-4 w-4" />
                    <span>{project.name}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Theme" className="mb-2">
              <Command.Item
                onSelect={() => runCommand(() => setTheme('light'))}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent"
              >
                <Sun className="h-4 w-4" />
                <span>Light Mode</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => setTheme('dark'))}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent"
              >
                <Moon className="h-4 w-4" />
                <span>Dark Mode</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Actions">
              <Command.Item
                onSelect={() => runCommand(() => logout())}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent text-destructive"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}



