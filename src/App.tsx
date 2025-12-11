import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { CommandPalette } from "@/components/command-palette";
import { queryClient } from "@/lib/queryClient";
import { lazy, Suspense } from "react";

// Lazy load pages for better performance
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MentorDashboard = lazy(() => import("./pages/MentorDashboard"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Reports = lazy(() => import("./pages/Reports"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/20">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-muted-foreground font-medium">Loading...</p>
    </div>
  </div>
);

// Component to route to correct dashboard based on role
const DashboardRouter = () => {
  const { user } = useAuth();
  
  // Debug logging
  console.log('[DashboardRouter] User role:', user?.role, 'User:', user);
  
  if (user?.role === 'mentor') {
    console.log('[DashboardRouter] Routing to MentorDashboard');
    return <MentorDashboard />;
  }
  
  console.log('[DashboardRouter] Routing to Student Dashboard');
  return <Dashboard />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="startsphere-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <CommandPalette />
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <SidebarProvider>
                          <div className="flex min-h-screen w-full">
                            <DashboardRouter />
                          </div>
                        </SidebarProvider>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/project/:id" 
                    element={
                      <ProtectedRoute>
                        <SidebarProvider>
                          <div className="flex min-h-screen w-full">
                            <ProjectDetail />
                          </div>
                        </SidebarProvider>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <SidebarProvider>
                          <div className="flex min-h-screen w-full">
                            <Profile />
                          </div>
                        </SidebarProvider>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile/portfolio" 
                    element={
                      <ProtectedRoute>
                        <SidebarProvider>
                          <div className="flex min-h-screen w-full">
                            <Portfolio />
                          </div>
                        </SidebarProvider>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/reports" 
                    element={
                      <ProtectedRoute>
                        <SidebarProvider>
                          <div className="flex min-h-screen w-full">
                            <Reports />
                          </div>
                        </SidebarProvider>
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
