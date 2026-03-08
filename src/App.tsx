import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Prontuario from "./pages/Prontuario";
import Agenda from "./pages/Agenda";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/prontuario" element={<Prontuario />} />
            <Route path="/vacinas" element={<Dashboard />} />
            <Route path="/agenda" element={<Dashboard />} />
            <Route path="/diario" element={<Dashboard />} />
            <Route path="/treino" element={<Dashboard />} />
            <Route path="/petzinho-ia" element={<Dashboard />} />
            <Route path="/questoes-veterinario" element={<Dashboard />} />
            <Route path="/perfil" element={<Dashboard />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
