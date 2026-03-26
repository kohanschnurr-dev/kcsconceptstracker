import { useState, useEffect } from 'react';
import { Check, X, ChevronDown, ChevronUp, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { getBudgetCategories } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PendingBudgetData {
  total_budget: number;
  category_budgets: Record<string, number>;
  applied_at: string;
  template_name?: string;
}

interface ExistingCategory {
  id: string;
  category: string;
  estimated_budget: number;
}

interface PendingBudgetDialogProps {
  projectId: string;
  pendingBudget: PendingBudgetData;
  existingCategories: ExistingCategory[];
  currentTotalBudget: number;
  onResolved: () => void;
}

export function PendingBudgetDialog({ projectId, pendingBudget, existingCategories, currentTotalBudget, onResolved }: PendingBudgetDialogProps) {
  const [open, setOpen] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Auto-open on mount
  useEffect(() => {
    setOpen(true);
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  const getCategoryLabel = (value: string) =>
    getBudgetCategories().find(b => b.value === value)?.label || value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const existingMap = new Map(existingCategories.map(c => [c.category, c]));
  const entries = Object.entries(pendingBudget.category_budgets || {});

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const categoriesToUpdate: { id: string; estimated_budget: number }[] = [];
      const categoriesToInsert: { project_id: string; category: string; estimated_budget: number }[] = [];

      for (const [cat, amount] of entries) {
        const existing = existingMap.get(cat);
        if (existing) {
          categoriesToUpdate.push({ id: existing.id, estimated_budget: amount });
        } else {
          categoriesToInsert.push({ project_id: projectId, category: cat, estimated_budget: amount });
        }
      }

      // Zero out categories not in the pending budget
      for (const existing of existingCategories) {
        if (!pendingBudget.category_budgets[existing.category]) {
          categoriesToUpdate.push({ id: existing.id, estimated_budget: 0 });
        }
      }

      for (const cat of categoriesToUpdate) {
        const { error } = await supabase
          .from('project_categories')
          .update({ estimated_budget: cat.estimated_budget })
          .eq('id', cat.id);
        if (error) throw error;
      }

      if (categoriesToInsert.length > 0) {
        const { error } = await supabase
          .from('project_categories')
          .insert(categoriesToInsert as any);
        if (error) throw error;
      }

      const { error: projectError } = await supabase
        .from('projects')
        .update({ total_budget: pendingBudget.total_budget, pending_budget: null } as any)
        .eq('id', projectId);
      if (projectError) throw projectError;

      toast.success('Budget updated! Total budget and allocations have been applied.');
      setOpen(false);
      onResolved();
    } catch (err: any) {
      console.error('Error accepting budget:', err);
      toast.error(err.message || 'Failed to accept budget');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ pending_budget: null } as any)
        .eq('id', projectId);
      if (error) throw error;
      toast.success('Pending budget dismissed');
      setOpen(false);
      onResolved();
    } catch (err: any) {
      toast.error(err.message || 'Failed to dismiss');
    } finally {
      setIsDismissing(false);
    }
  };

  const budgetDiff = pendingBudget.total_budget - currentTotalBudget;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/15 p-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Update Budget?</DialogTitle>
              <DialogDescription className="mt-1">
                {pendingBudget.template_name
                  ? `"${pendingBudget.template_name}" was applied in the Budget Calculator.`
                  : 'A new budget was applied in the Budget Calculator.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Budget comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Current Budget</p>
              <p className="text-lg font-semibold font-mono">{formatCurrency(currentTotalBudget)}</p>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">New Budget</p>
              <p className="text-lg font-semibold font-mono text-primary">{formatCurrency(pendingBudget.total_budget)}</p>
              {budgetDiff !== 0 && (
                <p className={`text-xs font-mono mt-0.5 ${budgetDiff < 0 ? 'text-success' : 'text-warning'}`}>
                  {budgetDiff > 0 ? '+' : ''}{formatCurrency(budgetDiff)}
                </p>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Accepting will update the Total Budget and all category allocations. Categories not in the new budget will be zeroed out. Existing expenses remain unchanged.
          </p>

          {/* Expandable category details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showDetails ? 'Hide' : 'View'} proposed allocations ({entries.length} categories)
          </button>

          {showDetails && (
            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
              {entries
                .sort(([a], [b]) => getCategoryLabel(a).localeCompare(getCategoryLabel(b)))
                .map(([cat, amount]) => {
                  const existing = existingMap.get(cat);
                  const isNew = !existing;
                  const isChanged = existing && existing.estimated_budget !== amount;
                  return (
                    <div key={cat} className="flex items-center justify-between bg-background rounded px-2 py-1.5 text-xs border">
                      <span className="truncate mr-2">{getCategoryLabel(cat)}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="font-mono font-medium">{formatCurrency(amount)}</span>
                        {isNew && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-primary border-primary">New</Badge>}
                        {isChanged && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-warning border-warning">Δ</Badge>}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleDismiss} disabled={isDismissing || isAccepting}>
            {isDismissing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <X className="h-3.5 w-3.5 mr-1.5" />}
            Dismiss
          </Button>
          <Button onClick={handleAccept} disabled={isAccepting || isDismissing}>
            {isAccepting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
            Approve Budget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
