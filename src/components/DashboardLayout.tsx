import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, Gem } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export function DashboardLayout() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
            >
              <Gem className="h-5 w-5" />
            </button>
          </header>

          <main className="flex-1 p-4 sm:p-6 overflow-auto pb-20 md:pb-6">
            <Outlet />
          </main>
        </div>

        {isMobile && <MobileBottomNav />}
      </div>
    </SidebarProvider>
  );
}
