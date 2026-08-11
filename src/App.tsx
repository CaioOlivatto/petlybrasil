import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "./components/DashboardLayout";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Prontuario = lazy(() => import("./pages/Prontuario"));
const Agenda = lazy(() => import("./pages/Agenda"));
const Diario = lazy(() => import("./pages/Diario"));
const QuestoesVeterinario = lazy(() => import("./pages/QuestoesVeterinario"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const PetzinhoIA = lazy(() => import("./pages/PetzinhoIA"));
const Treino = lazy(() => import("./pages/Treino"));
const Emergency = lazy(() => import("./pages/Emergency"));
const Vacinas = lazy(() => import("./pages/Vacinas"));
const Documentos = lazy(() => import("./pages/Documentos"));
const Assinatura = lazy(() => import("./pages/Assinatura"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div className="min-h-screen bg-background" aria-label="Carregando página" />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="/onboarding" element={
              <ProtectedRoute><Onboarding /></ProtectedRoute>
            } />
            <Route path="/assinatura" element={
              <ProtectedRoute><Assinatura /></ProtectedRoute>
            } />
            <Route element={
              <ProtectedRoute><DashboardLayout /></ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/prontuario" element={<Prontuario />} />
              <Route path="/vacinas" element={<Vacinas />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/diario" element={<Diario />} />
              <Route path="/treino" element={<Treino />} />
              <Route path="/petzinho-ia" element={<PetzinhoIA />} />
              <Route path="/questoes-veterinario" element={<QuestoesVeterinario />} />
              <Route path="/documentos" element={<Documentos />} />
              <Route path="/perfil" element={<Perfil />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
