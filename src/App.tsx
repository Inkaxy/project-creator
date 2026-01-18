import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import EmployeesPage from "./pages/EmployeesPage";
import SchedulePage from "./pages/SchedulePage";
import ApprovalsPage from "./pages/ApprovalsPage";
import TimesheetsPage from "./pages/TimesheetsPage";
import CalendarPage from "./pages/CalendarPage";
import MyPage from "./pages/MyPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ansatte" element={<EmployeesPage />} />
          <Route path="/vaktplan" element={<SchedulePage />} />
          <Route path="/godkjenninger" element={<ApprovalsPage />} />
          <Route path="/timelister" element={<TimesheetsPage />} />
          <Route path="/kalender" element={<CalendarPage />} />
          <Route path="/min-side" element={<MyPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
