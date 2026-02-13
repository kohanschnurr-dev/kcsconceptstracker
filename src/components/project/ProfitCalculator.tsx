import { useState, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, Save, Loader2, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { triggerSettingsSync } from '@/hooks/useSettingsSync';

type CostMode = 'pct' | 'flat';

interface FinancialPreset {
  name: string;
  closingPct: number;
  holdingPct: number;
  closingMode: CostMode;
  holdingMode: CostMode;
  closingFlat: number;
  holdingFlat: number;
  isDefault?: boolean;
}

const DEFAULT_PRESETS: FinancialPreset[] = [
  { name: 'Standard', closingPct: 6, holdingPct: 3, closingMode: 'pct', holdingMode: 'pct', closingFlat: 0, holdingFlat: 0, isDefault: true },
];

const PRESETS_KEY = 'profit-calculator-presets';

function loadPresets(): FinancialPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FinancialPreset[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [...DEFAULT_PRESETS];
}

function savePresets(presets: FinancialPreset[]) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  triggerSettingsSync();
}

interface ProfitCalculatorProps {
  projectId: string;
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
}

export function ProfitCalculator({ 
  projectId, 
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

  // Presets state
  const [presets, setPresets] = useState<FinancialPreset[]>(loadPresets);
  const [presetPopoverOpen, setPresetPopoverOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Reload presets when synced from another device
  useEffect(() => {
    const handler = () => setPresets(loadPresets());
    window.addEventListener('settings-synced', handler);
    return () => window.removeEventListener('settings-synced', handler);
  }, []);

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
    }
    setSaving(false);
  };

  const applyPreset = (presetName: string) => {
    const preset = presets.find(p => p.name === presetName);
    if (!preset) return;
    setClosingPct(preset.closingPct);
    setHoldingPct(preset.holdingPct);
    setClosingMode(preset.closingMode);
    setHoldingMode(preset.holdingMode);
    setClosingFlat(preset.closingFlat);
    setHoldingFlat(preset.holdingFlat);
  };

  const handleSavePreset = () => {
    const name = newPresetName.trim();
    if (!name) return;
    if (presets.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      toast.error('A preset with that name already exists');
      return;
    }
    const newPreset: FinancialPreset = {
      name,
      closingPct, holdingPct, closingMode, holdingMode, closingFlat, holdingFlat,
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    savePresets(updated);
    setNewPresetName('');
    setPresetPopoverOpen(false);
    toast.success(`Preset "${name}" saved`);
  };

  const handleDeletePreset = (presetName: string) => {
    const updated = presets.filter(p => p.name !== presetName);
    setPresets(updated);
    savePresets(updated);
    toast.success(`Preset deleted`);
  };

  const closingCosts = closingMode === 'pct' ? arv * (closingPct / 100) : closingFlat;
  const holdingCosts = holdingMode === 'pct' ? purchasePrice * (holdingPct / 100) : holdingFlat;

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

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Profit Calculator
        </CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <Select onValueChange={applyPreset}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Preset…" />
            </SelectTrigger>
            <SelectContent>
              {presets.map(p => (
                <div key={p.name} className="flex items-center group">
                  <SelectItem value={p.name} className="flex-1 text-xs">
                    {p.name}
                  </SelectItem>
                  {!p.isDefault && (
                    <button
                      type="button"
                      className="p-1 mr-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      onClick={(e) => { e.stopPropagation(); handleDeletePreset(p.name); }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </SelectContent>
          </Select>
          <Popover open={presetPopoverOpen} onOpenChange={setPresetPopoverOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Save Preset
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <div className="space-y-2">
                <Label className="text-xs">Preset Name</Label>
                <Input
                  value={newPresetName}
                  onChange={e => setNewPresetName(e.target.value)}
                  placeholder="e.g. My HM Deal"
                  className="h-8 text-xs"
                  onKeyDown={e => e.key === 'Enter' && handleSavePreset()}
                />
                <Button size="sm" className="w-full h-8 text-xs" onClick={handleSavePreset} disabled={!newPresetName.trim()}>
                  Save
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Save
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="purchase-price">Purchase Price</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="purchase-price"
                type="number"
                value={purchasePrice || ''}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                className="pl-9"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="arv">After Repair Value (ARV)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="arv"
                type="number"
                value={arv || ''}
                onChange={(e) => setArv(Number(e.target.value))}
                className="pl-9"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-3 gap-4">
          <div
            className={cn(
              "p-4 rounded-lg text-center cursor-pointer transition-colors hover:ring-1 hover:ring-foreground/20",
              estimatedProfit >= 0 ? "bg-success/10" : "bg-destructive/10"
            )}
            onClick={() => setExpandedBreakdown(expandedBreakdown === 'estimated' ? null : 'estimated')}
          >
            <p className="text-sm text-muted-foreground mb-1">Est. Profit</p>
            <p className={cn(
              "text-2xl font-bold font-mono",
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
              "p-4 rounded-lg text-center cursor-pointer transition-colors hover:ring-1 hover:ring-foreground/20",
              currentProfit >= 0 ? "bg-success/10" : "bg-destructive/10"
            )}
            onClick={() => setExpandedBreakdown(expandedBreakdown === 'current' ? null : 'current')}
          >
            <p className="text-sm text-muted-foreground mb-1">Current Profit</p>
            <p className={cn(
              "text-2xl font-bold font-mono",
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
              "p-4 rounded-lg text-center cursor-pointer transition-colors hover:ring-1 hover:ring-foreground/20",
              roi >= 0 ? "bg-primary/10" : "bg-destructive/10"
            )}
            onClick={() => setExpandedBreakdown(expandedBreakdown === 'roi' ? null : 'roi')}
          >
            <p className="text-sm text-muted-foreground mb-1">ROI</p>
            <p className={cn(
              "text-2xl font-bold font-mono flex items-center justify-center gap-1",
              roi >= 0 ? "text-primary" : "text-destructive"
            )}>
              <TrendingUp className="h-5 w-5" />
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
              <span>− Purchase Price</span>
              <span>{formatCurrency(purchasePrice)}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>− {expandedBreakdown === 'estimated' ? 'Rehab Budget' : 'Rehab Spent'}</span>
              <span>{formatCurrency(expandedBreakdown === 'estimated' ? totalBudget : totalSpent)}</span>
            </div>
            <div className="flex justify-between text-destructive items-center">
              <span className="inline-flex items-center gap-0.5">− Closing Costs
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setClosingMode(closingMode === 'pct' ? 'flat' : 'pct'); }}
                  className="inline-flex items-center rounded border border-muted-foreground/30 text-[10px] font-semibold overflow-hidden ml-0.5"
                >
                  <span className={cn("px-1 py-px transition-colors", closingMode === 'pct' ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>%</span>
                  <span className={cn("px-1 py-px transition-colors", closingMode === 'flat' ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>$</span>
                </button>
                {closingMode === 'pct' ? (
                  <span className="inline-flex items-center text-muted-foreground text-xs">(<input
                      type="number"
                      value={closingPct || ''}
                      onChange={(e) => setClosingPct(Number(e.target.value))}
                      className="w-8 text-xs text-center bg-transparent border-b border-muted-foreground/30 focus:outline-none focus:border-primary mx-px"
                      onClick={(e) => e.stopPropagation()}
                    />% ARV)</span>
                ) : (
                  <span className="inline-flex items-center text-muted-foreground text-xs">$<input
                      type="number"
                      value={closingFlat || ''}
                      onChange={(e) => setClosingFlat(Number(e.target.value))}
                      className="w-16 text-xs text-center bg-transparent border-b border-muted-foreground/30 focus:outline-none focus:border-primary mx-px"
                      onClick={(e) => e.stopPropagation()}
                    /></span>
                )}
              </span>
              <span>{formatCurrency(closingCosts)}</span>
            </div>
            <div className="flex justify-between text-destructive items-center">
              <span className="inline-flex items-center gap-0.5">− Holding Costs
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setHoldingMode(holdingMode === 'pct' ? 'flat' : 'pct'); }}
                  className="inline-flex items-center rounded border border-muted-foreground/30 text-[10px] font-semibold overflow-hidden ml-0.5"
                >
                  <span className={cn("px-1 py-px transition-colors", holdingMode === 'pct' ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>%</span>
                  <span className={cn("px-1 py-px transition-colors", holdingMode === 'flat' ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>$</span>
                </button>
                {holdingMode === 'pct' ? (
                  <span className="inline-flex items-center text-muted-foreground text-xs">(<input
                      type="number"
                      value={holdingPct || ''}
                      onChange={(e) => setHoldingPct(Number(e.target.value))}
                      className="w-8 text-xs text-center bg-transparent border-b border-muted-foreground/30 focus:outline-none focus:border-primary mx-px"
                      onClick={(e) => e.stopPropagation()}
                    />% PP)</span>
                ) : (
                  <span className="inline-flex items-center text-muted-foreground text-xs">$<input
                      type="number"
                      value={holdingFlat || ''}
                      onChange={(e) => setHoldingFlat(Number(e.target.value))}
                      className="w-16 text-xs text-center bg-transparent border-b border-muted-foreground/30 focus:outline-none focus:border-primary mx-px"
                      onClick={(e) => e.stopPropagation()}
                    /></span>
                )}
              </span>
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
                <span>Purchase Price</span>
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
