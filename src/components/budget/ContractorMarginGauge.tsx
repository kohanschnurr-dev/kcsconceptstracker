import { TrendingUp, CheckCircle2, AlertTriangle, DollarSign, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContractorMarginGaugeProps {
  contractValue: number;
  jobCost: number;
  marginTarget: number;
  onMarginTargetChange: (v: number) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export function ContractorMarginGauge({
  contractValue,
  jobCost,
  marginTarget,
  onMarginTargetChange,
}: ContractorMarginGaugeProps) {
  const grossProfit = contractValue - jobCost;
  const margin = contractValue > 0 ? (grossProfit / contractValue) * 100 : 0;
  const hasValidData = contractValue > 0;

  const isGreen = margin >= marginTarget;
  const isAmber = !isGreen && margin >= marginTarget * 0.6;
  const isRed = !isGreen && !isAmber;

  const marginColor =
    !hasValidData ? 'text-muted-foreground' :
    isGreen ? 'text-green-500' :
    isAmber ? 'text-amber-500' :
    'text-destructive';

  const bgColor =
    !hasValidData ? 'bg-muted/30 border-border' :
    isGreen ? 'bg-green-500/10 border-green-500/30' :
    isAmber ? 'bg-amber-500/10 border-amber-500/30' :
    'bg-destructive/10 border-destructive/30';

  const statusBgColor =
    !hasValidData ? 'bg-muted' :
    isGreen ? 'bg-green-500/20' :
    isAmber ? 'bg-amber-500/20' :
    'bg-destructive/20';

  const dotColor =
    isGreen ? 'bg-green-500' :
    isAmber ? 'bg-amber-500' :
    'bg-destructive';

  // Progress bar: 0 → (marginTarget * 2) maps to 0 → 100%
  // So the target is always at 50% of the bar
  const barMax = marginTarget * 2;
  const barPercent = hasValidData ? Math.min(100, Math.max(0, (margin / barMax) * 100)) : 0;
  const targetMarkerPct = 50; // always 50% = midpoint = target

  const barColor =
    isGreen ? 'bg-green-500' :
    isAmber ? 'bg-amber-500' :
    'bg-destructive';

  return (
    <div className={cn('rounded-lg border p-3 transition-colors', bgColor)}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Contract Value */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/20">
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Contract Value</p>
            <p className="text-lg font-bold font-mono text-primary">
              {hasValidData ? formatCurrency(contractValue) : '—'}
            </p>
          </div>
        </div>

        {/* Job Cost */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-muted">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Job Cost</p>
            <p className="text-lg font-bold font-mono text-foreground">
              {formatCurrency(jobCost)}
            </p>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-lg', hasValidData && grossProfit >= 0 ? 'bg-green-500/20' : 'bg-destructive/20')}>
            {hasValidData && grossProfit >= 0 ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Gross Profit</p>
            <p className={cn('text-lg font-bold font-mono', hasValidData ? (grossProfit >= 0 ? 'text-green-500' : 'text-destructive') : 'text-muted-foreground')}>
              {hasValidData ? formatCurrency(grossProfit) : '—'}
            </p>
          </div>
        </div>

        {/* Gross Margin — icon-card with inline editable target */}
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-lg', statusBgColor)}>
            <Percent className={cn('h-4 w-4', marginColor)} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Gross Margin</p>
            <p className={cn('text-2xl font-bold font-mono leading-none', marginColor)}>
              {hasValidData ? `${margin.toFixed(1)}%` : '—'}
            </p>
            {/* Target inline — compact, below the number */}
            <div className="flex items-center gap-1 mt-1">
              <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColor)} />
              <span className="text-xs text-muted-foreground">Target</span>
              <input
                type="number"
                value={marginTarget}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v > 0) onMarginTargetChange(v);
                }}
                className="w-8 h-4 text-xs font-mono text-center rounded border border-input bg-background/80 px-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
                min={1}
                max={99}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {hasValidData && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Margin vs Target</span>
          </div>
          <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all duration-300 rounded-full', barColor)}
              style={{ width: `${barPercent}%` }}
            />
            {/* Target marker */}
            <div
              className="absolute top-0 h-full w-0.5 bg-foreground/40"
              style={{ left: `${targetMarkerPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <span className={marginColor}>{marginTarget}% target</span>
            <span>{marginTarget * 2}%+</span>
          </div>
        </div>
      )}
    </div>
  );
}
