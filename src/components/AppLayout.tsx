import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import logoDerom from '@/assets/logo-derom.png';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const AppLayout = () => {
  const { user, logout } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between border-b border-border px-6 bg-card">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-foreground hover:bg-accent rounded-lg" />
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-px h-6 bg-border" />
                <img src={logoDerom} alt="DEROM" width={90} height={90} loading="lazy" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">
                    {user?.nombre?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground leading-tight">{user?.nombre}</span>
                  <span className="text-[11px] text-muted-foreground leading-tight">{user?.rol?.toUpperCase()}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground hover:bg-accent">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 md:p-8 overflow-auto bg-secondary/30">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
