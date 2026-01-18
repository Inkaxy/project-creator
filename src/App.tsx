import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import EmployeesPage from "./pages/EmployeesPage";
import SchedulePage from "./pages/SchedulePage";
import ApprovalsPage from "./pages/ApprovalsPage";
import TimesheetsPage from "./pages/TimesheetsPage";
import CalendarPage from "./pages/CalendarPage";
import MyPage from "./pages/MyPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/ansatte" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
            <Route path="/vaktplan" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
            <Route path="/godkjenninger" element={<ProtectedRoute><ApprovalsPage /></ProtectedRoute>} />
            <Route path="/timelister" element={<ProtectedRoute><TimesheetsPage /></ProtectedRoute>} />
            <Route path="/kalender" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/min-side" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
