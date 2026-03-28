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
import { LayoutDashboard, Users, ShoppingCart, Plus } from 'lucide-react';
import logoDerom from '@/assets/logo-derom.png';

const items = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Ventas', url: '/ventas', icon: ShoppingCart },
  { title: 'Nueva Venta', url: '/ventas/nueva', icon: Plus },
  { title: 'Agentes', url: '/agentes', icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center justify-center border-b border-sidebar-border">
          {!collapsed && <img src={logoDerom} alt="DEROM" width={120} height={120} className="invert brightness-200" />}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
