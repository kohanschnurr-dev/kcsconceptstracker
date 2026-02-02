import { useState } from 'react';
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MAOGaugeProps {
  arv: number;
  currentBudget: number;
  purchasePrice: number;
  maoPercentage?: number;
  onPercentageChange?: (percentage: number) => void;
}

const PRESET_PERCENTAGES = [70, 75, 78, 80, 85];

export function MAOGauge({ 
  arv, 
  currentBudget, 
  purchasePrice, 
  maoPercentage = 78,
  onPercentageChange 
}: MAOGaugeProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  // Dynamic MAO Rule: Max Offer = (ARV × percentage) - Rehab Budget
  const maxAllowableOffer = (arv * (maoPercentage / 100)) - currentBudget;
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
    ? Math.min(100, Math.max(0, (currentBudget / (arv * (maoPercentage / 100))) * 100))
    : 0;

  const handlePercentageSelect = (percent: number) => {
    onPercentageChange?.(percent);
    setShowCustomInput(false);
  };

  const handleCustomSubmit = () => {
    const value = parseFloat(customValue);
    if (value > 0 && value <= 100) {
      onPercentageChange?.(value);
      setShowCustomInput(false);
      setCustomValue('');
    }
  };

  return (
    <div className={cn(
      "rounded-lg border p-3 transition-colors",
      !hasValidData && "bg-muted/30 border-border",
      hasValidData && isUnderMAO && "bg-green-500/10 border-green-500/30",
      hasValidData && isOverMAO && "bg-destructive/10 border-destructive/30",
      hasValidData && !purchasePrice && "bg-amber-500/10 border-amber-500/30"
    )}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* MAO Target */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-lg",
            !hasValidData && "bg-muted",
            hasValidData && "bg-amber-500/20"
          )}>
            <Target className={cn(
              "h-4 w-4",
              !hasValidData && "text-muted-foreground",
              hasValidData && "text-amber-500"
            )} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Max Offer</p>
            <p className={cn(
              "text-lg font-bold font-mono",
              !hasValidData && "text-muted-foreground",
              hasValidData && "text-foreground"
            )}>
              {hasValidData ? formatCurrency(Math.max(0, maxAllowableOffer)) : '—'}
            </p>
          </div>
        </div>

        {/* Current Budget */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/20">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Rehab Budget</p>
            <p className="text-lg font-bold font-mono text-primary">
              {formatCurrency(currentBudget)}
            </p>
          </div>
        </div>

        {/* Delta / Status */}
        <div className="flex items-center gap-2">
          {hasValidData && purchasePrice > 0 ? (
            <>
              <div className={cn(
                "p-1.5 rounded-lg",
                isUnderMAO && "bg-green-500/20",
                isOverMAO && "bg-destructive/20"
              )}>
                {isUnderMAO ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {isUnderMAO ? 'Under MAO' : 'Over MAO'}
                </p>
                <p className={cn(
                  "text-lg font-bold font-mono",
                  isUnderMAO && "text-green-500",
                  isOverMAO && "text-destructive"
                )}>
                  {isUnderMAO ? '+' : ''}{formatCurrency(delta)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-1.5 rounded-lg bg-muted">
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Purchase Price</p>
                <p className="text-lg font-bold font-mono text-muted-foreground">
                  {purchasePrice > 0 ? formatCurrency(purchasePrice) : 'Enter value →'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Percentage Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1 font-mono text-sm min-w-[70px]"
            >
              {maoPercentage}%
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32 bg-popover">
            {PRESET_PERCENTAGES.map((percent) => (
              <DropdownMenuItem
                key={percent}
                onClick={() => handlePercentageSelect(percent)}
                className={cn(
                  "font-mono cursor-pointer",
                  maoPercentage === percent && "bg-accent"
                )}
              >
                {percent}%
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onClick={() => setShowCustomInput(true)}
              className="cursor-pointer"
            >
              Custom...
            </DropdownMenuItem>
            {showCustomInput && (
              <div className="p-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Input
                  type="number"
                  placeholder="%"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="h-7 w-16 text-sm font-mono"
                  min="1"
                  max="100"
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                />
                <Button size="sm" className="h-7" onClick={handleCustomSubmit}>
                  Set
                </Button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Progress Bar */}
      {hasValidData && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Budget vs {maoPercentage}% of ARV</span>
            <span>{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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
