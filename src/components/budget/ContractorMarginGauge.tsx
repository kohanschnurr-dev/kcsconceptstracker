import { TrendingUp, CheckCircle2, AlertTriangle, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContractorMarginGaugeProps {
  contractValue: number;
  jobCost: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export function ContractorMarginGauge({ contractValue, jobCost }: ContractorMarginGaugeProps) {
  const grossProfit = contractValue - jobCost;
  const margin = contractValue > 0 ? (grossProfit / contractValue) * 100 : 0;
  const hasValidData = contractValue > 0;

  const marginColor =
    !hasValidData ? 'text-muted-foreground' :
    margin >= 20 ? 'text-green-500' :
    margin >= 10 ? 'text-amber-500' :
    'text-destructive';

  const bgColor =
    !hasValidData ? 'bg-muted/30 border-border' :
    margin >= 20 ? 'bg-green-500/10 border-green-500/30' :
    margin >= 10 ? 'bg-amber-500/10 border-amber-500/30' :
    'bg-destructive/10 border-destructive/30';

  // Progress bar: 0–40% range maps to 0–100% bar width
  const barPercent = hasValidData ? Math.min(100, Math.max(0, (margin / 40) * 100)) : 0;

  const barColor =
    margin >= 20 ? 'bg-green-500' :
    margin >= 10 ? 'bg-amber-500' :
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

        {/* Margin % — large display */}
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Gross Margin</p>
          <p className={cn('text-2xl font-bold font-mono', marginColor)}>
            {hasValidData ? `${margin.toFixed(1)}%` : '—'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {hasValidData && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Job Cost vs Contract Value</span>
            <span>{margin.toFixed(1)}% margin</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all duration-300 rounded-full', barColor)}
              style={{ width: `${barPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <span className="text-amber-500">10%</span>
            <span className="text-green-500">20%</span>
            <span>40%+</span>
          </div>
        </div>
      )}
    </div>
  );
}
