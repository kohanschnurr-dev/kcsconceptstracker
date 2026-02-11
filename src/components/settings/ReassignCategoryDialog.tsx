import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { CategoryItem } from '@/hooks/useCustomCategories';

interface ReassignCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: { value: string; label: string } | null;
  remainingCategories: CategoryItem[];
  onComplete: (value: string) => void; // called after reassignment to remove from master list
}

export default function ReassignCategoryDialog({
  open,
  onOpenChange,
  category,
  remainingCategories,
  onComplete,
}: ReassignCategoryDialogProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expenseCount, setExpenseCount] = useState(0);
  const [categoryRows, setCategoryRows] = useState<{ id: string; project_id: string }[]>([]);
  const [targetCategory, setTargetCategory] = useState('');

  // On open, query DB for usage
  useEffect(() => {
    if (!open || !category) return;
    setLoading(true);
    setTargetCategory('');

    (async () => {
      // Find all project_categories rows with this category value
      const { data: pcRows } = await supabase
        .from('project_categories')
        .select('id, project_id')
        .eq('category', category.value as any);

      const rows = pcRows ?? [];
      setCategoryRows(rows);

      if (rows.length === 0) {
        // No DB usage at all — just remove immediately
        setLoading(false);
        onComplete(category.value);
        onOpenChange(false);
        return;
      }

      // Count expenses linked to these project_category ids
      const ids = rows.map(r => r.id);
      const { count } = await supabase
        .from('expenses')
        .select('id', { count: 'exact', head: true })
        .in('category_id', ids);

      setExpenseCount(count ?? 0);
      setLoading(false);
    })();
  }, [open, category]);

  const handleConfirm = async () => {
    if (!category) return;

    // If no expenses, just delete the project_categories rows and remove
    if (expenseCount === 0) {
      setSaving(true);
      const ids = categoryRows.map(r => r.id);
      await supabase.from('project_categories').delete().in('id', ids);
      setSaving(false);
      onComplete(category.value);
      onOpenChange(false);
      toast.success(`Removed "${category.label}" and cleaned up project budgets`);
      return;
    }

    // Need a target to reassign to
    if (!targetCategory) {
      toast.error('Please select a category to reassign expenses to');
      return;
    }

    setSaving(true);
    try {
      // For each project that has the old category, ensure a project_categories row exists for the new category
      const projectIds = [...new Set(categoryRows.map(r => r.project_id))];

      for (const projectId of projectIds) {
        // Check if new category already exists for this project
        const { data: existing } = await supabase
          .from('project_categories')
          .select('id')
          .eq('project_id', projectId)
          .eq('category', targetCategory as any)
          .maybeSingle();

        let newCategoryId: string;

        if (existing) {
          newCategoryId = existing.id;
        } else {
          // Create the new category row with 0 budget
          const { data: inserted, error } = await supabase
            .from('project_categories')
            .insert({ project_id: projectId, category: targetCategory as any, estimated_budget: 0 })
            .select('id')
            .single();

          if (error) throw error;
          newCategoryId = inserted.id;
        }

        // Find old category id for this project
        const oldRow = categoryRows.find(r => r.project_id === projectId);
        if (!oldRow) continue;

        // Move expenses from old to new
        await supabase
          .from('expenses')
          .update({ category_id: newCategoryId })
          .eq('category_id', oldRow.id);
      }

      // Delete old project_categories rows
      const oldIds = categoryRows.map(r => r.id);
      await supabase.from('project_categories').delete().in('id', oldIds);

      onComplete(category.value);
      onOpenChange(false);
      toast.success(`Reassigned ${expenseCount} expense(s) and removed "${category.label}"`);
    } catch (err) {
      console.error('Reassignment error:', err);
      toast.error('Failed to reassign expenses');
    } finally {
      setSaving(false);
    }
  };

  const selectableCategories = remainingCategories.filter(c => c.value !== category?.value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove "{category?.label}"?</DialogTitle>
          <DialogDescription>
            {loading
              ? 'Checking for existing expenses…'
              : expenseCount > 0
                ? `${expenseCount} expense(s) are assigned to this category. Choose a category to reassign them to before removing.`
                : `This category is used in project budgets but has no expenses. It will be removed from all projects.`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {expenseCount > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Reassign expenses to:</label>
                <Select value={targetCategory} onValueChange={setTargetCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableCategories.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={saving || (expenseCount > 0 && !targetCategory)}
              >
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {expenseCount > 0 ? 'Reassign & Remove' : 'Remove'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
