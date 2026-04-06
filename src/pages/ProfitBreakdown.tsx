import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, AlertCircle, Loader2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import DashboardPreferencesCard from '@/components/settings/DashboardPreferencesCard';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { resolveTimeline, isDateInRange, type TimelinePreset } from '@/lib/timelineFilter';
import { calcAnnualCashFlow } from '@/lib/rentalCashFlow';

type StatusFilter = 'all' | 'active' | 'complete';

const ALL_TYPES = ['fix_flip', 'new_construction', 'rental'];
const ALL_STATUSES = ['active', 'complete'];

// Read dashboard preferences once at module level for initial state
const readDashFilters = () => {
  try {
    const raw = localStorage.getItem('dashboard-profit-filters');
    if (raw) return JSON.parse(raw) as { types?: string[]; statuses?: string[]; timeline?: TimelinePreset; timelineStart?: string; timelineEnd?: string };
  } catch {}
  return {} as { types?: string[]; statuses?: string[]; timeline?: TimelinePreset; timelineStart?: string; timelineEnd?: string };
};

const deriveInitialStatus = (prefs: { statuses?: string[] }): StatusFilter => {
  const s = prefs.statuses;
  if (!s || s.length === 0 || s.length === ALL_STATUSES.length) return 'all';
  if (s.length === 1 && s[0] === 'active') return 'active';
  if (s.length === 1 && s[0] === 'complete') return 'complete';
  return 'all';
};

const deriveSelectedTypes = (prefs: { types?: string[] }): Set<string> => {
  const t = prefs.types;
  if (!t || t.length === 0 || t.length === ALL_TYPES.length) return new Set(ALL_TYPES);
  return new Set(t);
};

interface ProjectProfit {
  id: string;
  name: string;
  arv: number;
  purchasePrice: number;
  plannedBudget: number;
  actualSpent: number;
  costBasis: number;
  costSource: 'budget' | 'actual';
  loanCosts: number;
  monthlyCosts: number;
  transactionCosts: number;
  holdingCosts: number;
  profit: number;
  status: string;
  projectType: string;
  startDate?: string;
  isRental: boolean;
  annualCashFlow: number;
}

interface UnconfiguredProject {
  id: string;
  name: string;
  status: string;
  projectType: string;
  startDate?: string;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'complete', label: 'Completed' },
];

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'fix_flip', label: 'Fix & Flip' },
  { value: 'new_construction', label: 'New Construction' },
  { value: 'rental', label: 'Rental' },
];

export default function ProfitBreakdown() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [configured, setConfigured] = useState<ProjectProfit[]>([]);
  const [unconfigured, setUnconfigured] = useState<UnconfiguredProject[]>([]);

  // Read preferences and derive initial filter state
  const dashFilters = useMemo(() => readDashFilters(), []);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => deriveInitialStatus(dashFilters));
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(() => deriveSelectedTypes(dashFilters));

  const [timelineRange, setTimelineRange] = useState(() =>
    resolveTimeline(dashFilters.timeline || 'all', dashFilters.timelineStart, dashFilters.timelineEnd)
  );

  // Listen for settings-changed events to live-update filters
  useEffect(() => {
    const handleSettingsChanged = () => {
      const newFilters = readDashFilters();
      setStatusFilter(deriveInitialStatus(newFilters));
      setSelectedTypes(deriveSelectedTypes(newFilters));
      setTimelineRange(resolveTimeline(newFilters.timeline || 'all', newFilters.timelineStart, newFilters.timelineEnd));
    };
    window.addEventListener('settings-changed', handleSettingsChanged);
    return () => window.removeEventListener('settings-changed', handleSettingsChanged);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, categoriesRes, expensesRes, qbRes, loanRes] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('project_categories').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('quickbooks_expenses').select('*').eq('is_imported', true),
        supabase.from('loan_payments').select('project_id, amount'),
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (expensesRes.error) throw expensesRes.error;

      const projects = projectsRes.data || [];
      const categories = categoriesRes.data || [];
      const expenses = expensesRes.data || [];
      const qbExpenses = qbRes.data || [];
      const loanPayments = loanRes.data || [];

      // Sum loan costs per project
      const loansByProject: Record<string, number> = {};
      loanPayments.forEach((lp: any) => {
        if (lp.project_id) {
          loansByProject[lp.project_id] = (loansByProject[lp.project_id] || 0) + Number(lp.amount);
        }
      });

      // Sum monthly and transaction costs per project
      const monthlyByProject: Record<string, number> = {};
      const transactionByProject: Record<string, number> = {};
      expenses.forEach((e) => {
        if (e.expense_type === 'monthly' && e.project_id) {
          monthlyByProject[e.project_id] = (monthlyByProject[e.project_id] || 0) + Number(e.amount);
        }
        if (e.cost_type === 'transaction' && e.project_id) {
          transactionByProject[e.project_id] = (transactionByProject[e.project_id] || 0) + Number(e.amount);
        }
      });

      const importedQbIds = new Set(
        expenses.filter((e) => e.qb_expense_id).map((e) => e.qb_expense_id)
      );
      const dedupedQb = qbExpenses.filter((qb) => !importedQbIds.has(qb.id));

      const expensesByCategory: Record<string, number> = {};
      const constructionByCategory: Record<string, number> = {};
      expenses.forEach((e) => {
        if (e.category_id) {
          expensesByCategory[e.category_id] = (expensesByCategory[e.category_id] || 0) + Number(e.amount);
          if (!e.cost_type || e.cost_type === 'construction') {
            constructionByCategory[e.category_id] = (constructionByCategory[e.category_id] || 0) + Number(e.amount);
          }
        }
      });
      dedupedQb.forEach((e) => {
        if (e.category_id) {
          expensesByCategory[e.category_id] = (expensesByCategory[e.category_id] || 0) + Number(e.amount);
          if (!e.cost_type || e.cost_type === 'construction') {
            constructionByCategory[e.category_id] = (constructionByCategory[e.category_id] || 0) + Number(e.amount);
          }
        }
      });

      const configuredList: ProjectProfit[] = [];
      const unconfiguredList: UnconfiguredProject[] = [];

      projects.forEach((p) => {
        const arv = p.arv ?? 0;
        const purchasePrice = p.purchase_price ?? 0;

        if (arv <= 0) {
          unconfiguredList.push({ id: p.id, name: p.name, status: p.status, projectType: p.project_type, startDate: p.start_date });
          return;
        }

        const projectCats = categories.filter((c) => c.project_id === p.id);
        const plannedBudget = projectCats.reduce((s, c) => s + Number(c.estimated_budget), 0);
        const constructionSpent = projectCats.reduce((s, c) => s + (constructionByCategory[c.id] || 0), 0);
        const costBasis = p.status === 'complete' ? constructionSpent : Math.max(constructionSpent, plannedBudget);
        const costSource = p.status === 'complete' ? 'actual' as const : (constructionSpent > plannedBudget ? 'actual' as const : 'budget' as const);
        const loanCosts = loansByProject[p.id] || 0;
        const monthlyCosts = monthlyByProject[p.id] || 0;

        // Transaction costs (closing costs) — same logic as ProjectCard
        const closingMode = p.closing_costs_mode || 'pct';
        const transactionCosts = closingMode === 'actual'
          ? (transactionByProject[p.id] || 0)
          : closingMode === 'flat'
            ? (p.closing_costs_flat ?? 0)
            : arv * ((p.closing_costs_pct ?? 6) / 100);

        // Holding costs — same logic as ProjectCard
        const holdingMode = p.holding_costs_mode || 'pct';
        const holdingCosts = holdingMode === 'actual'
          ? (monthlyByProject[p.id] || 0)
          : holdingMode === 'flat'
            ? (p.holding_costs_flat ?? 0)
            : purchasePrice * ((p.holding_costs_pct ?? 3) / 100);

        const profit = arv - purchasePrice - costBasis - transactionCosts - holdingCosts;

        const isRental = p.project_type === 'rental';
        const annualCashFlow = isRental ? calcAnnualCashFlow({
          monthlyRent: p.monthly_rent ?? undefined,
          vacancyRate: p.vacancy_rate ?? undefined,
          loanAmount: p.loan_amount ?? undefined,
          interestRate: p.interest_rate ?? undefined,
          loanTermYears: p.loan_term_years ?? undefined,
          annualPropertyTaxes: p.annual_property_taxes ?? undefined,
          annualInsurance: p.annual_insurance ?? undefined,
          annualHoa: p.annual_hoa ?? undefined,
          monthlyMaintenance: p.monthly_maintenance ?? undefined,
          managementRate: p.management_rate ?? undefined,
        }) : 0;

        configuredList.push({
          id: p.id, name: p.name, arv, purchasePrice, plannedBudget, actualSpent: constructionSpent,
          costBasis, costSource, loanCosts, monthlyCosts, transactionCosts, holdingCosts,
          profit, status: p.status, projectType: p.project_type, startDate: p.start_date,
          isRental, annualCashFlow,
        });
      });

      setConfigured(configuredList);
      setUnconfigured(unconfiguredList);
    } catch (error) {
      console.error('Error fetching profit data:', error);
      toast({ title: 'Error', description: 'Failed to load profit data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeToggle = (value: string) => {
    if (value === 'all') {
      setSelectedTypes(new Set(ALL_TYPES));
      return;
    }
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
        if (next.size === 0) return new Set(ALL_TYPES); // prevent empty
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const isAllSelected = selectedTypes.size === ALL_TYPES.length;

  const applyFilters = <T extends { status: string; projectType: string; startDate?: string }>(list: T[]): T[] => {
    return list.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!isAllSelected && !selectedTypes.has(item.projectType)) return false;
      if (!isDateInRange(item.startDate, timelineRange)) return false;
      return true;
    });
  };

  const filteredConfigured = useMemo(() => applyFilters(configured), [configured, statusFilter, selectedTypes, timelineRange]);
  const filteredUnconfigured = useMemo(() => applyFilters(unconfigured), [unconfigured, statusFilter, selectedTypes, timelineRange]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const totalProfit = filteredConfigured.reduce((s, p) => s + p.profit, 0);
  const totalARV = filteredConfigured.reduce((s, p) => s + p.arv, 0);
  const totalPurchase = filteredConfigured.reduce((s, p) => s + p.purchasePrice, 0);
  const totalCost = filteredConfigured.reduce((s, p) => s + p.costBasis, 0);
  const totalLoan = filteredConfigured.reduce((s, p) => s + p.loanCosts, 0);
  const totalMonthly = filteredConfigured.reduce((s, p) => s + p.monthlyCosts, 0);
  const totalTransaction = filteredConfigured.reduce((s, p) => s + p.transactionCosts, 0);
  const totalHolding = filteredConfigured.reduce((s, p) => s + p.holdingCosts, 0);
  const totalCashFlow = filteredConfigured.reduce((s, p) => s + p.annualCashFlow, 0);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Profit Potential</h1>
          <p className="text-sm text-muted-foreground">
            Per-project breakdown across {filteredConfigured.length} project{filteredConfigured.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
          {fmt(totalProfit)}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <div className="w-px h-5 bg-border mx-1" />
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleTypeToggle(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              (opt.value === 'all' && isAllSelected) || (opt.value !== 'all' && selectedTypes.has(opt.value))
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {filteredConfigured.length > 0 ? (
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead className="text-center">ARV</TableHead>
                <TableHead className="text-center">Purchase Price</TableHead>
                <TableHead className="text-center">
                  <span className="inline-flex items-center gap-1 justify-center">
                    Construction Costs
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[220px] text-xs">
                          Shows whichever is higher: your estimated budget or actual spending. For completed projects, actual spending is always used.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </TableHead>
                <TableHead className="text-center">Transaction Costs</TableHead>
                <TableHead className="text-center">Holding Costs</TableHead>
                <TableHead className="text-center">Profit / Equity</TableHead>
                <TableHead className="text-center">Cash Flow</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConfigured.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                  <TableCell className="font-medium">
                    <span>{p.name}</span>
                  </TableCell>
                  <TableCell className="text-center">{fmt(p.arv)}</TableCell>
                  <TableCell className="text-center">{fmt(p.purchasePrice)}</TableCell>
                  <TableCell className="text-center">
                    <span>{fmt(p.costBasis)}</span>
                    <span className="ml-1.5 text-xs text-muted-foreground">({p.costSource})</span>
                  </TableCell>
                  <TableCell className="text-center">{fmt(p.transactionCosts)}</TableCell>
                  <TableCell className="text-center">{fmt(p.holdingCosts)}</TableCell>
                  <TableCell className={`text-center font-semibold ${p.profit >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                    {fmt(p.profit)}
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {p.isRental ? (
                      <span className={p.annualCashFlow >= 0 ? 'text-emerald-500' : 'text-destructive'}>
                        {fmt(p.annualCashFlow)}/yr
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-center font-semibold">{fmt(totalARV)}</TableCell>
                <TableCell className="text-center font-semibold">{fmt(totalPurchase)}</TableCell>
                <TableCell className="text-center font-semibold">{fmt(totalCost)}</TableCell>
                <TableCell className="text-center font-semibold">{fmt(totalTransaction)}</TableCell>
                <TableCell className="text-center font-semibold">{fmt(totalHolding)}</TableCell>
                <TableCell className={`text-center font-bold ${totalProfit >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                  {fmt(totalProfit)}
                </TableCell>
                <TableCell className={`text-center font-bold ${totalCashFlow >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                  {fmt(totalCashFlow)}/yr
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No projects match the current filters</p>
        </div>
      )}

      {/* Unconfigured projects */}
      {filteredUnconfigured.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">Missing ARV / Purchase Price</h3>
          </div>
          <div className="space-y-1">
            {filteredUnconfigured.map((p) => (
              <div
                key={p.id}
                className="glass-card px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <span className="text-sm">{p.name}</span>
                <span className="text-xs text-muted-foreground">Configure →</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <DashboardPreferencesCard />
      </div>
    </MainLayout>
  );
}
