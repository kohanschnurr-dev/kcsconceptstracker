import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LandingLayout from "@/components/landing/LandingLayout";

// Landing / public pages
import Landing from "./pages/Landing";
import LandingFeatures from "./pages/LandingFeatures";
import FeatureDetail from "./pages/FeatureDetail";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Demo from "./pages/Demo";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

// Dashboard / protected pages
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import Calendar from "./pages/Calendar";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectBudget from "./pages/ProjectBudget";
import Expenses from "./pages/Expenses";
import BusinessExpenses from "./pages/BusinessExpenses";
import Vendors from "./pages/Vendors";
import DailyLogs from "./pages/DailyLogs";
import BudgetCalculator from "./pages/BudgetCalculator";
import Procurement from "./pages/Procurement";
import Bundles from "./pages/Bundles";
import BundleDetail from "./pages/BundleDetail";
import Auth from "./pages/Auth";
import QuickBooksCallback from "./pages/QuickBooksCallback";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import EULA from "./pages/EULA";
import Settings from "./pages/Settings";
import ProfitBreakdown from "./pages/ProfitBreakdown";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public / landing pages — wrapped in LeadCaptureProvider */}
            <Route path="/" element={<LandingLayout><Landing /></LandingLayout>} />
            <Route path="/features" element={<LandingLayout><LandingFeatures /></LandingLayout>} />
            <Route path="/features/:slug" element={<LandingLayout><FeatureDetail /></LandingLayout>} />
            <Route path="/pricing" element={<LandingLayout><Pricing /></LandingLayout>} />
            <Route path="/about" element={<LandingLayout><About /></LandingLayout>} />
            <Route path="/demo" element={<LandingLayout><Demo /></LandingLayout>} />
            <Route path="/privacy" element={<LandingLayout><Privacy /></LandingLayout>} />
            <Route path="/terms" element={<LandingLayout><Terms /></LandingLayout>} />
            <Route path="/auth" element={<Auth />} />

            {/* Legacy routes */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/eula" element={<EULA />} />

            {/* Protected dashboard routes */}
            <Route path="/quickbooks-callback" element={<ProtectedRoute><QuickBooksCallback /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
            <Route path="/projects/:id/budget" element={<ProtectedRoute><ProjectBudget /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
            <Route path="/business-expenses" element={<ProtectedRoute><BusinessExpenses /></ProtectedRoute>} />
            <Route path="/vendors" element={<ProtectedRoute><Vendors /></ProtectedRoute>} />
            <Route path="/logs" element={<ProtectedRoute><DailyLogs /></ProtectedRoute>} />
            <Route path="/checklist" element={<ProtectedRoute><DailyLogs /></ProtectedRoute>} />
            <Route path="/calculator" element={<ProtectedRoute><BudgetCalculator /></ProtectedRoute>} />
            <Route path="/procurement" element={<ProtectedRoute><Procurement /></ProtectedRoute>} />
            <Route path="/bundles" element={<ProtectedRoute><Bundles /></ProtectedRoute>} />
            <Route path="/bundles/:id" element={<ProtectedRoute><BundleDetail /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            <Route path="/profit" element={<ProtectedRoute><ProfitBreakdown /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
