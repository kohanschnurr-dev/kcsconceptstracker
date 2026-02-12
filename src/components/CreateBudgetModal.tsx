import { useState, useEffect } from 'react';
import { ClipboardList, DollarSign, FolderOpen, Save, Loader2, RefreshCw } from 'lucide-react';
import { ProjectAutocomplete } from '@/components/ProjectAutocomplete';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getBudgetCategories } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CreateBudgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTotalBudget?: number;
  onBudgetCreated?: () => void;
  editingTemplate?: BudgetTemplate | null;
  defaultTab?: 'save' | 'apply';
}

interface Project {
  id: string;
  name: string;
  address: string;
}

export interface BudgetTemplate {
  id: string;
  name: string;
  description: string | null;
  purchase_price: number;
  arv: number;
  category_budgets: Record<string, number>;
  total_budget: number;
  created_at: string;
  updated_at: string;
}

export function CreateBudgetModal({ 
  open, 
  onOpenChange, 
  initialTotalBudget = 0,
  onBudgetCreated,
  editingTemplate,
  defaultTab = 'save'
}: CreateBudgetModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  
  // Template fields
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [arv, setArv] = useState('');
  
  // Rehab Budget - manual override mode
  const [rehabBudgetManual, setRehabBudgetManual] = useState('');
  const [isRehabBudgetManual, setIsRehabBudgetManual] = useState(false);
  
  // Category budgets
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    getBudgetCategories().forEach(cat => {
      initial[cat.value] = '';
    });
    return initial;
  });

  // Reset form when modal opens/closes or when editing template changes
  useEffect(() => {
    if (open) {
      if (editingTemplate) {
        setTemplateName(editingTemplate.name);
        setTemplateDescription(editingTemplate.description || '');
        setPurchasePrice(editingTemplate.purchase_price?.toString() || '');
        setArv(editingTemplate.arv?.toString() || '');
        
        const budgets: Record<string, string> = {};
        getBudgetCategories().forEach(cat => {
          budgets[cat.value] = editingTemplate.category_budgets[cat.value]?.toString() || '';
        });
        setCategoryBudgets(budgets);
        setActiveTab(defaultTab);
        // Reset manual mode when editing
        setIsRehabBudgetManual(false);
        setRehabBudgetManual('');
      } else {
        // Reset form for new budget
        setTemplateName('');
        setTemplateDescription('');
        setPurchasePrice('');
        setArv('');
        setIsRehabBudgetManual(false);
        setRehabBudgetManual('');
        
        if (initialTotalBudget > 0) {
          const allCats = getBudgetCategories();
          const perCategory = Math.round(initialTotalBudget / allCats.length);
          const newBudgets: Record<string, string> = {};
          allCats.forEach(cat => {
            newBudgets[cat.value] = perCategory.toString();
          });
          setCategoryBudgets(newBudgets);
        } else {
          const cleared: Record<string, string> = {};
          getBudgetCategories().forEach(cat => {
            cleared[cat.value] = '';
          });
          setCategoryBudgets(cleared);
        }
        setActiveTab(defaultTab);
      }
    }
  }, [open, editingTemplate, initialTotalBudget, defaultTab]);

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
        toast.error('Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchProjects();
    }
  }, [open]);

  const handleCategoryChange = (category: string, value: string) => {
    setCategoryBudgets(prev => ({
      ...prev,
      [category]: value,
    }));
  };

  // Calculate total from categories
  const calculatedTotal = Object.values(categoryBudgets).reduce((sum, val) => {
    return sum + (parseFloat(val) || 0);
  }, 0);

  // The displayed/used total budget - manual value when in manual mode, otherwise calculated
  const totalBudget = isRehabBudgetManual 
    ? (parseFloat(rehabBudgetManual) || 0) 
    : calculatedTotal;

  // Handle rehab budget input change - switches to manual mode
  const handleRehabBudgetChange = (value: string) => {
    setRehabBudgetManual(value);
    setIsRehabBudgetManual(true);
  };

  // Reset to auto-calculated mode
  const handleResetRehabBudget = () => {
    setIsRehabBudgetManual(false);
    setRehabBudgetManual('');
  };

  const handleDistributeEvenly = () => {
    const budgetToDistribute = isRehabBudgetManual 
      ? (parseFloat(rehabBudgetManual) || 0) 
      : calculatedTotal;
    
    if (budgetToDistribute > 0) {
      const allCats = getBudgetCategories();
      const perCategory = Math.round(budgetToDistribute / allCats.length);
      const newBudgets: Record<string, string> = {};
      allCats.forEach(cat => {
        newBudgets[cat.value] = perCategory.toString();
      });
      setCategoryBudgets(newBudgets);
      // After distributing, switch back to auto mode since categories now match
      setIsRehabBudgetManual(false);
      setRehabBudgetManual('');
    }
  };

  const handleClearAll = () => {
    const cleared: Record<string, string> = {};
    getBudgetCategories().forEach(cat => {
      cleared[cat.value] = '';
    });
    setCategoryBudgets(cleared);
  };

  const getCategoryBudgetsObject = () => {
    const budgets: Record<string, number> = {};
    getBudgetCategories().forEach(cat => {
      const val = parseFloat(categoryBudgets[cat.value]) || 0;
      if (val > 0) {
        budgets[cat.value] = val;
      }
    });
    return budgets;
  };

  const handleSaveToFolder = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a name for this budget');
      return;
    }

    const hasAnyBudget = Object.values(categoryBudgets).some(val => parseFloat(val) > 0);
    if (!hasAnyBudget) {
      toast.error('Please enter at least one category budget');
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const templateData = {
        user_id: user.id,
        name: templateName.trim(),
        description: templateDescription.trim() || null,
        purchase_price: parseFloat(purchasePrice) || 0,
        arv: parseFloat(arv) || 0,
        category_budgets: getCategoryBudgetsObject(),
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('budget_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);
        
        if (error) throw error;
        toast.success('Budget updated');
      } else {
        const { error } = await supabase
          .from('budget_templates')
          .insert(templateData);
        
        if (error) throw error;
        toast.success('Budget saved to folder');
      }

      onBudgetCreated?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving budget:', error);
      toast.error(error.message || 'Failed to save budget');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyToProject = async () => {
    if (!selectedProject) {
      toast.error('Please select a project');
      return;
    }

    const hasAnyBudget = Object.values(categoryBudgets).some(val => parseFloat(val) > 0);
    if (!hasAnyBudget) {
      toast.error('Please enter at least one category budget');
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

      // Prepare category data
      const categoriesToUpdate = [];
      const categoriesToInsert = [];

      for (const cat of getBudgetCategories()) {
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

      toast.success(`Budget of $${totalBudget.toLocaleString()} applied to project`);
      onBudgetCreated?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error applying budget:', error);
      toast.error(error.message || 'Failed to apply budget');
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
      <DialogContent className="sm:max-w-[95vw] lg:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            {editingTemplate ? 'Edit Budget' : 'Create Budget'}
          </DialogTitle>
          <DialogDescription>
            Fill in budget amounts for each category, then save to your folder or apply to a project.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Global Settings */}
          <div className="w-72 border-r bg-muted/30 p-4 flex flex-col gap-4">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Budget</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(totalBudget)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="templateName" className="text-xs">Budget Name *</Label>
                <Input
                  id="templateName"
                  placeholder="e.g., Standard 3BR Flip"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="templateDescription" className="text-xs">Description</Label>
                <Textarea
                  id="templateDescription"
                  placeholder="Optional notes..."
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="h-16 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="purchasePrice" className="text-xs">Purchase Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="purchasePrice"
                    type="number"
                    placeholder="0"
                    className="pl-7 h-9"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="arv" className="text-xs">ARV</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="arv"
                    type="number"
                    placeholder="0"
                    className="pl-7 h-9"
                    value={arv}
                    onChange={(e) => setArv(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rehabBudget" className="text-xs flex items-center gap-1">
                  Rehab Budget
                  {isRehabBudgetManual && (
                    <span className="text-[10px] text-muted-foreground">(manual)</span>
                  )}
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="rehabBudget"
                    type="number"
                    placeholder="0"
                    className={cn(
                      "pl-7 pr-8 h-9 font-mono",
                      !isRehabBudgetManual && "text-muted-foreground"
                    )}
                    value={isRehabBudgetManual ? rehabBudgetManual : calculatedTotal.toString()}
                    onChange={(e) => handleRehabBudgetChange(e.target.value)}
                  />
                  {isRehabBudgetManual && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={handleResetRehabBudget}
                      title="Reset to auto-calculated"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-auto">
              <Button variant="outline" size="sm" onClick={handleDistributeEvenly}>
                Distribute Evenly
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
            </div>
          </div>

          {/* Main Content - Category Grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="grid grid-cols-4 gap-x-4 gap-y-1">
                {[...getBudgetCategories()]
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map(category => (
                    <div key={category.value} className="flex items-center gap-2">
                      <Label className="w-36 text-xs truncate flex-shrink-0" title={category.label}>
                        {category.label}
                      </Label>
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="0"
                          value={categoryBudgets[category.value]}
                          onChange={(e) => handleCategoryChange(category.value, e.target.value)}
                          className="pl-6 font-mono h-8 text-sm"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t p-4 bg-muted/20">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="save">
                    <Save className="h-4 w-4 mr-2" />
                    Save to Folder
                  </TabsTrigger>
                  <TabsTrigger value="apply">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Apply to Project
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="save" className="mt-0">
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button className="flex-1" onClick={handleSaveToFolder} disabled={isSaving}>
                      {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {editingTemplate ? 'Update Budget' : 'Save to Folder'}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="apply" className="mt-0 space-y-3">
                  <ProjectAutocomplete
                    projects={projects}
                    value={selectedProject}
                    onSelect={setSelectedProject}
                    placeholder={isLoading ? "Loading projects..." : "Search projects..."}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button className="flex-1" onClick={handleApplyToProject} disabled={isSaving || !selectedProject}>
                      {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Apply Budget
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
