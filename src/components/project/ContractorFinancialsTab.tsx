import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, TrendingUp, TrendingDown, DollarSign, Percent, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExportReports } from '@/components/project/ExportReports';

interface ContractorFinancialsTabProps {
  projectId: string;
  totalSpent: number;
  totalBudget: number;
  categories: Array<{ id: string; category: string; estimated_budget: number; actualSpent: number }>;
  expenses: Array<any>;
  projectName: string;
  projectAddress: string;
  projectStartDate: string;
  projectStatus: string;
  purchasePrice?: number; // we reuse purchase_price as contract_value
  estLaborBudget?: number;
  estMaterialsBudget?: number;
  onSaved: () => void;
}

export function ContractorFinancialsTab({
  projectId,
  totalSpent,
  totalBudget,
  categories,
  expenses,
  projectName,
  projectAddress,
  projectStartDate,
  projectStatus,
  purchasePrice,
  estLaborBudget,
  estMaterialsBudget,
  onSaved,
}: ContractorFinancialsTabProps) {
  const { toast } = useToast();

  const [contractValue, setContractValue] = useState(purchasePrice ?? 0);
  const [laborBudget, setLaborBudget] = useState(estLaborBudget ?? 0);
  const [materialsBudget, setMaterialsBudget] = useState(estMaterialsBudget ?? 0);
  const [saving, setSaving] = useState(false);

  // Derived values
  const grossProfit = contractValue - totalSpent;
  const grossMarginPct = contractValue > 0 ? (grossProfit / contractValue) * 100 : 0;
  const isOverBudget = totalSpent > contractValue && contractValue > 0;
  const isOnBudget = totalSpent <= totalBudget && totalBudget > 0;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const saveField = async (field: 'purchase_price' | 'est_labor_budget' | 'est_materials_budget', value: number) => {
    setSaving(true);
    const { error } = await supabase
      .from('projects')
      .update({ [field]: value || null } as any)
      .eq('id', projectId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } else {
      onSaved();
    }
    setSaving(false);
  };

  const statusPill = () => {
    if (contractValue <= 0) return null;
    if (isOverBudget) {
      return (
        <Badge className="gap-1 bg-destructive/15 text-destructive border-destructive/30">
          <TrendingUp className="h-3 w-3" />
          Over Contract
        </Badge>
      );
    }
    if (totalSpent > totalBudget && totalBudget > 0) {
      return (
        <Badge className="gap-1 bg-warning/15 text-warning border-warning/30">
          <TrendingUp className="h-3 w-3" />
          Over Budget
        </Badge>
      );
    }
    return (
      <Badge className="gap-1 bg-success/15 text-success border-success/30">
        <TrendingDown className="h-3 w-3" />
        On Budget
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main P&L Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Contract Value - editable */}
        <Card className="glass-card">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Contract Value</span>
            </div>
            <Input
              type="number"
              value={contractValue || ''}
              placeholder="0"
              className="text-xl font-semibold font-mono h-auto py-1"
              onChange={(e) => setContractValue(Number(e.target.value))}
              onBlur={() => saveField('purchase_price', contractValue)}
            />
            <p className="text-xs text-muted-foreground mt-1.5">Total job contract amount</p>
          </CardContent>
        </Card>

        {/* Total Costs - read-only from expenses */}
        <Card className="glass-card">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-warning" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Total Costs</span>
            </div>
            <p className="text-xl font-semibold font-mono">{formatCurrency(totalSpent)}</p>
            <p className="text-xs text-muted-foreground mt-1.5">Actual expenses tracked</p>
          </CardContent>
        </Card>

        {/* Gross Profit */}
        <Card className="glass-card">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${grossProfit >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                {grossProfit >= 0 ? (
                  <TrendingDown className="h-4 w-4 text-success" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-destructive" />
                )}
              </div>
              <span className="text-sm font-medium text-muted-foreground">Gross Profit</span>
            </div>
            <p className={`text-xl font-semibold font-mono ${grossProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(grossProfit)}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">Contract Value − Total Costs</p>
          </CardContent>
        </Card>

        {/* Gross Margin % */}
        <Card className="glass-card">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Percent className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Gross Margin</span>
            </div>
            <p className={`text-xl font-semibold font-mono ${grossMarginPct >= 0 ? 'text-foreground' : 'text-destructive'}`}>
              {contractValue > 0 ? `${grossMarginPct.toFixed(1)}%` : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">Profit / Contract Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Labor & Materials Budgets */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Budget Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="labor-budget" className="text-xs text-muted-foreground">
                Est. Labor Budget
              </Label>
              <Input
                id="labor-budget"
                type="number"
                value={laborBudget || ''}
                placeholder="0"
                onChange={(e) => setLaborBudget(Number(e.target.value))}
                onBlur={() => saveField('est_labor_budget', laborBudget)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="materials-budget" className="text-xs text-muted-foreground">
                Est. Materials Budget
              </Label>
              <Input
                id="materials-budget"
                type="number"
                value={materialsBudget || ''}
                placeholder="0"
                onChange={(e) => setMaterialsBudget(Number(e.target.value))}
                onBlur={() => saveField('est_materials_budget', materialsBudget)}
              />
            </div>
          </div>
          {(laborBudget > 0 || materialsBudget > 0) && (
            <p className="text-xs text-muted-foreground mt-3">
              Est. Total: {formatCurrency(laborBudget + materialsBudget)}
              {contractValue > 0 && (
                <span className="ml-2">
                  ({(((laborBudget + materialsBudget) / contractValue) * 100).toFixed(0)}% of contract)
                </span>
              )}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Status indicator */}
      <div className="flex items-center gap-3">
        {statusPill()}
        {saving && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        )}
        {!saving && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <Save className="h-3 w-3" />
            Auto-saves
          </span>
        )}
      </div>

      {/* Export */}
      <ExportReports
        project={{
          id: projectId,
          name: projectName,
          address: projectAddress,
          total_budget: totalBudget,
          start_date: projectStartDate,
          status: projectStatus as any,
          purchase_price: contractValue,
          arv: undefined,
        }}
        categories={categories}
        expenses={expenses}
      />
    </div>
  );
}
