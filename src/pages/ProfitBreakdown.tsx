import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import DashboardPreferencesCard from '@/components/settings/DashboardPreferencesCard';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { resolveTimeline, isDateInRange, type TimelinePreset } from '@/lib/timelineFilter';

type StatusFilter = 'all' | 'active' | 'complete';
type TypeFilter = 'all' | 'fix_flip' | 'rental' | 'new_construction' | 'wholesaling';

const ALL_TYPES = ['fix_flip', 'rental', 'new_construction', 'wholesaling'];
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

const deriveInitialType = (prefs: { types?: string[] }): TypeFilter => {
  const t = prefs.types;
  if (!t || t.length === 0 || t.length === ALL_TYPES.length) return 'all';
  if (t.length === 1) return t[0] as TypeFilter;
  return 'all'; // multi-select that doesn't map to a single pill
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

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'fix_flip', label: 'Fix & Flip' },
  { value: 'rental', label: 'Rental' },
  { value: 'new_construction', label: 'New Construction' },
  { value: 'wholesaling', label: 'Wholesaling' },
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
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(() => deriveInitialType(dashFilters));
  // Track preferred types for multi-select filtering when no single pill matches
  const [preferredTypes, setPreferredTypes] = useState<string[] | null>(() => {
    const t = dashFilters.types;
    if (!t || t.length === 0 || t.length === ALL_TYPES.length) return null;
    if (t.length === 1) return null; // single pill handles it
    return t;
  });

  const [timelineRange, setTimelineRange] = useState(() =>
    resolveTimeline(dashFilters.timeline || 'all', dashFilters.timelineStart, dashFilters.timelineEnd)
  );

  // Listen for settings-changed events to live-update filters
  useEffect(() => {
    const handleSettingsChanged = () => {
      const newFilters = readDashFilters();
      setStatusFilter(deriveInitialStatus(newFilters));
      setTypeFilter(deriveInitialType(newFilters));
      const t = newFilters.types;
      if (!t || t.length === 0 || t.length === ALL_TYPES.length) {
        setPreferredTypes(null);
      } else if (t.length === 1) {
        setPreferredTypes(null);
      } else {
        setPreferredTypes(t);
      }
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

        configuredList.push({
          id: p.id, name: p.name, arv, purchasePrice, plannedBudget, actualSpent: constructionSpent,
          costBasis, costSource, loanCosts, monthlyCosts, transactionCosts, holdingCosts,
          profit, status: p.status, projectType: p.project_type, startDate: p.start_date,
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

  const handleTypeFilter = (value: TypeFilter) => {
    setTypeFilter(value);
    setPreferredTypes(null); // user manually selected, clear preference-based multi-filter
  };

  const applyFilters = <T extends { status: string; projectType: string; startDate?: string }>(list: T[]): T[] => {
    return list.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (preferredTypes) {
        if (!preferredTypes.includes(item.projectType)) return false;
      } else if (typeFilter !== 'all' && item.projectType !== typeFilter) {
        return false;
      }
      if (!isDateInRange(item.startDate, timelineRange)) return false;
      return true;
    });
  };

  const filteredConfigured = useMemo(() => applyFilters(configured), [configured, statusFilter, typeFilter, preferredTypes, timelineRange]);
  const filteredUnconfigured = useMemo(() => applyFilters(unconfigured), [unconfigured, statusFilter, typeFilter, preferredTypes, timelineRange]);

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
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
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
            onClick={() => handleTypeFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              typeFilter === opt.value && !preferredTypes
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
                <TableHead className="text-center">Construction Costs</TableHead>
                <TableHead className="text-center">Transaction Costs</TableHead>
                <TableHead className="text-center">Holding Costs</TableHead>
                <TableHead className="text-center">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConfigured.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                  <TableCell className="font-medium">{p.name}</TableCell>
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
