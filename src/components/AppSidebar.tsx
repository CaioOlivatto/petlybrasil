import {
  LayoutDashboard,
  FileText,
  Syringe,
  Calendar,
  BookOpen,
  Dumbbell,
  Bot,
  HelpCircle,
  User,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import petlyLogo from "@/assets/petly-logo.png";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Prontuário", url: "/prontuario", icon: FileText },
  { title: "Vacinas", url: "/vacinas", icon: Syringe },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Diário", url: "/diario", icon: BookOpen },
  { title: "Treino", url: "/treino", icon: Dumbbell },
  { title: "Petzinho IA", url: "/petzinho-ia", icon: Bot },
  { title: "Questões Veterinário", url: "/questoes-veterinario", icon: HelpCircle },
  { title: "Perfil", url: "/perfil", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Tutor";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 bg-background rounded-xl p-3 shadow-sm">
          <img src={petlyLogo} alt="Petly" className="h-10 w-10 object-contain rounded-full" />
          {!collapsed && (
            <>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-foreground">Petly</span>
                <span className="text-xs text-muted-foreground">Cuidado inteligente</span>
              </div>
              <SidebarTrigger className="ml-auto text-muted-foreground hover:text-foreground" />
            </>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <NavLink
                        to={item.url}
                        end
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                        activeClassName="!bg-sidebar-accent !text-sidebar-foreground font-semibold"
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-foreground">
                {initials}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-sidebar-foreground">{displayName}</span>
                <span className="text-xs text-sidebar-foreground/70">Tutor</span>
              </div>
              <button onClick={handleLogout} className="ml-auto text-sidebar-foreground/70 hover:text-sidebar-foreground">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-sidebar-foreground/50 leading-tight">
              🐾 A IA é educativa e preventiva. Não substitui diagnóstico veterinário.
            </p>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
