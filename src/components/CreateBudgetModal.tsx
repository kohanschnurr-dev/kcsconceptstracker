import { useState, useEffect } from 'react';
import { ClipboardList, DollarSign, FolderOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BUDGET_CATEGORIES } from '@/types';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CreateBudgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTotalBudget?: number;
  onBudgetCreated?: () => void;
}

interface Project {
  id: string;
  name: string;
  address: string;
}

export function CreateBudgetModal({ 
  open, 
  onOpenChange, 
  initialTotalBudget = 0,
  onBudgetCreated 
}: CreateBudgetModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Category budgets - initialize with empty values
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    BUDGET_CATEGORIES.forEach(cat => {
      initial[cat.value] = '';
    });
    return initial;
  });

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, address')
          .eq('status', 'active')
          .order('name');
        
        if (error) throw error;
        setProjects(data || []);
      } catch (error: any) {
        console.error('Error fetching projects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load projects.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchProjects();
    }
  }, [open]);

  // Pre-fill if initial budget provided
  useEffect(() => {
    if (initialTotalBudget > 0) {
      const perCategory = Math.round(initialTotalBudget / BUDGET_CATEGORIES.length);
      const newBudgets: Record<string, string> = {};
      BUDGET_CATEGORIES.forEach(cat => {
        newBudgets[cat.value] = perCategory.toString();
      });
      setCategoryBudgets(newBudgets);
    }
  }, [initialTotalBudget]);

  const handleCategoryChange = (category: string, value: string) => {
    setCategoryBudgets(prev => ({
      ...prev,
      [category]: value,
    }));
  };

  const totalBudget = Object.values(categoryBudgets).reduce((sum, val) => {
    return sum + (parseFloat(val) || 0);
  }, 0);

  const handleDistributeEvenly = () => {
    if (totalBudget > 0) {
      const perCategory = Math.round(totalBudget / BUDGET_CATEGORIES.length);
      const newBudgets: Record<string, string> = {};
      BUDGET_CATEGORIES.forEach(cat => {
        newBudgets[cat.value] = perCategory.toString();
      });
      setCategoryBudgets(newBudgets);
    }
  };

  const handleClearAll = () => {
    const cleared: Record<string, string> = {};
    BUDGET_CATEGORIES.forEach(cat => {
      cleared[cat.value] = '';
    });
    setCategoryBudgets(cleared);
  };

  const handleApplyToProject = async () => {
    if (!selectedProject) {
      toast({
        title: 'Select a project',
        description: 'Please select a project to apply the budget to.',
        variant: 'destructive',
      });
      return;
    }

    const hasAnyBudget = Object.values(categoryBudgets).some(val => parseFloat(val) > 0);
    if (!hasAnyBudget) {
      toast({
        title: 'No budget entered',
        description: 'Please enter at least one category budget.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      // First, get existing categories for this project
      const { data: existingCategories, error: fetchError } = await supabase
        .from('project_categories')
        .select('id, category')
        .eq('project_id', selectedProject);

      if (fetchError) throw fetchError;

      const existingCategoryMap = new Map(
        existingCategories?.map(c => [c.category, c.id]) || []
      );

      // Prepare category data - update existing or insert new
      const categoriesToUpdate = [];
      const categoriesToInsert = [];

      for (const cat of BUDGET_CATEGORIES) {
        const budgetValue = parseFloat(categoryBudgets[cat.value]) || 0;
        if (budgetValue > 0) {
          const existingId = existingCategoryMap.get(cat.value);
          if (existingId) {
            categoriesToUpdate.push({
              id: existingId,
              estimated_budget: budgetValue,
            });
          } else {
            categoriesToInsert.push({
              project_id: selectedProject,
              category: cat.value,
              estimated_budget: budgetValue,
            });
          }
        }
      }

      // Update existing categories
      for (const cat of categoriesToUpdate) {
        const { error } = await supabase
          .from('project_categories')
          .update({ estimated_budget: cat.estimated_budget })
          .eq('id', cat.id);
        if (error) throw error;
      }

      // Insert new categories
      if (categoriesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('project_categories')
          .insert(categoriesToInsert);
        if (insertError) throw insertError;
      }

      // Update project total budget
      const { error: updateError } = await supabase
        .from('projects')
        .update({ total_budget: totalBudget })
        .eq('id', selectedProject);

      if (updateError) throw updateError;

      toast({
        title: 'Budget applied!',
        description: `Budget of $${totalBudget.toLocaleString()} has been applied to the project.`,
      });

      onBudgetCreated?.();
      onOpenChange(false);
      
      // Reset form
      handleClearAll();
      setSelectedProject('');
    } catch (error: any) {
      console.error('Error applying budget:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply budget.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] lg:max-w-7xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Create Budget
          </DialogTitle>
          <DialogDescription>
            Fill in budget amounts for each category, then apply to a project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Apply to Project
            </Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading projects..." : "Select a project"} />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex flex-col">
                      <span>{project.name}</span>
                      <span className="text-xs text-muted-foreground">{project.address}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Total Budget Display */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Budget</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(totalBudget)}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDistributeEvenly} className="flex-1">
              Distribute Evenly
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll} className="flex-1">
              Clear All
            </Button>
          </div>

          {/* Category Budgets - Grid Layout (A-Z down columns, 4 columns) */}
          <div className="grid gap-x-6 gap-y-1" style={{ gridAutoFlow: 'column', gridTemplateRows: 'repeat(16, auto)', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[...BUDGET_CATEGORIES]
              .sort((a, b) => a.label.localeCompare(b.label))
              .map(category => (
                <div key={category.value} className="flex items-center gap-3">
                  <Label className="w-44 text-sm flex-shrink-0" title={category.label}>
                    {category.label}
                  </Label>
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="0"
                      value={categoryBudgets[category.value]}
                      onChange={(e) => handleCategoryChange(category.value, e.target.value)}
                      className="pl-7 font-mono h-9"
                    />
                  </div>
                </div>
              ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleApplyToProject}
              disabled={isSaving || !selectedProject}
            >
              {isSaving ? 'Applying...' : 'Apply Budget'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
