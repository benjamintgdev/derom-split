import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AgentsList from "@/pages/agents/AgentsList";
import AgentForm from "@/pages/agents/AgentForm";
import AgentDetail from "@/pages/agents/AgentDetail";
import SalesList from "@/pages/sales/SalesList";
import SaleForm from "@/pages/sales/SaleForm";
import SaleDetail from "@/pages/sales/SaleDetail";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <DataProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="ventas" element={<SalesList />} />
          <Route path="ventas/nueva" element={<SaleForm />} />
          <Route path="ventas/:id" element={<SaleDetail />} />
          <Route path="ventas/:id/editar" element={<SaleForm />} />
          <Route path="agentes" element={<AgentsList />} />
          <Route path="agentes/nuevo" element={<AgentForm />} />
          <Route path="agentes/:id" element={<AgentDetail />} />
          <Route path="agentes/:id/editar" element={<AgentForm />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </DataProvider>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
