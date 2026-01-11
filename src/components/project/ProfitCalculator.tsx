import { useState, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, Percent, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProfitCalculatorProps {
  projectId: string;
  totalBudget: number;
  totalSpent: number;
  initialPurchasePrice?: number;
  initialArv?: number;
}

export function ProfitCalculator({ 
  projectId, 
  totalBudget, 
  totalSpent,
  initialPurchasePrice = 0,
  initialArv = 0
}: ProfitCalculatorProps) {
  const [purchasePrice, setPurchasePrice] = useState(initialPurchasePrice);
  const [arv, setArv] = useState(initialArv);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPurchasePrice(initialPurchasePrice);
    setArv(initialArv);
  }, [initialPurchasePrice, initialArv]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('projects')
      .update({
        purchase_price: purchasePrice,
        arv: arv,
      })
      .eq('id', projectId);

    if (error) {
      toast.error('Failed to save');
      console.error(error);
    } else {
      toast.success('Saved');
    }
    setSaving(false);
  };

  // Use actual spent if available, otherwise use budget
  const rehabCost = totalSpent > 0 ? totalSpent : totalBudget;
  const totalInvestment = purchasePrice + rehabCost;
  
  // Estimated closing costs (6% of ARV for selling)
  const closingCosts = arv * 0.06;
  
  // Holding costs estimate (assume 3 months at 1% of purchase per month)
  const holdingCosts = purchasePrice * 0.03;
  
  const totalCosts = totalInvestment + closingCosts + holdingCosts;
  const grossProfit = arv - totalCosts;
  const roi = totalInvestment > 0 ? (grossProfit / totalInvestment) * 100 : 0;
  
  // 70% rule check (max offer = ARV * 0.7 - repairs)
  const maxOffer = (arv * 0.7) - rehabCost;
  const meetsRule = purchasePrice <= maxOffer;

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
      <CardHeader className="flex flex-row items-center justify-between">
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

        {/* 70% Rule Check */}
        {arv > 0 && (
          <div className={cn(
            "p-3 rounded-lg border",
            meetsRule ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <Percent className="h-4 w-4" />
              <span className="font-medium">70% Rule</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Max offer: <span className="font-mono font-medium">{formatCurrency(maxOffer)}</span>
              {meetsRule ? (
                <span className="text-success ml-2">✓ Meets rule</span>
              ) : (
                <span className="text-destructive ml-2">✗ Over by {formatCurrency(purchasePrice - maxOffer)}</span>
              )}
            </p>
          </div>
        )}

        {/* Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Purchase Price</span>
            <span className="font-mono">{formatCurrency(purchasePrice)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Rehab Cost {totalSpent > 0 ? '(Actual)' : '(Budget)'}</span>
            <span className="font-mono">{formatCurrency(rehabCost)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Est. Closing Costs (6%)</span>
            <span className="font-mono">{formatCurrency(closingCosts)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Est. Holding Costs (3 mo)</span>
            <span className="font-mono">{formatCurrency(holdingCosts)}</span>
          </div>
          <div className="flex justify-between py-2 border-b font-medium">
            <span>Total Investment</span>
            <span className="font-mono">{formatCurrency(totalCosts)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">ARV (Sale Price)</span>
            <span className="font-mono">{formatCurrency(arv)}</span>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 gap-4">
          <div className={cn(
            "p-4 rounded-lg text-center",
            grossProfit >= 0 ? "bg-success/10" : "bg-destructive/10"
          )}>
            <p className="text-sm text-muted-foreground mb-1">Est. Profit</p>
            <p className={cn(
              "text-2xl font-bold font-mono",
              grossProfit >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(grossProfit)}
            </p>
          </div>
          <div className={cn(
            "p-4 rounded-lg text-center",
            roi >= 0 ? "bg-primary/10" : "bg-destructive/10"
          )}>
            <p className="text-sm text-muted-foreground mb-1">ROI</p>
            <p className={cn(
              "text-2xl font-bold font-mono flex items-center justify-center gap-1",
              roi >= 0 ? "text-primary" : "text-destructive"
            )}>
              <TrendingUp className="h-5 w-5" />
              {roi.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
