import { useState, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MAOGaugeProps {
  arv: number;
  currentBudget: number;
  purchasePrice: number;
  sqft?: number;
  maoPercentage?: number;
  onPercentageChange?: (percentage: number) => void;
  onBudgetTargetChange?: (target: number) => void;
}

const PRESET_PERCENTAGES = [70, 75, 78, 80, 85];

export function MAOGauge({ 
  arv, 
  currentBudget, 
  purchasePrice, 
  sqft = 0,
  maoPercentage = 78,
  onPercentageChange,
  onBudgetTargetChange
}: MAOGaugeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInputValue, setBudgetInputValue] = useState('');
  const budgetInputRef = useRef<HTMLInputElement>(null);
  const [budgetMode, setBudgetMode] = useState<'actual' | 'psf'>('actual');

  const psfRate = sqft > 0 ? currentBudget / sqft : 0;

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

  // Focus input when custom mode is shown
  useEffect(() => {
    if (showCustomInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCustomInput]);

  useEffect(() => {
    if (editingBudget && budgetInputRef.current) {
      budgetInputRef.current.focus();
      budgetInputRef.current.select();
    }
  }, [editingBudget]);

  const handleBudgetClick = () => {
    if (!onBudgetTargetChange) return;
    if (budgetMode === 'psf') {
      setBudgetInputValue(psfRate > 0 ? Math.round(psfRate).toString() : '');
    } else {
      setBudgetInputValue(currentBudget > 0 ? currentBudget.toString() : '');
    }
    setEditingBudget(true);
  };

  const handleBudgetSubmit = () => {
    const val = parseFloat(budgetInputValue) || 0;
    if (val > 0) {
      if (budgetMode === 'psf' && sqft > 0) {
        onBudgetTargetChange?.(Math.round(val * sqft));
      } else {
        onBudgetTargetChange?.(val);
      }
    }
    setEditingBudget(false);
  };

  const handlePercentageSelect = (percent: number) => {
    onPercentageChange?.(percent);
    setShowCustomInput(false);
    setIsOpen(false);
  };

  const handleCustomClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCustomInput(true);
  };

  const handleCustomSubmit = () => {
    const value = parseFloat(customValue);
    if (value > 0 && value <= 100) {
      onPercentageChange?.(value);
      setShowCustomInput(false);
      setCustomValue('');
      setIsOpen(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
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
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between sm:gap-3">
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
              "text-base sm:text-lg font-bold font-mono",
              !hasValidData && "text-muted-foreground",
              hasValidData && "text-foreground"
            )}>
              {hasValidData ? formatCurrency(Math.max(0, maxAllowableOffer)) : '—'}
            </p>
          </div>
        </div>

        {/* Current Budget — clickable to set target */}
        <div 
          className={cn(
            "flex items-center gap-2",
            onBudgetTargetChange && !editingBudget && "cursor-pointer group"
          )}
          onClick={!editingBudget ? handleBudgetClick : undefined}
          title={onBudgetTargetChange ? "Click to set a target construction budget" : undefined}
        >
          <div className="p-1.5 rounded-lg bg-primary/20">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Construction Budget</p>
              {onBudgetTargetChange && (
                <div className="inline-flex h-5 rounded-md border border-input overflow-hidden text-[10px] font-mono leading-none">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setBudgetMode('actual'); setEditingBudget(false); }}
                    className={cn(
                      "px-1.5 transition-colors",
                      budgetMode === 'actual' ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-accent"
                    )}
                  >$</button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setBudgetMode('psf'); setEditingBudget(false); }}
                    disabled={sqft <= 0}
                    className={cn(
                      "px-1.5 transition-colors",
                      budgetMode === 'psf' ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-accent",
                      sqft <= 0 && "opacity-40 cursor-not-allowed"
                    )}
                    title={sqft <= 0 ? "Enter sqft first" : "Per square foot"}
                  >PSF</button>
                </div>
              )}
            </div>
            {editingBudget ? (
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-base font-bold font-mono text-primary">$</span>
                <Input
                  ref={budgetInputRef}
                  type="number"
                  value={budgetInputValue}
                  onChange={(e) => setBudgetInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleBudgetSubmit();
                    if (e.key === 'Escape') setEditingBudget(false);
                  }}
                  onBlur={handleBudgetSubmit}
                  className="h-8 w-32 pl-6 pr-2 text-base font-mono font-bold border-primary/50"
                />
              </div>
            ) : (
              <p className="text-base sm:text-lg font-bold font-mono text-primary group-hover:underline group-hover:decoration-primary/40 transition-all">
                {formatCurrency(currentBudget)}
              </p>
            )}
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
                  "text-base sm:text-lg font-bold font-mono",
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
                <p className="text-base sm:text-lg font-bold font-mono text-muted-foreground">
                  {purchasePrice > 0 ? formatCurrency(purchasePrice) : 'Enter value →'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* MAO Percentage Selector */}
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1.5 font-mono text-sm min-w-[90px]"
            >
              <span className="text-muted-foreground text-xs">MAO</span>
              {maoPercentage}%
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 bg-popover z-50">
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
            <DropdownMenuSeparator />
            {!showCustomInput ? (
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                onClick={handleCustomClick}
                className="cursor-pointer"
              >
                Custom...
              </DropdownMenuItem>
            ) : (
              <div 
                className="p-2 flex gap-2" 
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Input
                  ref={inputRef}
                  type="number"
                  placeholder="%"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="h-7 w-16 text-sm font-mono"
                  min="1"
                  max="100"
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') handleCustomSubmit();
                    if (e.key === 'Escape') {
                      setShowCustomInput(false);
                      setCustomValue('');
                    }
                  }}
                />
                <Button size="sm" className="h-7 px-2" onClick={handleCustomSubmit}>
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
