import {
  LayoutDashboard,
  FileText,
  Syringe,
  Calendar,
  BookOpen,
  Dumbbell,
  Bot,
  Stethoscope,
  User,
  LogOut,
  FolderOpen,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePrimaryPet } from "@/hooks/useAccountData";
import petlyLogo from "@/assets/petly-logo.png";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navSections = [
  {
    label: "Saúde",
    items: [
      { title: "Prontuário", url: "/prontuario", icon: FileText },
      { title: "Vacinas", url: "/vacinas", icon: Syringe },
      { title: "Agenda", url: "/agenda", icon: Calendar },
    ],
  },
  {
    label: "Bem-estar",
    items: [
      { title: "Diário", url: "/diario", icon: BookOpen },
      { title: "Dicas & Treino", url: "/treino", icon: Dumbbell },
    ],
  },
  {
    label: "Suporte IA",
    items: [
      { title: "Petlyzinho IA", url: "/petzinho-ia", icon: Bot },
      { title: "Preparo p/ Consulta", url: "/questoes-veterinario", icon: Stethoscope },
    ],
  },
  {
    label: "Arquivos",
    items: [
      { title: "Documentos", url: "/documentos", icon: FolderOpen },
    ],
  },
];

export function AppSidebar() {
  const { state, isMobile } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const { data: pet } = usePrimaryPet(user?.id);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img src={petlyLogo} alt="Petly" className="h-9 w-9 object-contain rounded-full" />
          {!collapsed && (
            <>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-sidebar-foreground">Petly</span>
                <span className="text-[10px] text-sidebar-foreground/70">Cuidado inteligente</span>
              </div>
              <SidebarTrigger className="ml-auto text-sidebar-foreground/70 hover:text-sidebar-foreground" />
            </>
          )}
        </div>

        {/* Pet avatar */}
        {!collapsed && pet && (
          <div className="mt-4 flex items-center gap-3 bg-sidebar-accent/40 rounded-lg p-2.5">
            <div className="h-10 w-10 rounded-full bg-sidebar-accent overflow-hidden shrink-0">
              {pet.photo_url ? (
                <img src={pet.photo_url} alt={pet.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-lg">🐾</div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-sidebar-foreground truncate">{pet.name}</span>
              <span className="text-[10px] text-sidebar-foreground/60 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success inline-block" />
                Ativo
              </span>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Home */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/dashboard"}
                  tooltip="Principal"
                >
                  <NavLink
                    to="/dashboard"
                    end
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                    activeClassName="!bg-sidebar-accent !text-sidebar-foreground font-semibold"
                  >
                    <LayoutDashboard className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>Principal</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Grouped sections */}
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider font-semibold px-3">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
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
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4">
        {/* Profile link */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === "/perfil"}
              tooltip="Perfil"
            >
              <NavLink
                to="/perfil"
                end
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                activeClassName="!bg-sidebar-accent !text-sidebar-foreground font-semibold"
              >
                <User className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Perfil & Config.</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {!collapsed ? (
          <button
            onClick={handleLogout}
            className="mt-2 flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full text-sm"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="mx-auto flex items-center justify-center h-9 w-9 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
