import { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { parseDateString } from '@/lib/dateUtils';
import { Printer, FileDown, Calendar, DollarSign, TrendingUp, Clock, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { generatePDF } from '@/lib/pdfExport';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

/* ── types ────────────────────────────────────────────────── */

interface DBProject {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'complete' | 'on_hold';
  project_type: string;
  total_budget: number;
  start_date: string;
  purchase_price?: number | null;
  arv?: number | null;
  completed_date?: string | null;
  hm_loan_amount?: number | null;
  hm_interest_rate?: number | null;
  hm_loan_term_months?: number | null;
  closing_costs_pct?: number | null;
  closing_costs_mode?: string;
  closing_costs_flat?: number | null;
  holding_costs_pct?: number | null;
  holding_costs_mode?: string;
  holding_costs_flat?: number | null;
}

interface DBCategory {
  id: string;
  project_id: string;
  category: string;
  estimated_budget: number;
  actualSpent: number;
}

interface DBExpense {
  id: string;
  project_id: string;
  category_id: string;
  vendor_name: string | null;
  description: string | null;
  amount: number;
  date: string;
  payment_method: string | null;
  status: string;
}

interface ProjectReportProps {
  project: DBProject;
  categories: DBCategory[];
  expenses: DBExpense[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  constructionSpent?: number;
  transactionCostActual?: number;
  holdingCostActual?: number;
}

/* ── helpers ──────────────────────────────────────────────── */

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const fmtPct = (n: number) => `${n.toFixed(1)}%`;

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, var(--primary)))',
  'hsl(var(--chart-3, var(--primary)))',
  'hsl(var(--chart-4, var(--primary)))',
  'hsl(var(--chart-5, var(--primary)))',
  'hsl(var(--muted-foreground))',
];

/* ── component ────────────────────────────────────────────── */

export function ProjectReport({
  project,
  categories,
  expenses,
  open,
  onOpenChange,
  constructionSpent: constructionSpentProp,
  transactionCostActual: _txActual,
  holdingCostActual: _holdActual,
}: ProjectReportProps) {
  const { companyName, logoUrl } = useCompanySettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(t);
    }
    setMounted(false);
  }, [open]);

  /* ── computed ─────────────────────────────────────────── */

  const categoryTotal = categories.reduce((s, c) => s + Number(c.estimated_budget), 0);
  const totalBudget = project.total_budget > 0 ? project.total_budget : categoryTotal;
  const totalSpent = categories.reduce((s, c) => s + c.actualSpent, 0);
  const rehabCost = constructionSpentProp ?? totalSpent;
  const remaining = totalBudget - totalSpent;
  const pct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const budgetColor = pct > 100 ? 'bg-destructive' : pct >= 85 ? 'bg-warning' : 'bg-success';
  const overUnderAmt = Math.abs(remaining);
  const overUnderLabel = remaining >= 0 ? `${fmt(overUnderAmt)} under` : `${fmt(overUnderAmt)} over`;

  const startDate = parseDateString(project.start_date);
  const now = new Date();
  const endDate = project.completed_date ? parseDateString(project.completed_date) : null;
  const daysElapsed = startDate ? Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / 86400000)) : 0;
  const totalProjectedDays = startDate && endDate ? Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / 86400000)) : null;
  const daysRemaining = endDate ? Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 86400000)) : null;
  const timelinePct = totalProjectedDays && totalProjectedDays > 0 ? (daysElapsed / totalProjectedDays) * 100 : null;
  const timelineColor = timelinePct === null ? 'bg-muted-foreground' : timelinePct > 100 ? 'bg-destructive' : timelinePct >= 80 ? 'bg-warning' : 'bg-success';
  const dailyBurn = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
  const projectedTotal = daysRemaining !== null ? totalSpent + dailyBurn * daysRemaining : null;
  const holdPeriodMonths = totalProjectedDays !== null ? Math.round(totalProjectedDays / 30) : (daysElapsed > 0 ? Math.round(daysElapsed / 30) : null);

  /* deal financials */
  const pp = project.purchase_price ?? null;
  const arv = project.arv ?? null;
  const loanAmt = (project as any).hm_loan_amount ?? null;
  const loanRate = (project as any).hm_interest_rate ?? null;
  const holdingFlat = (project as any).holding_costs_flat ?? null;
  const holdingPct = (project as any).holding_costs_pct ?? null;
  const holdingMode = (project as any).holding_costs_mode ?? 'pct';
  const holdPerMonth = holdingMode === 'flat' && holdingFlat ? holdingFlat : (holdingPct && pp ? (holdingPct / 100) * pp / 12 : null);
  const costBasis = pp !== null ? pp + rehabCost + (holdPerMonth && holdPeriodMonths ? holdPerMonth * holdPeriodMonths : 0) : null;
  const sellingCostsPct = 6;
  const projectedSalePrice = arv;
  const sellingCosts = projectedSalePrice ? projectedSalePrice * sellingCostsPct / 100 : null;
  const netProceeds = projectedSalePrice && sellingCosts !== null ? projectedSalePrice - sellingCosts : null;
  const grossProfit = netProceeds !== null && costBasis !== null ? netProceeds - costBasis : null;
  const loanCost = loanAmt && loanRate && holdPeriodMonths ? loanAmt * (loanRate / 100 / 12) * holdPeriodMonths : null;
  const netProfit = grossProfit !== null ? grossProfit - (loanCost ?? 0) : null;

  const roi = useMemo(() => {
    if (costBasis && costBasis > 0 && netProfit !== null) {
      return (netProfit / costBasis) * 100;
    }
    if (arv && pp && pp > 0) {
      const profit = arv - pp - rehabCost;
      return (profit / (pp + rehabCost)) * 100;
    }
    return null;
  }, [arv, pp, rehabCost, costBasis, netProfit]);

  const seventyPctRatio = pp !== null && arv && arv > 0 ? ((pp + rehabCost) / arv) * 100 : null;
  const seventyPctPass = seventyPctRatio !== null ? seventyPctRatio <= 70 : null;

  /* category analysis */
  const overBudgetCats = useMemo(() =>
    categories
      .filter(c => c.estimated_budget > 0 && c.actualSpent > c.estimated_budget)
      .map(c => ({ ...c, variance: c.actualSpent - c.estimated_budget, variancePct: ((c.actualSpent - c.estimated_budget) / c.estimated_budget) * 100 }))
      .sort((a, b) => b.variance - a.variance),
    [categories]
  );

  const underBudgetCats = useMemo(() =>
    categories
      .filter(c => c.estimated_budget > 0 && c.actualSpent <= c.estimated_budget)
      .map(c => ({ ...c, remaining: c.estimated_budget - c.actualSpent, remainingPct: ((c.estimated_budget - c.actualSpent) / c.estimated_budget) * 100 }))
      .sort((a, b) => b.remaining - a.remaining),
    [categories]
  );

  const scopeCreepCats = useMemo(() =>
    categories.filter(c => (c.estimated_budget === 0 || !c.estimated_budget) && c.actualSpent > 0),
    [categories]
  );

  /* donut data */
  const donutData = useMemo(() => {
    const sorted = [...categories].filter(c => c.actualSpent > 0).sort((a, b) => b.actualSpent - a.actualSpent);
    const top5 = sorted.slice(0, 5);
    const otherTotal = sorted.slice(5).reduce((s, c) => s + c.actualSpent, 0);
    const data = top5.map(c => ({ name: c.category.replace(/_/g, ' '), value: c.actualSpent }));
    if (otherTotal > 0) data.push({ name: 'All Other', value: otherTotal });
    return data;
  }, [categories]);

  /* bar data */
  const barData = useMemo(() =>
    [...categories]
      .filter(c => c.actualSpent > 0)
      .sort((a, b) => b.actualSpent - a.actualSpent),
    [categories]
  );
  const maxBarSpent = Math.max(...barData.map(c => c.actualSpent), ...barData.map(c => c.estimated_budget), 1);

  /* ── pdf export ──────────────────────────────────────── */

  const handlePrint = () => window.print();

  const handleDownloadPdf = () => {
    const lines: string[] = [];
    lines.push(project.name);
    lines.push(`Address: ${project.address}`);
    lines.push(`Status: ${project.status.replace('_', ' ')}`);
    lines.push(`Start Date: ${startDate ? format(startDate, 'MMM d, yyyy') : project.start_date}`);
    lines.push('');
    lines.push('BUDGET SNAPSHOT');
    lines.push(`Total Budget: ${fmt(totalBudget)}`);
    lines.push(`Total Spent: ${fmt(totalSpent)}`);
    lines.push(`Remaining: ${fmt(remaining)}`);
    if (roi !== null) lines.push(`Estimated ROI: ${fmtPct(roi)}`);
    lines.push('');
    if (pp !== null || arv !== null) {
      lines.push('DEAL FINANCIALS');
      if (pp !== null) lines.push(`Purchase Price: ${fmt(pp)}`);
      lines.push(`Rehab Cost: ${fmt(rehabCost)}`);
      if (arv !== null) lines.push(`ARV: ${fmt(arv)}`);
      if (costBasis !== null) lines.push(`Total Cost Basis: ${fmt(costBasis)}`);
      if (netProfit !== null) lines.push(`Net Profit: ${fmt(netProfit)}`);
      if (seventyPctRatio !== null) lines.push(`70% Rule: ${fmtPct(seventyPctRatio)}`);
      lines.push('');
    }
    lines.push('CATEGORY SPEND BREAKDOWN');
    categories.filter(c => c.estimated_budget > 0 || c.actualSpent > 0).forEach(c => {
      lines.push(`${c.category.replace(/_/g, ' ')}: ${fmt(c.actualSpent)} / ${fmt(c.estimated_budget)}`);
    });
    if (overBudgetCats.length > 0) {
      lines.push('');
      lines.push('OVER BUDGET');
      overBudgetCats.forEach(c => lines.push(`${c.category.replace(/_/g, ' ')}: ${fmt(c.variance)} over (${fmtPct(c.variancePct)})`));
    }
    if (scopeCreepCats.length > 0) {
      lines.push('');
      lines.push('UNBUDGETED SPEND');
      scopeCreepCats.forEach(c => lines.push(`${c.category.replace(/_/g, ' ')}: ${fmt(c.actualSpent)}`));
    }
    lines.push('');
    lines.push(`TOTAL SPENT: ${fmt(totalSpent)}`);

    generatePDF(lines.join('\n'), {
      docType: 'Project Report',
      companyName: companyName || 'My Company',
      logoUrl,
    });
  };

  const dealField = (label: string, value: number | null, suffix?: string) => (
    <div className="flex justify-between text-sm py-1.5 border-b border-border/50 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium font-mono">
        {value !== null ? `${fmt(value)}${suffix || ''}` : <span className="text-muted-foreground/60 text-xs">— Add in Financials tab</span>}
      </span>
    </div>
  );

  const sectionDelay = (i: number) => ({ animationDelay: `${i * 0.1}s` });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0 gap-0 print:max-w-full print:max-h-full print:overflow-visible report-modal">
        {/* Action bar - hidden on print */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b border-border bg-background/95 backdrop-blur print:hidden">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Project Report</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1.5" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              <FileDown className="h-4 w-4 mr-1.5" /> PDF
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6 print:px-0 print:py-0 print:space-y-4">

          {/* ═══ SECTION 1 — HEADER ═══ */}
          <section className="animate-fade-in" style={sectionDelay(0)}>
            <div className="flex items-start justify-between">
              <div>
                {companyName && (
                  <p className="text-sm text-muted-foreground mb-1">{companyName}</p>
                )}
                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                <p className="text-muted-foreground mt-1">{project.address}</p>
              </div>
              {logoUrl && (
                <img src={logoUrl} alt="Company logo" className="h-10 w-auto object-contain print:h-8" />
              )}
            </div>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <Badge className={cn(
                project.status === 'active' && 'bg-success/20 text-success border-success/30',
                project.status === 'complete' && 'bg-primary/20 text-primary border-primary/30',
                project.status === 'on_hold' && 'bg-warning/20 text-warning border-warning/30',
              )}>
                {project.status.replace('_', ' ')}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Started {startDate ? format(startDate, 'MMM d, yyyy') : project.start_date}
              </span>
              <span className="text-xs text-muted-foreground">
                Report generated {format(now, 'MMM d, yyyy')}
              </span>
            </div>
            <div className="h-px bg-border mt-4" />
          </section>

          {/* ═══ SECTION 2 — BUDGET SNAPSHOT ═══ */}
          <section className="animate-fade-in" style={sectionDelay(1)}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-t-4 border-t-primary">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Budget</p>
                  <p className="text-lg font-bold font-mono">{fmt(totalBudget)}</p>
                </CardContent>
              </Card>
              <Card className={cn('border-t-4', pct > 100 ? 'border-t-destructive' : 'border-t-primary')}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
                  <p className="text-lg font-bold font-mono">{fmt(totalSpent)}</p>
                </CardContent>
              </Card>
              <Card className={cn('border-t-4', remaining >= 0 ? 'border-t-success' : 'border-t-destructive')}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                  <p className={cn('text-lg font-bold font-mono', remaining >= 0 ? 'text-success' : 'text-destructive')}>
                    {remaining < 0 && '-'}{fmt(Math.abs(remaining))}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-t-4 border-t-success">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Est. ROI</p>
                  <p className={cn('text-lg font-bold font-mono', roi !== null && roi >= 0 ? 'text-success' : roi !== null ? 'text-destructive' : '')}>
                    {roi !== null ? fmtPct(roi) : 'N/A'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Progress bar */}
            <Card className="mt-3">
              <CardContent className="p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Budget Usage</span>
                  <span className="text-muted-foreground">{fmtPct(pct)} — {overUnderLabel}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-1000 ease-out', budgetColor)}
                    style={{ width: mounted ? `${Math.min(pct, 100)}%` : '0%' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                  <span>$0</span>
                  <span>Budget: {fmt(totalBudget)}</span>
                  <span>Spent: {fmt(totalSpent)}</span>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ═══ SECTION 3 — DAYS ON PROJECT ═══ */}
          <section className="animate-fade-in" style={sectionDelay(2)}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> Days on Project
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {totalProjectedDays !== null ? (
                  <>
                    <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-1000 ease-out', timelineColor)}
                        style={{ width: mounted ? `${Math.min(timelinePct ?? 0, 100)}%` : '0%' }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Days Elapsed</p>
                        <p className="font-bold text-lg">{daysElapsed}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Days Remaining</p>
                        <p className="font-bold text-lg">{daysRemaining ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Total Projected</p>
                        <p className="font-bold text-lg">{totalProjectedDays}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-sm text-muted-foreground">
                      {daysElapsed > 0 && <span className="font-medium text-foreground">{daysElapsed} days elapsed</span>}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Set a projected end date (mark project complete or set completion date) to enable full timeline tracking.
                    </p>
                  </div>
                )}

                {daysElapsed > 0 && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                    <div className="text-sm">
                      <p className="text-muted-foreground text-xs">Daily Burn Rate</p>
                      <p className="font-medium font-mono">{fmt(dailyBurn)}/day</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground text-xs">Projected Total Spend</p>
                      <p className="font-medium font-mono">{projectedTotal !== null ? fmt(projectedTotal) : '—'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* ═══ SECTION 4 — DEAL FINANCIALS & ROI ═══ */}
          <section className="animate-fade-in print:break-before-page" style={sectionDelay(3)}>
            <Card>
              <div className="bg-secondary px-4 py-3 rounded-t-lg">
                <h3 className="text-sm font-semibold">How We Get to ROI</h3>
                <p className="text-xs text-muted-foreground">Values from project Financials tab.</p>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* LEFT — The Deal */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">The Deal</p>
                    {dealField('Purchase Price', pp)}
                    {dealField('Rehab Cost', rehabCost)}
                    {dealField('Loan Amount', loanAmt)}
                    {dealField('Loan Rate', loanRate, '%')}
                    {dealField('Hold Costs / Month', holdPerMonth)}
                    {dealField('Total Cost Basis', costBasis)}
                  </div>

                  {/* RIGHT — The Return */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">The Return</p>
                    {dealField('ARV', arv)}
                    {dealField('Projected Sale Price', projectedSalePrice)}
                    {dealField('Selling Costs (6%)', sellingCosts)}
                    {dealField('Net Proceeds', netProceeds)}
                    {dealField('Gross Profit', grossProfit)}
                    {dealField('Net Profit', netProfit)}
                  </div>
                </div>

                {/* ROI strip */}
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated ROI</p>
                    <p className={cn('text-xl font-bold font-mono', roi !== null && roi >= 0 ? 'text-success' : roi !== null ? 'text-destructive' : '')}>
                      {roi !== null ? fmtPct(roi) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Net Profit</p>
                    <p className={cn('text-xl font-bold font-mono', netProfit !== null && netProfit >= 0 ? 'text-success' : netProfit !== null ? 'text-destructive' : '')}>
                      {netProfit !== null ? fmt(netProfit) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Hold Period</p>
                    <p className="text-xl font-bold font-mono">
                      {holdPeriodMonths !== null ? `${holdPeriodMonths} mo` : '—'}
                    </p>
                  </div>
                </div>

                {/* 70% Rule */}
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-3">
                  {seventyPctPass === true && <CheckCircle2 className="h-5 w-5 text-success shrink-0" />}
                  {seventyPctPass === false && <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />}
                  {seventyPctPass === null && <div className="h-5 w-5 rounded-full bg-muted shrink-0" />}
                  <div>
                    <p className="text-sm font-medium">
                      70% Rule {seventyPctRatio !== null && <span className="font-mono">({fmtPct(seventyPctRatio)})</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {seventyPctPass === true && '(Purchase + Rehab) / ARV is under 70% ✓'}
                      {seventyPctPass === false && '(Purchase + Rehab) / ARV exceeds 70%'}
                      {seventyPctPass === null && 'Add purchase price and ARV to calculate'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ═══ SECTION 5 — OVER / UNDER BUDGET ═══ */}
          <section className="animate-fade-in" style={sectionDelay(4)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Over Budget */}
              <Card className="border-t-4 border-t-destructive">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-destructive">Over Budget</CardTitle>
                </CardHeader>
                <CardContent>
                  {overBudgetCats.length > 0 ? (
                    <div className="space-y-2">
                      {overBudgetCats.map(c => (
                        <div key={c.id} className="flex justify-between items-center text-sm">
                          <span className="capitalize truncate mr-2">{c.category.replace(/_/g, ' ')}</span>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-medium text-destructive">{fmt(c.variance)}</span>
                            <span className="text-xs text-muted-foreground ml-1">({fmtPct(c.variancePct)})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      All categories within budget ✓
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Under Budget */}
              <Card className="border-t-4 border-t-success">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-success">Under Budget / Unspent</CardTitle>
                </CardHeader>
                <CardContent>
                  {underBudgetCats.length > 0 ? (
                    <div className="space-y-2">
                      {underBudgetCats.map(c => (
                        <div key={c.id} className="flex justify-between items-center text-sm">
                          <span className="capitalize truncate mr-2">{c.category.replace(/_/g, ' ')}</span>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-medium text-success">{fmt(c.remaining)}</span>
                            <span className="text-xs text-muted-foreground ml-1">({fmtPct(c.remainingPct)})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No categories with remaining budget.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ═══ SECTION 6 — SPEND BREAKDOWN ═══ */}
          <section className="animate-fade-in print:break-before-page" style={sectionDelay(5)}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Spend Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Donut */}
                  <div className="flex flex-col items-center">
                    {donutData.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={donutData}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={90}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {donutData.map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => fmt(value)}
                              contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
                          {donutData.map((d, i) => (
                            <div key={d.name} className="flex items-center gap-1.5 text-xs">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                              <span className="capitalize">{d.name}</span>
                              <span className="font-mono text-muted-foreground">{fmt(d.value)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground py-10">No spend data available.</p>
                    )}
                  </div>

                  {/* Bars */}
                  <div className="space-y-2.5">
                    {barData.map(c => {
                      const spentPct = (c.actualSpent / maxBarSpent) * 100;
                      const budgetPct = c.estimated_budget > 0 ? (c.estimated_budget / maxBarSpent) * 100 : null;
                      const isOver = c.estimated_budget > 0 && c.actualSpent > c.estimated_budget;
                      return (
                        <div key={c.id}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="capitalize truncate">{c.category.replace(/_/g, ' ')}</span>
                            <span className="font-mono shrink-0 ml-2">{fmt(c.actualSpent)}</span>
                          </div>
                          <div className="relative h-2.5 w-full rounded-full bg-secondary overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-1000 ease-out',
                                isOver ? 'bg-destructive' : c.estimated_budget > 0 ? 'bg-primary' : 'bg-muted-foreground/50'
                              )}
                              style={{ width: mounted ? `${Math.min(spentPct, 100)}%` : '0%' }}
                            />
                            {budgetPct !== null && budgetPct <= 100 && (
                              <div
                                className="absolute top-0 bottom-0 w-0.5 bg-foreground/60"
                                style={{ left: `${budgetPct}%` }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {barData.length === 0 && (
                      <p className="text-xs text-muted-foreground">No spend data available.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ═══ SECTION 7 — SCOPE CREEP ═══ */}
          {scopeCreepCats.length > 0 && (
            <section className="animate-fade-in" style={sectionDelay(6)}>
              <Card className="border-warning/30 bg-warning/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-warning">
                    <AlertTriangle className="h-4 w-4" /> Unbudgeted Spend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {scopeCreepCats.map(c => (
                      <div key={c.id} className="flex justify-between items-center text-sm">
                        <div>
                          <span className="capitalize">{c.category.replace(/_/g, ' ')}</span>
                          <p className="text-xs text-muted-foreground">No budget was set for this category.</p>
                        </div>
                        <span className="font-mono font-medium text-warning shrink-0">{fmt(c.actualSpent)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* ═══ FOOTER ═══ */}
          <footer className="border-t border-border pt-4 mt-6 flex flex-col sm:flex-row justify-between text-xs text-muted-foreground">
            <span>{companyName || ''}</span>
            <span>{project.name} · {project.address} · Generated {format(now, 'MMM d, yyyy')}</span>
          </footer>
        </div>

        {/* Print styles */}
        <style>{`
          @media print {
            .report-modal { max-width: 100% !important; max-height: none !important; overflow: visible !important; border: none !important; box-shadow: none !important; }
            .report-modal > div:first-child { display: none !important; }
            .print\\:hidden { display: none !important; }
            .print\\:break-before-page { page-break-before: always; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .animate-fade-in { animation: none !important; opacity: 1 !important; }
            body { background: white !important; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
