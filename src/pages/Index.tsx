import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, FolderKanban, Plus, TrendingUp, EyeOff, Eye } from 'lucide-react';
import { calcAnnualCashFlow } from '@/lib/rentalCashFlow';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { TasksDueTodayBanner } from '@/components/dashboard/TasksDueTodayBanner';
import { useProfile } from '@/hooks/useProfile';
import { NewProjectModal } from '@/components/NewProjectModal';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WelcomeModal } from '@/components/dashboard/WelcomeModal';
import type { Project, CategoryBudget, Expense, ProjectType } from '@/types';
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
  payment_method: 'cash' | 'check' | 'card' | 'transfer' | 'financed' | null;
  status: 'estimate' | 'actual';
  description: string | null;
  includes_tax: boolean;
  tax_amount: number | null;
  qb_expense_id: string | null;
  cost_type: string | null;
}

export default function Index() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  
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

      // Calculate construction-only spent per project (for profit calculation)
      const constructionByProject: Record<string, number> = {};
      const transactionByProject: Record<string, number> = {};
      const holdingByProject: Record<string, number> = {};
      (expensesData || []).forEach((e: DBExpense) => {
        if (!e.cost_type || e.cost_type === 'construction') {
          constructionByProject[e.project_id] = (constructionByProject[e.project_id] || 0) + Number(e.amount);
        }
        if (e.cost_type === 'transaction') {
          transactionByProject[e.project_id] = (transactionByProject[e.project_id] || 0) + Number(e.amount);
        }
        if (e.cost_type === 'monthly') {
          holdingByProject[e.project_id] = (holdingByProject[e.project_id] || 0) + Number(e.amount);
        }
      });
      dedupedQbExpenses.forEach((e: any) => {
        if (e.project_id) {
          if (e.category_id && (!e.cost_type || e.cost_type === 'construction')) {
            constructionByProject[e.project_id] = (constructionByProject[e.project_id] || 0) + Number(e.amount);
          }
          if (e.cost_type === 'transaction') {
            transactionByProject[e.project_id] = (transactionByProject[e.project_id] || 0) + Number(e.amount);
          }
          if (e.cost_type === 'monthly') {
            holdingByProject[e.project_id] = (holdingByProject[e.project_id] || 0) + Number(e.amount);
          }
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
        
        // Prioritize the project's total_budget DB column; fall back to category sum
        const categorySumBudget = projectCategories.reduce(
          (sum, cat) => sum + Number(cat.estimatedBudget), 0
        );
        const calculatedTotalBudget = Number(p.total_budget) > 0
          ? Number(p.total_budget)
          : categorySumBudget;
        
        return {
          id: p.id,
          name: p.name,
          address: p.address,
          totalBudget: calculatedTotalBudget,
          startDate: p.start_date,
          status: p.status === 'on_hold' ? 'on-hold' : p.status as 'active' | 'complete',
          projectType: (p.project_type || 'fix_flip') as ProjectType,
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
          constructionSpent: constructionByProject[p.id] || 0,
          closingCostsPct: p.closing_costs_pct ?? undefined,
          closingCostsMode: p.closing_costs_mode || 'pct',
          closingCostsFlat: p.closing_costs_flat ?? undefined,
          holdingCostsPct: p.holding_costs_pct ?? undefined,
          holdingCostsMode: p.holding_costs_mode || 'pct',
          holdingCostsFlat: p.holding_costs_flat ?? undefined,
          transactionCostActual: transactionByProject[p.id] || 0,
          holdingCostActual: holdingByProject[p.id] || 0,
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

  // Demo mode data
  const DEMO_NAMES = [
    'Maple Street Flip', 'Riverside Bungalow', 'Cedar Park Ranch', 'Oakwood Cottage',
    'Sunset Ridge Estate', 'Pinecrest Duplex', 'Harbor View Villa', 'Elm Grove Rehab',
    'Birchwood Heights', 'Willowbrook Manor', 'Stone Creek Lodge', 'Magnolia Place',
  ];
  const DEMO_ADDRESSES = [
    '1234 Elm St, Austin, TX 78701', '5678 Oak Ave, Dallas, TX 75201',
    '910 Maple Dr, Houston, TX 77001', '2468 Pine Ln, San Antonio, TX 78201',
    '1357 Cedar Blvd, Fort Worth, TX 76101', '3690 Birch Rd, Plano, TX 75023',
    '4812 Willow Way, Frisco, TX 75034', '7531 Spruce Ct, Round Rock, TX 78664',
    '9024 Aspen Pl, Georgetown, TX 78626', '6183 Poplar St, Kyle, TX 78640',
    '8472 Juniper Dr, Leander, TX 78641', '3159 Redwood Cir, Pflugerville, TX 78660',
  ];

  const seededRandom = (seed: number) => {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
  };

  const displayProjects = useMemo(() => {
    if (!demoMode) return projects;
    return projects.map((p, i) => {
      const r = (n: number) => seededRandom(i * 100 + n);
      const pp = 120000 + Math.floor(r(3) * 180000);
      const budget = 25000 + Math.floor(r(1) * 80000);
      // Ensure ARV is always well above pp + budget for healthy profit
      const arv = pp + budget + 15000 + Math.floor(r(2) * 60000);
      const spent = Math.floor(budget * (0.3 + r(4) * 0.5));
      return {
        ...p,
        name: DEMO_NAMES[i % DEMO_NAMES.length],
        address: DEMO_ADDRESSES[i % DEMO_ADDRESSES.length],
        totalBudget: budget,
        arv,
        purchasePrice: pp,
        constructionSpent: spent,
        transactionCostActual: 0,
        holdingCostActual: 0,
        closingCostsMode: 'flat',
        closingCostsFlat: 0,
        holdingCostsMode: 'flat',
        holdingCostsFlat: 0,
        categories: p.categories.map((c, ci) => ({
          ...c,
          estimatedBudget: Math.floor(budget / Math.max(p.categories.length, 1) * (0.5 + r(ci + 10))),
          actualSpent: Math.floor((budget / Math.max(p.categories.length, 1)) * (0.1 + r(ci + 20) * 0.6)),
        })),
      };
    });
  }, [demoMode, projects]);

  // Calculate stats
  // Sort by starred first (in saved order), then by start date descending
  const activeProjects = displayProjects
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
    return { types: ['fix_flip', 'new_construction', 'rental'], statuses: ['active'], timeline: 'all' as TimelinePreset };
  })();

  const timelineRange = resolveTimeline(
    profitFilters.timeline || 'all',
    profitFilters.timelineStart,
    profitFilters.timelineEnd,
  );

  // Map status values to match project status format
  const statusMap: Record<string, string> = { active: 'active', complete: 'complete' };
  const filteredProfitProjects = displayProjects.filter(p => {
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
    const constructionSpent = (p as any).constructionSpent || 0;
    const costBasis = p.status === 'complete'
      ? constructionSpent
      : Math.max(constructionSpent, plannedBudget);

    const closingMode = (p as any).closingCostsMode || 'pct';
    const transactionCosts = closingMode === 'actual'
      ? ((p as any).transactionCostActual || 0)
      : closingMode === 'flat'
        ? ((p as any).closingCostsFlat ?? 0)
        : arv * (((p as any).closingCostsPct ?? 6) / 100);

    const holdingMode = (p as any).holdingCostsMode || 'pct';
    const holdingCosts = holdingMode === 'actual'
      ? ((p as any).holdingCostActual || 0)
      : holdingMode === 'flat'
        ? ((p as any).holdingCostsFlat ?? 0)
        : purchasePrice * (((p as any).holdingCostsPct ?? 3) / 100);

    return sum + (arv - purchasePrice - costBasis - transactionCosts - holdingCosts);
  }, 0);

  const totalRentalCashFlow = filteredProfitProjects
    .filter(p => p.projectType === 'rental')
    .reduce((sum, p) => sum + calcAnnualCashFlow(p), 0);

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
      <WelcomeModal />
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDemoMode(d => !d)}
          className={`gap-1.5 text-xs ${demoMode ? 'bg-accent text-accent-foreground' : ''}`}
        >
          {demoMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {demoMode ? 'Exit Demo' : 'Demo Mode'}
        </Button>
      </div>

      {/* Tasks Due Today Banner - High Visibility Alert */}
      <div className="mb-6">
        <TasksDueTodayBanner refreshKey={taskRefreshKey} onTaskCreated={() => setTaskRefreshKey(k => k + 1)} />
      </div>

      <div className="flex gap-6 items-start">
        {/* Main Content */}
        <div className="flex-1 space-y-6">

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
              subtitle={totalRentalCashFlow !== 0
                ? `${formatCurrency(totalRentalCashFlow)}/yr cash flow`
                : `Across ${profitProjectCount} project${profitProjectCount !== 1 ? 's' : ''}`}
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
