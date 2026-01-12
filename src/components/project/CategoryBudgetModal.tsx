import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BUDGET_CATEGORIES } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, DollarSign } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type BudgetCategory = Database['public']['Enums']['budget_category'];

interface CategoryBudgetModalProps {
  projectId: string;
  existingCategories: { id: string; category: string; estimated_budget: number }[];
  editingCategory?: { id: string; category: string; estimated_budget: number } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryUpdated: () => void;
}

export function CategoryBudgetModal({
  projectId,
  existingCategories,
  editingCategory,
  open,
  onOpenChange,
  onCategoryUpdated,
}: CategoryBudgetModalProps) {
  const [category, setCategory] = useState<string>('');
  const [estimatedBudget, setEstimatedBudget] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!editingCategory;

  useEffect(() => {
    if (editingCategory) {
      setCategory(editingCategory.category);
      setEstimatedBudget(editingCategory.estimated_budget.toString());
    } else {
      setCategory('');
      setEstimatedBudget('');
    }
  }, [editingCategory, open]);

  // Filter out categories that already exist (except when editing)
  const availableCategories = BUDGET_CATEGORIES.filter(cat => {
    if (isEditMode && cat.value === editingCategory?.category) return true;
    return !existingCategories.some(ec => ec.category === cat.value);
  });

  const handleSubmit = async () => {
    if (!category) {
      toast.error('Please select a category');
      return;
    }

    const budget = parseFloat(estimatedBudget) || 0;

    setIsSubmitting(true);

    try {
      if (isEditMode && editingCategory) {
        const { error } = await supabase
          .from('project_categories')
          .update({
            category: category as BudgetCategory,
            estimated_budget: budget,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Category updated successfully');
      } else {
        const { error } = await supabase
          .from('project_categories')
          .insert({
            project_id: projectId,
            category: category as BudgetCategory,
            estimated_budget: budget,
          });

        if (error) throw error;
        toast.success('Category added successfully');
      }

      onCategoryUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrencyInput = (value: string) => {
    // Remove non-numeric characters except decimal
    return value.replace(/[^0-9.]/g, '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Category Budget' : 'Add Budget Category'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the budget estimate for this category.'
              : 'Add a new budget category with an estimated budget.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={category} 
              onValueChange={setCategory}
              disabled={isEditMode}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {availableCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEditMode && (
              <p className="text-xs text-muted-foreground">
                Category cannot be changed. Delete and create a new one if needed.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Estimated Budget</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="budget"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={estimatedBudget}
                onChange={(e) => setEstimatedBudget(formatCurrencyInput(e.target.value))}
                className="pl-9 font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter 0 if you don't have an estimate yet
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditMode ? 'Save Changes' : 'Add Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteCategoryDialogProps {
  category: { id: string; category: string; actualSpent: number } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryDeleted: () => void;
}

export function DeleteCategoryDialog({
  category,
  open,
  onOpenChange,
  onCategoryDeleted,
}: DeleteCategoryDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const getCategoryLabel = (value: string) => {
    return BUDGET_CATEGORIES.find(c => c.value === value)?.label || value;
  };

  const handleDelete = async () => {
    if (!category) return;

    setIsDeleting(true);

    try {
      // Check if there are expenses in this category
      const { count } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id);

      if (count && count > 0) {
        toast.error(`Cannot delete: ${count} expense(s) are assigned to this category. Delete or reassign them first.`);
        setIsDeleting(false);
        return;
      }

      const { error } = await supabase
        .from('project_categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      toast.success('Category deleted successfully');
      onCategoryDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this budget category?
          </DialogDescription>
        </DialogHeader>

        {category && (
          <div className="py-4">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="font-medium">{getCategoryLabel(category.category)}</p>
              {category.actualSpent > 0 && (
                <p className="text-sm text-warning mt-1">
                  This category has ${category.actualSpent.toLocaleString()} in expenses
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              This action cannot be undone. Any expenses in this category must be deleted or reassigned first.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
