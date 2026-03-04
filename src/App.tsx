import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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

// Force rebuild
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/eula" element={<EULA />} />
            <Route path="/quickbooks-callback" element={<QuickBooksCallback />} />
            <Route path="/" element={<Index />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/projects/:id/budget" element={<ProjectBudget />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/business-expenses" element={<BusinessExpenses />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/logs" element={<DailyLogs />} />
            <Route path="/checklist" element={<DailyLogs />} />
            <Route path="/calculator" element={<BudgetCalculator />} />
            <Route path="/procurement" element={<Procurement />} />
            <Route path="/bundles" element={<Bundles />} />
            <Route path="/bundles/:id" element={<BundleDetail />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/profit" element={<ProfitBreakdown />} />
            <Route path="/settings" element={<Settings />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
