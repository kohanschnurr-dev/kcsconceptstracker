import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, AlertCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ProjectProfit {
  id: string;
  name: string;
  arv: number;
  purchasePrice: number;
  plannedBudget: number;
  actualSpent: number;
  costBasis: number;
  costSource: 'budget' | 'actual';
  profit: number;
}

export default function ProfitBreakdown() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [configured, setConfigured] = useState<ProjectProfit[]>([]);
  const [unconfigured, setUnconfigured] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, categoriesRes, expensesRes, qbRes] = await Promise.all([
        supabase.from('projects').select('*').eq('status', 'active').order('created_at', { ascending: false }),
        supabase.from('project_categories').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('quickbooks_expenses').select('*').eq('is_imported', true),
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (expensesRes.error) throw expensesRes.error;

      const projects = projectsRes.data || [];
      const categories = categoriesRes.data || [];
      const expenses = expensesRes.data || [];
      const qbExpenses = qbRes.data || [];

      // Dedupe QB expenses
      const importedQbIds = new Set(
        expenses.filter((e) => e.qb_expense_id).map((e) => e.qb_expense_id)
      );
      const dedupedQb = qbExpenses.filter((qb) => !importedQbIds.has(qb.id));

      // Expense totals by category
      const expensesByCategory: Record<string, number> = {};
      expenses.forEach((e) => {
        if (e.category_id) {
          expensesByCategory[e.category_id] = (expensesByCategory[e.category_id] || 0) + Number(e.amount);
        }
      });
      dedupedQb.forEach((e) => {
        if (e.category_id) {
          expensesByCategory[e.category_id] = (expensesByCategory[e.category_id] || 0) + Number(e.amount);
        }
      });

      const configuredList: ProjectProfit[] = [];
      const unconfiguredList: { id: string; name: string }[] = [];

      projects.forEach((p) => {
        const arv = p.arv ?? 0;
        const purchasePrice = p.purchase_price ?? 0;

        if (arv <= 0) {
          unconfiguredList.push({ id: p.id, name: p.name });
          return;
        }

        const projectCats = categories.filter((c) => c.project_id === p.id);
        const plannedBudget = projectCats.reduce((s, c) => s + Number(c.estimated_budget), 0);
        const actualSpent = projectCats.reduce((s, c) => s + (expensesByCategory[c.id] || 0), 0);
        const costBasis = Math.max(actualSpent, plannedBudget);
        const costSource = actualSpent > plannedBudget ? 'actual' : 'budget';
        const profit = arv - purchasePrice - costBasis;

        configuredList.push({ id: p.id, name: p.name, arv, purchasePrice, plannedBudget, actualSpent, costBasis, costSource, profit });
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

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const totalProfit = configured.reduce((s, p) => s + p.profit, 0);
  const totalARV = configured.reduce((s, p) => s + p.arv, 0);
  const totalPurchase = configured.reduce((s, p) => s + p.purchasePrice, 0);
  const totalCost = configured.reduce((s, p) => s + p.costBasis, 0);

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
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Profit Potential</h1>
          <p className="text-sm text-muted-foreground">Per-project breakdown across {configured.length} active project{configured.length !== 1 ? 's' : ''}</p>
        </div>
        <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
          {fmt(totalProfit)}
        </div>
      </div>

      {/* Table */}
      {configured.length > 0 ? (
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">ARV</TableHead>
                <TableHead className="text-right">Purchase Price</TableHead>
                <TableHead className="text-right">Rehab Costs</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configured.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right">{fmt(p.arv)}</TableCell>
                  <TableCell className="text-right">{fmt(p.purchasePrice)}</TableCell>
                  <TableCell className="text-right">
                    <span>{fmt(p.costBasis)}</span>
                    <span className="ml-1.5 text-xs text-muted-foreground">({p.costSource})</span>
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${p.profit >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                    {fmt(p.profit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold">{fmt(totalARV)}</TableCell>
                <TableCell className="text-right font-semibold">{fmt(totalPurchase)}</TableCell>
                <TableCell className="text-right font-semibold">{fmt(totalCost)}</TableCell>
                <TableCell className={`text-right font-bold ${totalProfit >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                  {fmt(totalProfit)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No projects with ARV configured yet</p>
        </div>
      )}

      {/* Unconfigured projects */}
      {unconfigured.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">Missing ARV / Purchase Price</h3>
          </div>
          <div className="space-y-1">
            {unconfigured.map((p) => (
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
    </MainLayout>
  );
}
