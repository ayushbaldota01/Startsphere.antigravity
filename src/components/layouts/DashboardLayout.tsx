import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Sidebar } from '@/components/Sidebar';

export const DashboardLayout = () => {
    return (
        <SidebarProvider>
            <Sidebar />
            <SidebarInset>
                <Outlet />
            </SidebarInset>
        </SidebarProvider>
    );
};
