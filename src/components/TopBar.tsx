import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopBarProps {
  title: string;
  actions?: React.ReactNode;
}

export const TopBar = ({ title, actions }: TopBarProps) => {
  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      
      <div className="flex items-center gap-3">
        {actions}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </Button>
      </div>
    </header>
  );
};
