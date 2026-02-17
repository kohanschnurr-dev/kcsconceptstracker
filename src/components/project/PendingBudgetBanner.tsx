import { useState } from 'react';
import { AlertTriangle, Check, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

interface PendingBudgetBannerProps {
  projectId: string;
  pendingBudget: PendingBudgetData;
  existingCategories: ExistingCategory[];
  onResolved: () => void;
}

export function PendingBudgetBanner({ projectId, pendingBudget, existingCategories, onResolved }: PendingBudgetBannerProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  const getCategoryLabel = (value: string) =>
    getBudgetCategories().find(b => b.value === value)?.label || value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const existingMap = new Map(existingCategories.map(c => [c.category, c]));

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const categoriesToUpdate: { id: string; estimated_budget: number }[] = [];
      const categoriesToInsert: { project_id: string; category: string; estimated_budget: number }[] = [];

      for (const [cat, amount] of Object.entries(pendingBudget.category_budgets)) {
        const existing = existingMap.get(cat);
        if (existing) {
          categoriesToUpdate.push({ id: existing.id, estimated_budget: amount });
        } else {
          categoriesToInsert.push({ project_id: projectId, category: cat, estimated_budget: amount });
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

      toast.success('Budget accepted and applied to project');
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
      onResolved();
    } catch (err: any) {
      toast.error(err.message || 'Failed to dismiss');
    } finally {
      setIsDismissing(false);
    }
  };

  const entries = Object.entries(pendingBudget.category_budgets);

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/15 p-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">New Budget Was Applied</h3>
              <p className="text-xs text-muted-foreground">
                {pendingBudget.template_name ? `"${pendingBudget.template_name}" — ` : ''}
                {formatCurrency(pendingBudget.total_budget)} total
                {' · '}
                {entries.length} categories
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" onClick={handleDismiss} disabled={isDismissing || isAccepting}>
              {isDismissing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              <span className="ml-1.5">Dismiss</span>
            </Button>
            <Button size="sm" onClick={handleAccept} disabled={isAccepting || isDismissing}>
              {isAccepting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              <span className="ml-1.5">Accept Budget</span>
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Existing expenses stay in their categories. Matching categories will be updated, new ones added, and unmatched existing categories kept unchanged.
        </p>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showDetails ? 'Hide' : 'View'} proposed allocations
        </button>

        {showDetails && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
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
                      {isChanged && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-warning border-warning">Updated</Badge>}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
