import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Sidebar } from '@/components/Sidebar';

export const DashboardLayout = () => {
    return (
        <SidebarProvider>
            <div className="flex h-screen w-full overflow-hidden">
                <Sidebar />
                <Outlet />
            </div>
        </SidebarProvider>
    );
};
