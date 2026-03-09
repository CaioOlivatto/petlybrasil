import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { DashboardLayout } from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Prontuario from "./pages/Prontuario";
import Agenda from "./pages/Agenda";
import Diario from "./pages/Diario";
import QuestoesVeterinario from "./pages/QuestoesVeterinario";
import Perfil from "./pages/Perfil";
import Onboarding from "./pages/Onboarding";
import PetzinhoIA from "./pages/PetzinhoIA";
import Emergency from "./pages/Emergency";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="/onboarding" element={
              <ProtectedRoute><Onboarding /></ProtectedRoute>
            } />
            <Route element={
              <ProtectedRoute><DashboardLayout /></ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/prontuario" element={<Prontuario />} />
              <Route path="/vacinas" element={<Dashboard />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/diario" element={<Diario />} />
              <Route path="/treino" element={<Dashboard />} />
              <Route path="/petzinho-ia" element={<PetzinhoIA />} />
              <Route path="/questoes-veterinario" element={<QuestoesVeterinario />} />
              <Route path="/perfil" element={<Perfil />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
