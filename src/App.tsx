import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SickLeavePage from "./pages/SickLeavePage";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import EmployeesPage from "./pages/EmployeesPage";
import SchedulePage from "./pages/SchedulePage";
import ApprovalsPage from "./pages/ApprovalsPage";
import TimesheetsPage from "./pages/TimesheetsPage";
import CalendarPage from "./pages/CalendarPage";
import MyPage from "./pages/MyPage";
import WageSupplementsPage from "./pages/WageSupplementsPage";
import AbsencePage from "./pages/AbsencePage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import IKMatPage from "./pages/IKMatPage";
import ReportDeviationPage from "./pages/ReportDeviationPage";
import DeviationsPage from "./pages/DeviationsPage";
import HMSPage from "./pages/HMSPage";
import FireSafetyPage from "./pages/FireSafetyPage";
import TrainingPage from "./pages/TrainingPage";
import CourseViewerPage from "./pages/CourseViewerPage";
import CrewsharePage from "./pages/CrewsharePage";
import HandbookPage from "./pages/HandbookPage";
import SettingsPage from "./pages/SettingsPage";
import DisciplinaryCasesPage from "./pages/DisciplinaryCasesPage";
import PayrollPage from "./pages/PayrollPage";
import ReportsPage from "./pages/ReportsPage";
import ShiftSetupPage from "./pages/ShiftSetupPage";
import EquipmentPage from "./pages/EquipmentPage";
import EquipmentDetailPage from "./pages/EquipmentDetailPage";
import EquipmentScanPage from "./pages/EquipmentScanPage";
import SuppliersPage from "./pages/SuppliersPage";
import KioskPage from "./pages/KioskPage";
import RoutinesPage from "./pages/RoutinesPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/kiosk" element={<KioskPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/ansatte" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
            <Route path="/vaktplan" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
            <Route path="/godkjenninger" element={<ProtectedRoute><ApprovalsPage /></ProtectedRoute>} />
            <Route path="/timelister" element={<ProtectedRoute><TimesheetsPage /></ProtectedRoute>} />
            <Route path="/kalender" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/min-side" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
            <Route path="/lonnssatser" element={<ProtectedRoute><WageSupplementsPage /></ProtectedRoute>} />
            <Route path="/fravaer" element={<ProtectedRoute><AbsencePage /></ProtectedRoute>} />
            <Route path="/ik-mat" element={<ProtectedRoute><IKMatPage /></ProtectedRoute>} />
            <Route path="/meld-avvik" element={<ProtectedRoute><ReportDeviationPage /></ProtectedRoute>} />
            <Route path="/avvik" element={<ProtectedRoute><DeviationsPage /></ProtectedRoute>} />
            <Route path="/hms" element={<ProtectedRoute><HMSPage /></ProtectedRoute>} />
            <Route path="/brann" element={<ProtectedRoute><FireSafetyPage /></ProtectedRoute>} />
            <Route path="/opplaering" element={<ProtectedRoute><TrainingPage /></ProtectedRoute>} />
            <Route path="/opplaering/kurs/:courseId" element={<ProtectedRoute><CourseViewerPage /></ProtectedRoute>} />
            <Route path="/crewshare" element={<ProtectedRoute><CrewsharePage /></ProtectedRoute>} />
            <Route path="/personalhandbok" element={<ProtectedRoute><HandbookPage /></ProtectedRoute>} />
            <Route path="/innstillinger" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/disiplinaersaker" element={<ProtectedRoute><DisciplinaryCasesPage /></ProtectedRoute>} />
            <Route path="/lonnskjoring" element={<ProtectedRoute><PayrollPage /></ProtectedRoute>} />
            <Route path="/rapporter" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/vaktoppsett" element={<ProtectedRoute><ShiftSetupPage /></ProtectedRoute>} />
            <Route path="/utstyr" element={<ProtectedRoute><EquipmentPage /></ProtectedRoute>} />
            <Route path="/utstyr/:id" element={<ProtectedRoute><EquipmentDetailPage /></ProtectedRoute>} />
            <Route path="/utstyr/skann" element={<ProtectedRoute><EquipmentScanPage /></ProtectedRoute>} />
            <Route path="/utstyr/leverandorer" element={<ProtectedRoute><SuppliersPage /></ProtectedRoute>} />
            <Route path="/rutiner" element={<ProtectedRoute><RoutinesPage /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
