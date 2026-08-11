import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, Gem } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

export function DashboardLayout() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const location = useLocation();

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        {!isMobile && <AppSidebar />}

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            {!isMobile && (
              <SidebarTrigger className="h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
            )}
            {isMobile && <div className="w-9" />}
            <button
              onClick={() => navigate("/assinatura")}
              className="h-9 w-9 flex items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              title="Assinar / Upgrade"
              aria-label="Abrir planos e assinatura"
            >
              <Gem className="h-5 w-5" />
            </button>
          </header>

          <main className="flex-1 p-4 sm:p-6 overflow-auto pb-20 md:pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeInOut" as const }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {isMobile && <MobileBottomNav />}
      </div>
    </SidebarProvider>
  );
}
