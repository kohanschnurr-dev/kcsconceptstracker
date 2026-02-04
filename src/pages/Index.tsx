import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, FolderKanban, Plus, TrendingUp } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { SpendingDonutChart } from '@/components/dashboard/SpendingDonutChart';
import { SpendingTrendChart } from '@/components/dashboard/SpendingTrendChart';
import { QuickTaskInput } from '@/components/dashboard/QuickTaskInput';
import { TasksDueTodayBanner } from '@/components/dashboard/TasksDueTodayBanner';
import { CalendarGlanceWidget } from '@/components/dashboard/CalendarGlanceWidget';
import { QuickActionButton } from '@/components/QuickActionButton';
import { QuickExpenseModal } from '@/components/QuickExpenseModal';
import { NewProjectModal } from '@/components/NewProjectModal';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Project, CategoryBudget, Expense } from '@/types';
import { startOfMonth, isAfter } from 'date-fns';

interface DBCategory {
  id: string;
  project_id: string;
  category: string;
  estimated_budget: number;
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [taskRefreshKey, setTaskRefreshKey] = useState(0);

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

      // Fetch QuickBooks imported expenses
      const { data: qbExpensesData } = await supabase
        .from('quickbooks_expenses')
        .select('*')
        .eq('is_imported', true);
      // Calculate actual spent per category (include both regular and QB expenses)
      const expensesByCategory: Record<string, number> = {};
      (expensesData || []).forEach((e: DBExpense) => {
        expensesByCategory[e.category_id] = (expensesByCategory[e.category_id] || 0) + Number(e.amount);
      });
      // Include QuickBooks imported expenses
      (qbExpensesData || []).forEach((e: any) => {
        if (e.category_id) {
          expensesByCategory[e.category_id] = (expensesByCategory[e.category_id] || 0) + Number(e.amount);
        }
      });

      // Transform projects
      const transformedProjects: Project[] = (projectsData || []).map((p) => {
        // Get categories for this project
        const projectCategories = (categoriesData || [])
          .filter((c: DBCategory) => c.project_id === p.id)
          .map((c: DBCategory) => ({
            id: c.id,
            projectId: c.project_id,
            category: c.category as CategoryBudget['category'],
            estimatedBudget: c.estimated_budget,
            actualSpent: expensesByCategory[c.id] || 0,
          }));
        
        // Calculate total budget from sum of category budgets (not project.total_budget)
        // This keeps it in sync with the Budget & Expenses page
        const calculatedTotalBudget = projectCategories.reduce(
          (sum, cat) => sum + Number(cat.estimatedBudget), 0
        );
        
        return {
          id: p.id,
          name: p.name,
          address: p.address,
          totalBudget: calculatedTotalBudget,
          startDate: p.start_date,
          status: p.status === 'on_hold' ? 'on-hold' : p.status as 'active' | 'complete',
          projectType: p.project_type as 'fix_flip' | 'rental' | 'new_construction' | 'wholesaling',
          categories: projectCategories,
        };
      });

      // Transform expenses - combine regular expenses and QuickBooks imported expenses
      const regularExpenses: Expense[] = (expensesData || []).map((e: DBExpense) => ({
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

      // Include QuickBooks imported expenses for dashboard stats
      const qbImportedExpenses: Expense[] = (qbExpensesData || [])
        .filter((e: any) => e.project_id && e.category_id) // Only count project-assigned expenses
        .map((e: any) => ({
          id: e.id,
          projectId: e.project_id,
          categoryId: e.category_id,
          amount: Number(e.amount),
          date: e.date,
          vendorName: e.vendor_name || 'Unknown',
          paymentMethod: 'card' as const,
          status: 'actual' as const,
          description: e.description || '',
          includesTax: false,
          taxAmount: undefined,
        }));

      const transformedExpenses: Expense[] = [...regularExpenses, ...qbImportedExpenses];

      setProjects(transformedProjects);
      setExpenses(transformedExpenses);
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
  // Sort by project type priority (fix & flips first, then wholesaling, etc.)
  const activeProjects = projects
    .filter(p => p.status === 'active')
    .sort((a, b) => {
      const priority = { fix_flip: 0, wholesaling: 1, new_construction: 2, rental: 3 };
      return (priority[a.projectType] ?? 4) - (priority[b.projectType] ?? 4);
    });
  const totalBudget = projects.reduce((sum, p) => sum + p.totalBudget, 0);
  const totalSpent = projects.reduce((sum, p) => 
    sum + p.categories.reduce((catSum, cat) => catSum + cat.actualSpent, 0), 0
  );

  // This month stats - include both regular expenses and QuickBooks imported expenses
  const monthStart = startOfMonth(new Date());
  const thisMonthExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.date);
    return expenseDate >= monthStart;
  });
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>

      {/* Tasks Due Today Banner - High Visibility Alert */}
      <div className="mb-6">
        <TasksDueTodayBanner refreshKey={taskRefreshKey} />
      </div>

      <div className="flex gap-6 items-start">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Quick Task Input */}
          <div className="glass-card p-4">
            <QuickTaskInput onTaskCreated={() => setTaskRefreshKey(k => k + 1)} />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {/* Right Sidebar - Urgent Tasks & Calendar */}
        <div className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-6">
            <CalendarGlanceWidget refreshKey={taskRefreshKey} />
          </div>
        </div>
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
