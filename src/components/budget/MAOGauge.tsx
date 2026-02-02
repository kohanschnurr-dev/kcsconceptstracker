import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MAOGaugeProps {
  arv: number;
  currentBudget: number;
  purchasePrice: number;
}

export function MAOGauge({ arv, currentBudget, purchasePrice }: MAOGaugeProps) {
  // 78% Rule: Max Offer = (ARV × 78%) - Rehab Budget
  const maxAllowableOffer = (arv * 0.78) - currentBudget;
  const delta = maxAllowableOffer - purchasePrice;
  const isOverMAO = purchasePrice > maxAllowableOffer && purchasePrice > 0;
  const isUnderMAO = purchasePrice <= maxAllowableOffer && purchasePrice > 0;
  const hasValidData = arv > 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate progress percentage for visual bar
  const progressPercent = hasValidData && maxAllowableOffer > 0 
    ? Math.min(100, Math.max(0, (currentBudget / (arv * 0.78)) * 100))
    : 0;

  return (
    <div className={cn(
      "rounded-lg border p-4 transition-colors",
      !hasValidData && "bg-muted/30 border-border",
      hasValidData && isUnderMAO && "bg-green-500/10 border-green-500/30",
      hasValidData && isOverMAO && "bg-destructive/10 border-destructive/30",
      hasValidData && !purchasePrice && "bg-amber-500/10 border-amber-500/30"
    )}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* MAO Target */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            !hasValidData && "bg-muted",
            hasValidData && "bg-amber-500/20"
          )}>
            <Target className={cn(
              "h-5 w-5",
              !hasValidData && "text-muted-foreground",
              hasValidData && "text-amber-500"
            )} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Max Offer (78% Rule)</p>
            <p className={cn(
              "text-xl font-bold font-mono",
              !hasValidData && "text-muted-foreground",
              hasValidData && "text-foreground"
            )}>
              {hasValidData ? formatCurrency(Math.max(0, maxAllowableOffer)) : '—'}
            </p>
          </div>
        </div>

        {/* Current Budget */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Rehab Budget</p>
            <p className="text-xl font-bold font-mono text-primary">
              {formatCurrency(currentBudget)}
            </p>
          </div>
        </div>

        {/* Delta / Status */}
        <div className="flex items-center gap-3">
          {hasValidData && purchasePrice > 0 ? (
            <>
              <div className={cn(
                "p-2 rounded-lg",
                isUnderMAO && "bg-green-500/20",
                isOverMAO && "bg-destructive/20"
              )}>
                {isUnderMAO ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {isUnderMAO ? 'Under MAO' : 'Over MAO'}
                </p>
                <p className={cn(
                  "text-xl font-bold font-mono",
                  isUnderMAO && "text-green-500",
                  isOverMAO && "text-destructive"
                )}>
                  {isUnderMAO ? '+' : ''}{formatCurrency(delta)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 rounded-lg bg-muted">
                <TrendingDown className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Purchase Price</p>
                <p className="text-xl font-bold font-mono text-muted-foreground">
                  {purchasePrice > 0 ? formatCurrency(purchasePrice) : 'Enter value →'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {hasValidData && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Budget vs 78% of ARV</span>
            <span>{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-300 rounded-full",
                progressPercent < 70 && "bg-green-500",
                progressPercent >= 70 && progressPercent < 90 && "bg-amber-500",
                progressPercent >= 90 && "bg-destructive"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
