import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Heart,
  BookOpen,
  Bot,
  User,
} from "lucide-react";

const tabs = [
  { label: "Home", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Saúde", icon: Heart, path: "/prontuario" },
  { label: "Diário", icon: BookOpen, path: "/diario" },
  { label: "IA", icon: Bot, path: "/petzinho-ia" },
  { label: "Perfil", icon: User, path: "/perfil" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around h-16 md:hidden">
      {tabs.map((tab) => {
        const isActive =
          location.pathname === tab.path ||
          (tab.path === "/prontuario" && ["/prontuario", "/vacinas", "/agenda"].includes(location.pathname));

        return (
          <button
            key={tab.label}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
