import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Users, Home, Plus } from 'lucide-react';
import logoDerom from '@/assets/logo-derom.png';

const items = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Ventas', url: '/ventas', icon: Home },
  { title: 'Nueva Venta', url: '/ventas/nueva', icon: Plus },
  { title: 'Agentes', url: '/agentes', icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const isActive = (url: string) => {
    if (url === '/') return location.pathname === '/';
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        {/* Logo */}
        <div className="px-5 py-6 flex items-center justify-center border-b border-sidebar-border">
          {!collapsed && (
            <img
              src={logoDerom}
              alt="DEROM Real Estate"
              width={130}
              height={130}
              className="object-contain"
            />
          )}
        </div>

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="px-5 text-[11px] font-semibold uppercase tracking-widest text-sidebar-muted">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-3 mt-1">
            <SidebarMenu>
              {items.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link
                        to={item.url}
                        className={`
                          group relative flex items-center gap-3 rounded-lg px-3 py-2.5
                          text-sm font-medium transition-all duration-200
                          ${active
                            ? 'bg-accent text-accent-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }
                        `}
                      >
                        {/* Active indicator bar */}
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
                        )}
                        <item.icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${active ? 'text-primary' : 'text-sidebar-muted group-hover:text-sidebar-foreground'}`} />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
