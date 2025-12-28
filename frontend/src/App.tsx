import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import NewShipmentPage from "./pages/NewShipmentPage";
import EditShipmentPage from "./pages/EditShipmentPage";
import ShipmentListPage from "./pages/ShipmentListPage";
import ShipmentDetailPage from "./pages/ShipmentDetailPage";
import DepartureListPage from "./pages/DepartureListPage";
import DepartureDetailPage from "./pages/DepartureDetailPage";
import NewDeparturePage from "./pages/NewDeparturePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/shipments/new" element={<ProtectedRoute><NewShipmentPage /></ProtectedRoute>} />
      <Route path="/shipments/:id/edit" element={<ProtectedRoute><EditShipmentPage /></ProtectedRoute>} />
      <Route path="/shipments" element={<ProtectedRoute><ShipmentListPage /></ProtectedRoute>} />
      <Route path="/shipments/:id" element={<ProtectedRoute><ShipmentDetailPage /></ProtectedRoute>} />
      <Route path="/departures/new" element={<ProtectedRoute><NewDeparturePage /></ProtectedRoute>} />
      <Route path="/departures" element={<ProtectedRoute><DepartureListPage /></ProtectedRoute>} />
      <Route path="/departures/:id" element={<ProtectedRoute><DepartureDetailPage /></ProtectedRoute>} />
      <Route path="/waybills" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/finance" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/distribution" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
