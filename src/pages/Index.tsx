import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, FolderKanban, Plus, TrendingUp } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { QuickTaskInput } from '@/components/dashboard/QuickTaskInput';
import { TasksDueTodayBanner } from '@/components/dashboard/TasksDueTodayBanner';
import { useProfile } from '@/hooks/useProfile';
import { NewProjectModal } from '@/components/NewProjectModal';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Project, CategoryBudget, Expense } from '@/types';
import { startOfMonth, isAfter } from 'date-fns';
import { resolveTimeline, isDateInRange, type TimelinePreset } from '@/lib/timelineFilter';

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
  qb_expense_id: string | null;
}

export default function Index() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [taskRefreshKey, setTaskRefreshKey] = useState(0);
  const { profile, isProjectStarred, toggleStarProject } = useProfile();

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

      // Collect QB IDs already imported as regular expenses to prevent duplicates
      const importedQbIds = new Set(
        (expensesData || [])
          .filter((e: DBExpense) => e.qb_expense_id)
          .map((e: any) => e.qb_expense_id)
      );
      const dedupedQbExpenses = (qbExpensesData || []).filter((qb: any) => !importedQbIds.has(qb.id));

      // Calculate actual spent per category (include both regular and deduped QB expenses)
      const expensesByCategory: Record<string, number> = {};
      (expensesData || []).forEach((e: DBExpense) => {
        expensesByCategory[e.category_id] = (expensesByCategory[e.category_id] || 0) + Number(e.amount);
      });
      // Include only non-duplicate QuickBooks imported expenses
      dedupedQbExpenses.forEach((e: any) => {
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
          coverPhotoPath: p.cover_photo_path || undefined,
          coverPhotoPosition: p.cover_photo_position || undefined,
          completedDate: (p as any).completed_date || undefined,
          arv: p.arv ?? 0,
          purchasePrice: p.purchase_price ?? 0,
          monthlyRent: p.monthly_rent ?? undefined,
          loanAmount: p.loan_amount ?? undefined,
          interestRate: p.interest_rate ?? undefined,
          loanTermYears: p.loan_term_years ?? undefined,
          annualPropertyTaxes: p.annual_property_taxes ?? undefined,
          annualInsurance: p.annual_insurance ?? undefined,
          annualHoa: p.annual_hoa ?? undefined,
          vacancyRate: p.vacancy_rate ?? undefined,
          monthlyMaintenance: p.monthly_maintenance ?? undefined,
          managementRate: p.management_rate ?? undefined,
          cashflowRehabOverride: p.cashflow_rehab_override ?? null,
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

      // Include only non-duplicate QuickBooks imported expenses for dashboard stats
      const qbImportedExpenses: Expense[] = dedupedQbExpenses
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
  // Sort by starred first (in saved order), then by start date descending
  const activeProjects = projects
    .filter(p => p.status === 'active')
    .sort((a, b) => {
      const starredList = profile?.starred_projects as string[] || [];
      const aIdx = starredList.indexOf(a.id);
      const bIdx = starredList.indexOf(b.id);
      const aStarred = aIdx >= 0;
      const bStarred = bIdx >= 0;
      if (aStarred && !bStarred) return -1;
      if (!aStarred && bStarred) return 1;
      if (aStarred && bStarred) return aIdx - bIdx;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  const totalBudget = activeProjects.reduce((sum, p) => sum + p.totalBudget, 0);
  const totalSpent = activeProjects.reduce((sum, p) => 
    sum + p.categories.reduce((catSum, cat) => catSum + cat.actualSpent, 0), 0
  );

  // Read profit filter preferences from localStorage
  const profitFilters = (() => {
    try {
      const raw = localStorage.getItem('dashboard-profit-filters');
      if (raw) return JSON.parse(raw) as { types: string[]; statuses: string[]; timeline?: TimelinePreset; timelineStart?: string; timelineEnd?: string };
    } catch {}
    return { types: ['fix_flip', 'rental', 'new_construction', 'wholesaling'], statuses: ['active'], timeline: 'all' as TimelinePreset };
  })();

  const timelineRange = resolveTimeline(
    profitFilters.timeline || 'all',
    profitFilters.timelineStart,
    profitFilters.timelineEnd,
  );

  // Map status values to match project status format
  const statusMap: Record<string, string> = { active: 'active', complete: 'complete' };
  const filteredProfitProjects = projects.filter(p => {
    const statusMatch = profitFilters.statuses.some(s => {
      const mapped = statusMap[s] || s;
      return p.status === mapped || (s === 'complete' && p.status === 'complete');
    });
    const typeMatch = profitFilters.types.includes(p.projectType);
    if (!statusMatch || !typeMatch || (p as any).arv <= 0) return false;
    return isDateInRange(p.startDate, timelineRange);
  });

  const profitProjectCount = filteredProfitProjects.length;
  const totalProfitPotential = filteredProfitProjects.reduce((sum, p) => {
    const arv = (p as any).arv || 0;
    const purchasePrice = (p as any).purchasePrice || 0;
    const plannedBudget = p.totalBudget;
    const actualSpent = p.categories.reduce((s, c) => s + c.actualSpent, 0);
    const costBasis = Math.max(actualSpent, plannedBudget);
    return sum + (arv - purchasePrice - costBasis);
  }, 0);

  // This month stats - include both regular expenses and QuickBooks imported expenses
  const monthStart = startOfMonth(new Date());
  const thisMonthExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.date);
    return expenseDate >= monthStart;
  });
  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);


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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Budget"
              value={formatCurrency(totalBudget)}
              subtitle={`${formatCurrency(totalSpent)} spent`}
              icon={DollarSign}
              variant="success"
            />
            <StatCard
              title="This Month"
              value={formatCurrency(thisMonthTotal)}
              subtitle={`${thisMonthExpenses.length} transactions`}
              icon={TrendingUp}
              variant="default"
              onClick={() => navigate('/expenses')}
            />
            <StatCard
              title="Profit Potential"
              value={formatCurrency(totalProfitPotential)}
              subtitle={`Across ${profitProjectCount} project${profitProjectCount !== 1 ? 's' : ''}`}
              icon={TrendingUp}
              variant={totalProfitPotential >= 0 ? 'success' : 'danger'}
              onClick={() => navigate('/profit')}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    isStarred={isProjectStarred(project.id)}
                    onToggleStar={(id) => {
                      toggleStarProject.mutate(id, {
                        onError: (err) => {
                          if (err.message === 'max') {
                            toast({ title: 'Limit reached', description: 'You can pin up to 6 projects', variant: 'destructive' });
                          }
                        },
                      });
                    }}
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

        </div>
      </div>

      <NewProjectModal
        open={projectModalOpen}
        onOpenChange={setProjectModalOpen}
        onProjectCreated={fetchData}
      />
    </MainLayout>
  );
}
