import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Heart,
  BookOpen,
  Bot,
  MoreHorizontal,
  Syringe,
  Calendar,
  Dumbbell,
  Stethoscope,
  FolderOpen,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const mainTabs = [
  { label: "Home", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Saúde", icon: Heart, path: "/prontuario" },
  { label: "Diário", icon: BookOpen, path: "/diario" },
  { label: "IA", icon: Bot, path: "/petzinho-ia" },
];

const moreTabs = [
  { label: "Vacinas", icon: Syringe, path: "/vacinas" },
  { label: "Agenda", icon: Calendar, path: "/agenda" },
  { label: "Dicas & Treino", icon: Dumbbell, path: "/treino" },
  { label: "Preparo p/ Consulta", icon: Stethoscope, path: "/questoes-veterinario" },
  { label: "Documentos", icon: FolderOpen, path: "/documentos" },
  { label: "Perfil", icon: User, path: "/perfil" },
];

const allMorePaths = moreTabs.map((t) => t.path);

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isMoreActive = allMorePaths.includes(location.pathname);

  return (
    <>
      {/* Overlay + expanded menu */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed bottom-16 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl px-4 py-4"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="grid grid-cols-3 gap-3">
                {moreTabs.map((tab) => {
                  const isActive = location.pathname === tab.path;
                  return (
                    <button
                      key={tab.label}
                      onClick={() => {
                        navigate(tab.path);
                        setOpen(false);
                      }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <tab.icon className="h-5 w-5" />
                      <span className="text-[10px] font-medium leading-tight text-center">
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around h-16 md:hidden">
        {mainTabs.map((tab) => {
          const isActive =
            location.pathname === tab.path ||
            (tab.path === "/prontuario" && location.pathname === "/prontuario");

          return (
            <button
              key={tab.label}
              onClick={() => {
                setOpen(false);
                navigate(tab.path);
              }}
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

        {/* More button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
            isMoreActive || open
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {open ? (
            <X className="h-5 w-5" />
          ) : (
            <MoreHorizontal className="h-5 w-5" />
          )}
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </nav>
    </>
  );
}
