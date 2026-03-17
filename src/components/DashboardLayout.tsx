import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import pawPattern from "@/assets/paw-pattern.png";
import { Menu, Gem } from "lucide-react";

export function DashboardLayout() {
  const navigate = useNavigate();

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div
          className="flex-1 flex flex-col min-w-0 relative"
          style={{
            backgroundImage: `url(${pawPattern})`,
            backgroundSize: "300px",
            backgroundRepeat: "repeat",
          }}
        >
          {/* White overlay to lighten the pattern */}
          <div className="absolute inset-0 bg-background/50 pointer-events-none" />

          {/* Header with sidebar trigger and upgrade button */}
          <header className="flex items-center justify-between p-3 relative z-10">
            <SidebarTrigger className="h-9 w-9 flex items-center justify-center rounded-lg bg-card border border-border shadow-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <button
              onClick={() => navigate("/assinatura")}
              className="h-9 w-9 flex items-center justify-center rounded-lg bg-accent/10 border border-accent/30 shadow-sm text-accent hover:bg-accent/20 hover:border-accent transition-colors"
              title="Assinar / Upgrade"
            >
              <Gem className="h-5 w-5" />
            </button>
          </header>

          <main className="flex-1 p-4 sm:p-6 relative z-10 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
