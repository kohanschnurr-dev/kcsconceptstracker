import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  FolderKanban, 
  AlertTriangle,
  Users,
  Plus,
  TrendingUp
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { BudgetBreakdown } from '@/components/dashboard/BudgetBreakdown';
import { RecentExpenses } from '@/components/dashboard/RecentExpenses';
import { VendorComplianceTable } from '@/components/dashboard/VendorComplianceTable';
import { SpendingDonutChart } from '@/components/dashboard/SpendingDonutChart';
import { SpendingTrendChart } from '@/components/dashboard/SpendingTrendChart';
import { QuickActionButton } from '@/components/QuickActionButton';
import { QuickExpenseModal } from '@/components/QuickExpenseModal';
import { NewProjectModal } from '@/components/NewProjectModal';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Project, CategoryBudget, Vendor, Expense } from '@/types';
import { startOfMonth, isAfter } from 'date-fns';

interface DBCategory {
  id: string;
  project_id: string;
  category: string;
  estimated_budget: number;
}

interface DBVendor {
  id: string;
  name: string;
  trade: string;
  phone: string | null;
  email: string | null;
  has_w9: boolean;
  insurance_expiry: string | null;
  reliability_rating: number | null;
  pricing_model: 'flat' | 'hourly' | null;
}

interface DBExpense {
  id: string;
  project_id: string;
  category_id: string;
  amount: number;
  date: string;
  vendor_name: string | null;
  payment_method: 'cash' | 'check' | 'card' | 'transfer' | null;
  status: 'estimate' | 'actual';
  description: string | null;
  includes_tax: boolean;
  tax_amount: number | null;
}

export default function Index() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('project_categories')
        .select('*');

      if (categoriesError) throw categoriesError;

      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (expensesError) throw expensesError;

      // Fetch vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .order('name');

      if (vendorsError) throw vendorsError;

      // Calculate actual spent per category
      const expensesByCategory: Record<string, number> = {};
      (expensesData || []).forEach((e: DBExpense) => {
        expensesByCategory[e.category_id] = (expensesByCategory[e.category_id] || 0) + Number(e.amount);
      });

      // Transform projects
      const transformedProjects: Project[] = (projectsData || []).map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        totalBudget: p.total_budget,
        startDate: p.start_date,
        status: p.status === 'on_hold' ? 'on-hold' : p.status as 'active' | 'complete',
        projectType: p.project_type as 'fix_flip' | 'rental',
        categories: (categoriesData || [])
          .filter((c: DBCategory) => c.project_id === p.id)
          .map((c: DBCategory) => ({
            id: c.id,
            projectId: c.project_id,
            category: c.category as CategoryBudget['category'],
            estimatedBudget: c.estimated_budget,
            actualSpent: expensesByCategory[c.id] || 0,
          })),
      }));

      // Transform vendors
      const transformedVendors: Vendor[] = (vendorsData || []).map((v: DBVendor) => ({
        id: v.id,
        name: v.name,
        trade: v.trade as Vendor['trade'],
        phone: v.phone || '',
        email: v.email || '',
        hasW9: v.has_w9,
        insuranceExpiry: v.insurance_expiry || '',
        reliabilityRating: v.reliability_rating || 0,
        pricingModel: v.pricing_model || 'flat',
      }));

      // Transform expenses
      const transformedExpenses: Expense[] = (expensesData || []).map((e: DBExpense) => ({
        id: e.id,
        projectId: e.project_id,
        categoryId: e.category_id,
        amount: Number(e.amount),
        date: e.date,
        vendorName: e.vendor_name || 'Unknown',
        paymentMethod: e.payment_method || 'card',
        status: e.status,
        description: e.description || '',
        includesTax: e.includes_tax,
        taxAmount: e.tax_amount ? Number(e.tax_amount) : undefined,
      }));

      setProjects(transformedProjects);
      setVendors(transformedVendors);
      setExpenses(transformedExpenses);
      
      // Set default selected project
      if (transformedProjects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(transformedProjects[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const activeProjects = projects.filter(p => p.status === 'active');
  const totalBudget = projects.reduce((sum, p) => sum + p.totalBudget, 0);
  const totalSpent = projects.reduce((sum, p) => 
    sum + p.categories.reduce((catSum, cat) => catSum + cat.actualSpent, 0), 0
  );
  const overbudgetCount = projects.reduce((count, p) => 
    count + p.categories.filter(cat => cat.actualSpent > cat.estimatedBudget * 1.05).length, 0
  );
  const vendorsNeedingAttention = vendors.filter(v => 
    !v.hasW9 || (v.insuranceExpiry && new Date(v.insuranceExpiry) < new Date())
  ).length;

  // This month stats
  const monthStart = startOfMonth(new Date());
  const thisMonthExpenses = expenses.filter(e => isAfter(new Date(e.date), monthStart));
  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Get all categories from all projects for chart
  const allCategories = projects.flatMap(p => p.categories);
  
  // Transform expenses for charts
  const chartExpenses = expenses.map(e => ({
    categoryId: e.categoryId,
    amount: e.amount,
    date: e.date,
  }));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const projectExpenses = expenses.filter(e => e.projectId === selectedProjectId);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-8 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-card p-5 h-28" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">DFW Fix & Flip Budget Tracker</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="This Month"
            value={formatCurrency(thisMonthTotal)}
            subtitle={`${thisMonthExpenses.length} transactions`}
            icon={TrendingUp}
            variant="default"
          />
          <StatCard
            title="Total Budget"
            value={formatCurrency(totalBudget)}
            subtitle={`${formatCurrency(totalSpent)} spent`}
            icon={DollarSign}
            variant="success"
          />
          <StatCard
            title="Over Budget"
            value={overbudgetCount.toString()}
            subtitle="Categories flagged"
            icon={AlertTriangle}
            variant={overbudgetCount > 0 ? 'danger' : 'success'}
          />
          <StatCard
            title="Vendor Alerts"
            value={vendorsNeedingAttention.toString()}
            subtitle="Need attention"
            icon={Users}
            variant={vendorsNeedingAttention > 0 ? 'warning' : 'success'}
          />
        </div>

        {/* Charts Section */}
        {expenses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SpendingDonutChart 
              expenses={chartExpenses} 
              categories={allCategories.map(c => ({ id: c.id, category: c.category }))}
            />
            <SpendingTrendChart expenses={chartExpenses} days={7} />
          </div>
        )}

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Active Projects</h2>
            {projects.length === 0 && (
              <Button size="sm" onClick={() => setProjectModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            )}
          </div>
          
          {activeProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate(`/projects/${project.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-4">No active projects yet</p>
              <Button onClick={() => setProjectModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Project
              </Button>
            </div>
          )}
        </div>

        {/* Detail Section */}
        {selectedProject && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BudgetBreakdown project={selectedProject} />
            <RecentExpenses 
              expenses={projectExpenses} 
              projectCategories={selectedProject.categories}
            />
          </div>
        )}

        {/* Vendor Compliance */}
        {vendors.length > 0 && <VendorComplianceTable vendors={vendors} />}
      </div>

      {/* Quick Action FAB */}
      <QuickActionButton onClick={() => setExpenseModalOpen(true)} />

      {/* Modals */}
      <QuickExpenseModal
        open={expenseModalOpen}
        onOpenChange={setExpenseModalOpen}
        projects={projects}
        onExpenseCreated={fetchData}
      />
      
      <NewProjectModal
        open={projectModalOpen}
        onOpenChange={setProjectModalOpen}
        onProjectCreated={fetchData}
      />
    </MainLayout>
  );
}
