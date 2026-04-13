import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormulaInput } from '@/components/ui/formula-input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ProjectType } from '@/types';

type CostMode = 'pct' | 'flat' | 'actual';

interface ProfitCalculatorProps {
  projectId: string;
  projectType?: ProjectType;
  projectStatus?: string;
  totalBudget: number;
  totalSpent: number;
  initialPurchasePrice?: number;
  initialArv?: number;
  initialClosingPct?: number;
  initialHoldingPct?: number;
  initialClosingMode?: CostMode;
  initialHoldingMode?: CostMode;
  initialClosingFlat?: number;
  initialHoldingFlat?: number;
  transactionCostActual?: number;
  holdingCostActual?: number;
  onSaved?: () => void;
}

export function ProfitCalculator({ 
  projectId,
  projectType = 'fix_flip',
  totalBudget, 
  totalSpent,
  initialPurchasePrice = 0,
  initialArv = 0,
  initialClosingPct = 6,
  initialHoldingPct = 3,
  initialClosingMode = 'pct',
  initialHoldingMode = 'pct',
  initialClosingFlat = 0,
  initialHoldingFlat = 0,
  transactionCostActual = 0,
  holdingCostActual = 0,
  onSaved,
}: ProfitCalculatorProps) {
  const [purchasePrice, setPurchasePrice] = useState(initialPurchasePrice);
  const [arv, setArv] = useState(initialArv);
  const [saving, setSaving] = useState(false);
  const [expandedBreakdown, setExpandedBreakdown] = useState<'estimated' | 'current' | 'roi' | null>(null);
  const [closingPct, setClosingPct] = useState(initialClosingPct);
  const [holdingPct, setHoldingPct] = useState(initialHoldingPct);
  const [closingMode, setClosingMode] = useState<CostMode>(initialClosingMode);
  const [holdingMode, setHoldingMode] = useState<CostMode>(initialHoldingMode);
  const [closingFlat, setClosingFlat] = useState(initialClosingFlat);
  const [holdingFlat, setHoldingFlat] = useState(initialHoldingFlat);

  useEffect(() => {
    setPurchasePrice(initialPurchasePrice);
    setArv(initialArv);
    setClosingPct(initialClosingPct);
    setHoldingPct(initialHoldingPct);
    setClosingMode(initialClosingMode);
    setHoldingMode(initialHoldingMode);
    setClosingFlat(initialClosingFlat);
    setHoldingFlat(initialHoldingFlat);
  }, [initialPurchasePrice, initialArv, initialClosingPct, initialHoldingPct, initialClosingMode, initialHoldingMode, initialClosingFlat, initialHoldingFlat]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('projects')
      .update({
        purchase_price: purchasePrice,
        arv: arv,
        closing_costs_pct: closingPct,
        holding_costs_pct: holdingPct,
        closing_costs_mode: closingMode,
        holding_costs_mode: holdingMode,
        closing_costs_flat: closingFlat,
        holding_costs_flat: holdingFlat,
      } as any)
      .eq('id', projectId);

    if (error) {
      toast.error('Failed to save');
      console.error(error);
    } else {
      toast.success('Saved');
      onSaved?.();
    }
    setSaving(false);
  };

  const cycleMode = (current: CostMode): CostMode => {
    if (current === 'pct') return 'flat';
    if (current === 'flat') return 'actual';
    return 'pct';
  };

  const closingCosts = closingMode === 'actual' ? transactionCostActual : closingMode === 'pct' ? arv * (closingPct / 100) : closingFlat;
  const holdingCosts = holdingMode === 'actual' ? holdingCostActual : holdingMode === 'pct' ? purchasePrice * (holdingPct / 100) : holdingFlat;

  const estimatedInvestment = purchasePrice + totalBudget;
  const estimatedTotalCosts = estimatedInvestment + closingCosts + holdingCosts;
  const estimatedProfit = arv - estimatedTotalCosts;

  const currentInvestment = purchasePrice + totalSpent;
  const currentTotalCosts = currentInvestment + closingCosts + holdingCosts;
  const currentProfit = arv - currentTotalCosts;

  const roi = currentInvestment > 0 ? (currentProfit / currentInvestment) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderModeToggle = (mode: CostMode, setMode: (m: CostMode) => void) => (
    <button
      type="button"
      onClick={() => setMode(cycleMode(mode))}
      className="inline-flex items-center rounded border border-muted-foreground/30 text-[10px] font-semibold overflow-hidden"
    >
      <span className={cn("px-1 py-px transition-colors", mode === 'pct' ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>%</span>
      <span className={cn("px-1 py-px transition-colors", mode === 'flat' ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>$</span>
      <span className={cn("px-1 py-px transition-colors", mode === 'actual' ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>A</span>
    </button>
  );

  const renderCostHelperText = (mode: CostMode, pct: number, costs: number, pctLabel: string) => {
    if (mode === 'actual') return `from project expenses = ${formatCurrency(costs)}`;
    if (mode === 'pct') return `% of ${pctLabel} = ${formatCurrency(costs)}`;
    return `= ${formatCurrency(costs)}`;
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Profit Calculator
        </CardTitle>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Save
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="purchase-price">{projectType === 'new_construction' ? 'Land Price' : 'Purchase Price'}</Label>
            <FormulaInput
              id="purchase-price"
              type="number"
              value={purchasePrice || ''}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="arv">After Repair Value (ARV)</Label>
            <FormulaInput
              id="arv"
              type="number"
              value={arv || ''}
              onChange={(e) => setArv(Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Label htmlFor="closing-costs" className="mb-0">Transaction Costs</Label>
              {renderModeToggle(closingMode, setClosingMode)}
            </div>
            <FormulaInput
              id="closing-costs"
              type="number"
              value={closingMode === 'actual' ? transactionCostActual : closingMode === 'pct' ? (closingPct || '') : (closingFlat || '')}
              onChange={(e) => closingMode === 'pct' ? setClosingPct(Number(e.target.value)) : setClosingFlat(Number(e.target.value))}
              placeholder="0"
              disabled={closingMode === 'actual'}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {renderCostHelperText(closingMode, closingPct, closingCosts, 'ARV')}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Label htmlFor="holding-costs" className="mb-0">Holding Costs</Label>
              {renderModeToggle(holdingMode, setHoldingMode)}
            </div>
            <FormulaInput
              id="holding-costs"
              type="number"
              value={holdingMode === 'actual' ? holdingCostActual : holdingMode === 'pct' ? (holdingPct || '') : (holdingFlat || '')}
              onChange={(e) => holdingMode === 'pct' ? setHoldingPct(Number(e.target.value)) : setHoldingFlat(Number(e.target.value))}
              placeholder="0"
              disabled={holdingMode === 'actual'}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {renderCostHelperText(holdingMode, holdingPct, holdingCosts, 'PP')}
            </p>
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground/50 -mt-3">
          <Calculator className="h-3 w-3" />
          Tip: type <span className="font-mono">=</span> for inline math (e.g. =50000-12000)
        </p>

        {/* Results */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div
            className={cn(
              "p-2 sm:p-4 rounded-lg text-center cursor-pointer transition-colors hover:ring-1 hover:ring-foreground/20",
              estimatedProfit >= 0 ? "bg-success/10" : "bg-destructive/10"
            )}
            onClick={() => setExpandedBreakdown(expandedBreakdown === 'estimated' ? null : 'estimated')}
          >
            <p className="text-sm text-muted-foreground mb-1">Est. Profit</p>
            <p className={cn(
              "text-lg sm:text-2xl font-bold font-mono",
              estimatedProfit >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(estimatedProfit)}
            </p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <p className="text-xs text-muted-foreground">using budget</p>
              {expandedBreakdown === 'estimated' ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
            </div>
          </div>
          <div
            className={cn(
              "p-2 sm:p-4 rounded-lg text-center cursor-pointer transition-colors hover:ring-1 hover:ring-foreground/20",
              currentProfit >= 0 ? "bg-success/10" : "bg-destructive/10"
            )}
            onClick={() => setExpandedBreakdown(expandedBreakdown === 'current' ? null : 'current')}
          >
            <p className="text-sm text-muted-foreground mb-1">Current Profit</p>
            <p className={cn(
              "text-lg sm:text-2xl font-bold font-mono",
              currentProfit >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(currentProfit)}
            </p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <p className="text-xs text-muted-foreground">using spent</p>
              {expandedBreakdown === 'current' ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
            </div>
          </div>
          <div
            className={cn(
              "p-2 sm:p-4 rounded-lg text-center cursor-pointer transition-colors hover:ring-1 hover:ring-foreground/20",
              roi >= 0 ? "bg-primary/10" : "bg-destructive/10"
            )}
            onClick={() => setExpandedBreakdown(expandedBreakdown === 'roi' ? null : 'roi')}
          >
            <p className="text-sm text-muted-foreground mb-1">ROI</p>
            <p className={cn(
              "text-lg sm:text-2xl font-bold font-mono flex items-center justify-center gap-1",
              roi >= 0 ? "text-primary" : "text-destructive"
            )}>
              <TrendingUp className="hidden sm:block h-5 w-5" />
              {roi.toFixed(1)}%
            </p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <p className="text-xs text-muted-foreground">on current</p>
              {expandedBreakdown === 'roi' ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
            </div>
          </div>
        </div>

        {/* Breakdown Panel */}
        {(expandedBreakdown === 'estimated' || expandedBreakdown === 'current') && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm font-mono animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ARV (Sale Price)</span>
              <span className="font-semibold">{formatCurrency(arv)}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>− {projectType === 'new_construction' ? 'Land Price' : 'Purchase Price'}</span>
              <span>{formatCurrency(purchasePrice)}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>− {expandedBreakdown === 'estimated' ? 'Construction Budget' : 'Construction Spent'}</span>
              <span>{formatCurrency(expandedBreakdown === 'estimated' ? totalBudget : totalSpent)}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>− Transaction Costs{closingMode === 'pct' ? ` (${closingPct}% ARV)` : closingMode === 'actual' ? ' (actual)' : ''}</span>
              <span>{formatCurrency(closingCosts)}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>− Holding Costs{holdingMode === 'pct' ? ` (${holdingPct}% PP)` : holdingMode === 'actual' ? ' (actual)' : ''}</span>
              <span>{formatCurrency(holdingCosts)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span className={cn(
                (expandedBreakdown === 'estimated' ? estimatedProfit : currentProfit) >= 0 ? "text-success" : "text-destructive"
              )}>
                = {expandedBreakdown === 'estimated' ? 'Est. Profit' : 'Current Profit'}
              </span>
              <span className={cn(
                (expandedBreakdown === 'estimated' ? estimatedProfit : currentProfit) >= 0 ? "text-success" : "text-destructive"
              )}>
                {formatCurrency(expandedBreakdown === 'estimated' ? estimatedProfit : currentProfit)}
              </span>
            </div>
          </div>
        )}

        {/* ROI Breakdown Panel */}
        {expandedBreakdown === 'roi' && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm font-mono animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Profit</span>
              <span className={cn("font-semibold", currentProfit >= 0 ? "text-success" : "text-destructive")}>
                {formatCurrency(currentProfit)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">÷ Total Investment</span>
              <span className="font-semibold">{formatCurrency(currentInvestment)}</span>
            </div>
            <div className="pl-4 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>{projectType === 'new_construction' ? 'Land Price' : 'Purchase Price'}</span>
                <span>{formatCurrency(purchasePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>+ Rehab Spent</span>
                <span>{formatCurrency(totalSpent)}</span>
              </div>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span className={cn(roi >= 0 ? "text-primary" : "text-destructive")}>
                = ROI
              </span>
              <span className={cn(roi >= 0 ? "text-primary" : "text-destructive")}>
                {roi.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
