import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import pawPattern from "@/assets/paw-pattern.png";
import { Menu } from "lucide-react";

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div
          className="flex-1 flex flex-col min-w-0"
          style={{
            backgroundImage: `url(${pawPattern})`,
            backgroundSize: "300px",
            backgroundRepeat: "repeat",
          }}
        >
          {/* Mobile header with trigger */}
          <header className="md:hidden flex items-center gap-3 p-4 bg-accent">
            <SidebarTrigger className="text-accent-foreground">
              <Menu className="h-6 w-6" />
            </SidebarTrigger>
            <span className="font-bold text-accent-foreground">Petly</span>
          </header>

          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
