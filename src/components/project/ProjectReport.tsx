import { useMemo, useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { parseDateString } from '@/lib/dateUtils';
import { FileDown, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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

/* ── Section Header ──────────────────────────────────────── */
const SectionHead = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <h2 className="text-[10px] font-bold uppercase tracking-[0.35em] text-primary whitespace-nowrap">
      {title}
    </h2>
    <div className="flex-1 h-px bg-border" />
  </div>
);

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

  /* ── computed (all logic preserved) ──────────────────── */

  const categoryTotal = categories.reduce((s, c) => s + Number(c.estimated_budget), 0);
  const totalBudget = project.total_budget > 0 ? project.total_budget : categoryTotal;
  const totalSpent = categories.reduce((s, c) => s + c.actualSpent, 0);
  const rehabCost = constructionSpentProp ?? totalSpent;
  const remaining = totalBudget - totalSpent;
  const pct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const overUnderAmt = Math.abs(remaining);
  const overUnderLabel = remaining >= 0 ? `${fmt(overUnderAmt)} under` : `${fmt(overUnderAmt)} over`;

  const startDate = parseDateString(project.start_date);
  const now = new Date();
  const endDate = project.completed_date ? parseDateString(project.completed_date) : null;
  const daysElapsed = startDate ? Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / 86400000)) : 0;
  const totalProjectedDays = startDate && endDate ? Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / 86400000)) : null;
  const daysRemaining = endDate ? Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 86400000)) : null;
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

  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = () => {
    if (!reportRef.current) return;
    const html = reportRef.current.innerHTML;
    const cs = getComputedStyle(document.documentElement);
    const vars = [
      '--background', '--foreground', '--card', '--card-foreground',
      '--popover', '--popover-foreground', '--primary', '--primary-foreground',
      '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
      '--accent', '--accent-foreground', '--destructive', '--destructive-foreground',
      '--success', '--success-foreground', '--warning', '--warning-foreground',
      '--border', '--input', '--ring', '--radius',
      '--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5',
    ];
    const cssVars = vars.map(v => `${v}: ${cs.getPropertyValue(v).trim()};`).join('\n      ');

    const doc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${project.name} — Project Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
          colors: {
            border: 'hsl(var(--border))',
            input: 'hsl(var(--input))',
            ring: 'hsl(var(--ring))',
            background: 'hsl(var(--background))',
            foreground: 'hsl(var(--foreground))',
            primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
            secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
            destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
            success: { DEFAULT: 'hsl(var(--success))', foreground: 'hsl(var(--success-foreground))' },
            warning: { DEFAULT: 'hsl(var(--warning))', foreground: 'hsl(var(--warning-foreground))' },
            muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
            accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
            card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
          },
          borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
        },
      },
    }
  <\/script>
  <style>
    :root { ${cssVars} }
    * { box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: hsl(var(--background)); color: hsl(var(--foreground)); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .report-anim { animation: none !important; opacity: 1 !important; transform: none !important; }

    /* Arbitrary Tailwind value overrides (CDN doesn't support JIT) */
    .tracking-\\[0\\.35em\\] { letter-spacing: 0.35em !important; }
    .tracking-\\[2\\.5px\\] { letter-spacing: 2.5px !important; }
    .tracking-\\[2px\\] { letter-spacing: 2px !important; }
    .tracking-\\[3px\\] { letter-spacing: 3px !important; }
    .text-\\[9px\\] { font-size: 9px !important; line-height: 1.2; }
    .text-\\[10px\\] { font-size: 10px !important; line-height: 1.4; }
    .border-t-\\[3px\\] { border-top-width: 3px !important; }
    .h-\\[10px\\] { height: 10px !important; }
    .w-\\[2px\\] { width: 2px !important; }
    .top-\\[-2px\\] { top: -2px !important; }
    .bottom-\\[-2px\\] { bottom: -2px !important; }

    /* Page break controls */
    section { break-inside: avoid; margin-bottom: 16px; }
    .bg-card { break-inside: avoid; }
    .print\\:break-before-page { page-break-before: always; break-before: page; }

    /* Hide interactive chart tooltips in print */
    .recharts-tooltip-wrapper { display: none !important; }

    @media print {
      @page { size: A4 portrait; margin: 0.5in; }
      body { background: white !important; }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }

      /* Re-declare arbitrary values for print engine */
      .tracking-\\[0\\.35em\\] { letter-spacing: 0.35em !important; }
      .tracking-\\[2\\.5px\\] { letter-spacing: 2.5px !important; }
      .tracking-\\[2px\\] { letter-spacing: 2px !important; }
      .tracking-\\[3px\\] { letter-spacing: 3px !important; }
      .text-\\[9px\\] { font-size: 9px !important; line-height: 1.2; }
      .text-\\[10px\\] { font-size: 10px !important; line-height: 1.4; }
      .border-t-\\[3px\\] { border-top-width: 3px !important; }
      .h-\\[10px\\] { height: 10px !important; }
      .w-\\[2px\\] { width: 2px !important; }
      .top-\\[-2px\\] { top: -2px !important; }
      .bottom-\\[-2px\\] { bottom: -2px !important; }

      /* Prevent content splitting */
      section { break-inside: avoid; margin-bottom: 12px; }
      .bg-card, .bg-warning\\/5 { break-inside: avoid; }
      .grid { break-inside: avoid; }
      .print\\:break-before-page { page-break-before: always; break-before: page; }

      /* Force background colors in print */
      .bg-card { background-color: hsl(var(--card)) !important; }
      .bg-background { background-color: hsl(var(--background)) !important; }
      .bg-secondary { background-color: hsl(var(--secondary)) !important; }
      .bg-primary { background-color: hsl(var(--primary)) !important; }
      .bg-destructive { background-color: hsl(var(--destructive)) !important; }
      .bg-success { background-color: hsl(var(--success)) !important; }
      .bg-warning { background-color: hsl(var(--warning)) !important; }

      /* Hide chart tooltips */
      .recharts-tooltip-wrapper { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="max-w-5xl mx-auto px-8 py-8 space-y-8">
    ${html}
  </div>
  <script>
    // Wait for Tailwind CDN to process, then print
    setTimeout(function() { window.print(); }, 2500);
  <\/script>
</body>
</html>`;
    const blob = new Blob([doc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) setTimeout(() => URL.revokeObjectURL(url), 15000);
  };

  /* ── deal field helper ───────────────────────────────── */

  const dealField = (label: string, value: number | null, suffix?: string) => (
    <div className="flex justify-between items-center py-2.5 border-b border-border/40 last:border-b-0">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <span className="font-mono text-sm font-semibold">
        {value !== null
          ? `${fmt(value)}${suffix || ''}`
          : <span className="text-muted-foreground/50 text-xs italic bg-secondary/50 px-2 py-0.5 rounded">See Financials →</span>
        }
      </span>
    </div>
  );

  const sectionDelay = (i: number) => ({
    animationDelay: `${i * 0.08}s`,
    animationFillMode: 'both' as const,
  });

  /* ── RENDER ──────────────────────────────────────────── */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0 gap-0 print:max-w-full print:max-h-full print:overflow-visible report-modal bg-background">

        {/* ── Action bar (hidden on print) ── */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b border-border bg-background/95 backdrop-blur print:hidden">
          <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-primary">Project Report</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              <FileDown className="h-4 w-4 mr-1.5" /> PDF
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div ref={reportRef} className="px-8 py-8 space-y-8 print:px-4 print:py-4 print:space-y-4">

          {/* ═══ HEADER ═══ */}
          <section className="report-anim" style={sectionDelay(0)}>
            <div className="flex items-start justify-between">
              <div>
                {companyName && (
                  <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-primary mb-2">
                    {companyName}
                  </p>
                )}
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground">{project.name}</h1>
                <div className="flex items-center gap-3 mt-3 flex-wrap text-xs text-muted-foreground font-mono">
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
                    project.status === 'active' && 'bg-success/15 text-success border-success/30',
                    project.status === 'complete' && 'bg-primary/15 text-primary border-primary/30',
                    project.status === 'on_hold' && 'bg-warning/15 text-warning border-warning/30',
                  )}>
                    {project.status.replace('_', ' ')}
                  </span>
                  <span>📍 {project.address}</span>
                  <span>📅 Started {startDate ? format(startDate, 'MMM d, yyyy') : project.start_date}</span>
                  <span>Generated {format(now, 'MMM d, yyyy')}</span>
                </div>
              </div>
              {logoUrl && (
                <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain print:h-8 ml-4 shrink-0" />
              )}
            </div>
          </section>

          {/* ═══ BUDGET SNAPSHOT ═══ */}
          <section className="report-anim" style={sectionDelay(1)}>
            <SectionHead title="BUDGET SNAPSHOT" />

            {/* 4-column stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'TOTAL BUDGET', value: fmt(totalBudget), sub: 'Approved', borderColor: 'border-primary' },
                { label: 'TOTAL SPENT', value: fmt(totalSpent), sub: `${fmtPct(pct)} used`, borderColor: pct > 100 ? 'border-destructive' : 'border-primary' },
                { label: 'REMAINING', value: `${remaining < 0 ? '−' : ''}${fmt(Math.abs(remaining))}`, sub: remaining >= 0 ? 'Under budget' : 'Over budget', borderColor: remaining >= 0 ? 'border-success' : 'border-destructive', valueColor: remaining >= 0 ? 'text-success' : 'text-destructive' },
                { label: 'EST. ROI', value: roi !== null ? fmtPct(roi) : 'N/A', sub: 'See deal breakdown', borderColor: 'border-success', valueColor: roi !== null && roi >= 0 ? 'text-success' : roi !== null ? 'text-destructive' : '' },
              ].map((card, i) => (
                <div key={i} className={cn('bg-card border border-border rounded-lg p-4 border-t-[3px]', card.borderColor)}>
                  <p className="text-[9px] font-bold uppercase tracking-[2.5px] text-muted-foreground font-mono mb-2">{card.label}</p>
                  <p className={cn('text-2xl font-extrabold font-mono', card.valueColor)}>{card.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Budget usage bar */}
            <div className="bg-card border border-border rounded-lg p-4 mt-3">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm font-semibold">Budget Usage</span>
                <span className="text-xs font-mono text-muted-foreground">{fmtPct(pct)} — {overUnderLabel}</span>
              </div>
              <div className="h-[10px] w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-1000 ease-out',
                    pct > 100 ? 'bg-gradient-to-r from-primary to-destructive' : pct >= 85 ? 'bg-warning' : 'bg-primary'
                  )}
                  style={{ width: mounted ? `${Math.min(pct, 100)}%` : '0%' }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 font-mono">
                <span>$0</span>
                <span>Budget {fmt(totalBudget)}</span>
                <span>Spent {fmt(totalSpent)}</span>
              </div>
            </div>
          </section>

          {/* ═══ DEAL FINANCIALS & ROI ═══ */}
          <section className="report-anim" style={sectionDelay(2)}>
            <SectionHead title="DEAL FINANCIALS & ROI" />

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              {/* Dark header band */}
              <div className="bg-background px-5 py-3 border-b border-border">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.35em] text-primary font-mono">
                  HOW WE GET TO ROI
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] text-muted-foreground">Values pulled from project Financials tab</span>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* The Deal */}
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-muted-foreground mb-3">THE DEAL</p>
                    {dealField('Purchase Price', pp)}
                    {dealField('Rehab Cost', rehabCost)}
                    {dealField('Loan Amount', loanAmt)}
                    {dealField('Loan Rate', loanRate, '%')}
                    {dealField('Hold Costs / Month', holdPerMonth)}
                    {dealField('Total Cost Basis', costBasis)}
                  </div>

                  {/* The Return */}
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-muted-foreground mb-3">THE RETURN</p>
                    {dealField('Projected Sale Price', projectedSalePrice)}
                    {dealField('Selling Costs (6%)', sellingCosts)}
                    {dealField('Net Proceeds', netProceeds)}
                    {dealField('Gross Profit', grossProfit)}
                    {dealField('Net Profit', netProfit)}
                  </div>
                </div>

                {/* ROI result strip */}
                <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-border">
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase tracking-[2px] text-muted-foreground mb-1 font-mono">Estimated ROI</p>
                    <p className={cn('text-3xl font-extrabold font-mono', roi !== null && roi >= 0 ? 'text-success' : roi !== null ? 'text-destructive' : 'text-muted-foreground')}>
                      {roi !== null ? fmtPct(roi) : '—'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Equity / Profit</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase tracking-[2px] text-muted-foreground mb-1 font-mono">Net Profit</p>
                    <p className={cn('text-3xl font-extrabold font-mono', netProfit !== null && netProfit >= 0 ? 'text-success' : netProfit !== null ? 'text-destructive' : 'text-muted-foreground')}>
                      {netProfit !== null ? fmt(netProfit) : '—'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Net after all costs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase tracking-[2px] text-muted-foreground mb-1 font-mono">Hold Period</p>
                    <p className="text-3xl font-extrabold font-mono text-foreground">
                      {holdPeriodMonths !== null ? `${holdPeriodMonths} mo` : '—'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Months to close</p>
                  </div>
                </div>

                {/* 70% Rule */}
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-3">
                  {seventyPctPass === true && <CheckCircle2 className="h-5 w-5 text-success shrink-0" />}
                  {seventyPctPass === false && <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />}
                  {seventyPctPass === null && <div className="h-5 w-5 rounded-full bg-muted shrink-0" />}
                  <div>
                    <p className="text-sm font-semibold">
                      70% Rule {seventyPctRatio !== null && <span className="font-mono">({fmtPct(seventyPctRatio)})</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {seventyPctPass === true && '(Purchase + Rehab) / ARV is under 70% ✓'}
                      {seventyPctPass === false && '(Purchase + Rehab) / ARV exceeds 70%'}
                      {seventyPctPass === null && 'Add purchase price and ARV to calculate'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══ WHERE THE MONEY WENT (Donut) ═══ */}
          <section className="report-anim" style={sectionDelay(3)}>
            <SectionHead title="WHERE THE MONEY WENT" />

            <div className="bg-card border border-border rounded-lg p-5">
              <p className="text-xs text-muted-foreground mb-4 font-mono">{fmt(totalSpent)} total</p>
              {donutData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Donut chart */}
                  <div className="flex justify-center">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
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
                  </div>

                  {/* Legend grid */}
                  <div className="grid grid-cols-1 gap-2">
                    {donutData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-sm capitalize flex-1">{d.name}</span>
                        <span className="font-mono text-sm font-semibold">{fmt(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-10 text-center">No spend data available.</p>
              )}
            </div>
          </section>

          {/* ═══ CATEGORY BREAKDOWN ═══ */}
          <section className="report-anim print:break-before-page" style={sectionDelay(4)}>
            <SectionHead title="CATEGORY BREAKDOWN" />

            <div className="bg-card border border-border rounded-lg p-5">
              <p className="text-xs text-muted-foreground mb-4 font-mono">Spent vs Budget</p>
              <div className="space-y-3">
                {barData.map(c => {
                  const spentPct = (c.actualSpent / maxBarSpent) * 100;
                  const budgetPct = c.estimated_budget > 0 ? (c.estimated_budget / maxBarSpent) * 100 : null;
                  const isOver = c.estimated_budget > 0 && c.actualSpent > c.estimated_budget;
                  const hasNoBudget = !c.estimated_budget || c.estimated_budget === 0;
                  return (
                    <div key={c.id}>
                      <div className="flex justify-between items-baseline text-sm mb-1">
                        <span className="capitalize font-medium truncate mr-3">{c.category.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                          <span className={cn('font-semibold', isOver ? 'text-destructive' : '')}>{fmt(c.actualSpent)}</span>
                          {!hasNoBudget && (
                            <span className="text-muted-foreground">/ {fmt(c.estimated_budget)}</span>
                          )}
                        </div>
                      </div>
                      <div className="relative h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-1000 ease-out',
                            isOver ? 'bg-destructive' : hasNoBudget ? 'bg-muted-foreground/40' : 'bg-primary'
                          )}
                          style={{ width: mounted ? `${Math.min(spentPct, 100)}%` : '0%' }}
                        />
                        {budgetPct !== null && budgetPct <= 100 && (
                          <div
                            className="absolute top-[-2px] bottom-[-2px] w-[2px] bg-foreground/70 rounded-full"
                            style={{ left: `${budgetPct}%` }}
                            title={`Budget: ${fmt(c.estimated_budget)}`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
                {barData.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No spend data available.</p>
                )}
              </div>
            </div>
          </section>

          {/* ═══ SCOPE CREEP / UNBUDGETED ═══ */}
          {scopeCreepCats.length > 0 && (
            <section className="report-anim" style={sectionDelay(5)}>
              <div className="bg-warning/5 border border-warning/20 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-sm font-semibold text-warning">Unbudgeted Spend</span>
                </div>
                <div className="space-y-2">
                  {scopeCreepCats.map(c => (
                    <div key={c.id} className="flex justify-between items-center text-sm py-1.5 border-b border-warning/10 last:border-b-0">
                      <div>
                        <span className="capitalize font-medium">{c.category.replace(/_/g, ' ')}</span>
                        <p className="text-[10px] text-muted-foreground">No budget was set for this category</p>
                      </div>
                      <span className="font-mono font-semibold text-warning shrink-0">{fmt(c.actualSpent)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ═══ FOOTER ═══ */}
          <footer className="border-t border-border pt-5 mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-primary">
              {companyName || ''}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {project.name} · {project.address} · Report generated {format(now, 'MMM d, yyyy')}
            </span>
          </footer>
        </div>

        {/* Print + animation styles */}
        <style>{`
          @keyframes reportUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .report-anim {
            animation: reportUp 0.4s ease-out both;
          }
          @media print {
            .report-modal { max-width: 100% !important; max-height: none !important; overflow: visible !important; border: none !important; box-shadow: none !important; }
            .report-modal > div:first-child { display: none !important; }
            .print\:hidden { display: none !important; }
            .print\:break-before-page { page-break-before: always; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .report-anim { animation: none !important; opacity: 1 !important; transform: none !important; }
            body { background: white !important; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
