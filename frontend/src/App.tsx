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
import UserListPage from "./pages/UserListPage";
import ExpenseListPage from "./pages/ExpenseListPage";
import ExpenseDetailPage from "./pages/ExpenseDetailPage";
import NewExpensePage from "./pages/NewExpensePage";
import EditExpensePage from "./pages/EditExpensePage";
import VehicleListPage from "./pages/VehicleListPage";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import NewVehiclePage from "./pages/NewVehiclePage";
import EditVehiclePage from "./pages/EditVehiclePage";
import DriverListPage from "./pages/DriverListPage";
import DriverDetailPage from "./pages/DriverDetailPage";
import NewDriverPage from "./pages/NewDriverPage";
import EditDriverPage from "./pages/EditDriverPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

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
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shipments/new"
        element={
          <ProtectedRoute>
            <NewShipmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shipments/:id/edit"
        element={
          <ProtectedRoute>
            <EditShipmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shipments/courrier"
        element={
          <ProtectedRoute>
            <ShipmentListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shipments/colis"
        element={
          <ProtectedRoute>
            <ShipmentListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shipments"
        element={
          <ProtectedRoute>
            <ShipmentListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shipments/:id"
        element={
          <ProtectedRoute>
            <ShipmentDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/departures/new"
        element={
          <ProtectedRoute>
            <NewDeparturePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/departures"
        element={
          <ProtectedRoute>
            <DepartureListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/departures/:id"
        element={
          <ProtectedRoute>
            <DepartureDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles/new"
        element={
          <ProtectedRoute>
            <NewVehiclePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles/:id/edit"
        element={
          <ProtectedRoute>
            <EditVehiclePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles/:id"
        element={
          <ProtectedRoute>
            <VehicleDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute>
            <VehicleListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drivers/new"
        element={
          <ProtectedRoute>
            <NewDriverPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drivers/:id/edit"
        element={
          <ProtectedRoute>
            <EditDriverPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drivers/:id"
        element={
          <ProtectedRoute>
            <DriverDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drivers"
        element={
          <ProtectedRoute>
            <DriverListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UserListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses/new"
        element={
          <ProtectedRoute>
            <NewExpensePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses/:id/edit"
        element={
          <ProtectedRoute>
            <EditExpensePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses/:id"
        element={
          <ProtectedRoute>
            <ExpenseDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <ExpenseListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/waybills"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/distribution"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
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
