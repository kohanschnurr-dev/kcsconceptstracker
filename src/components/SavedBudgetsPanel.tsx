import { useState, useEffect } from 'react';
import { Folder, Trash2, Edit2, Copy, ArrowRight, MoreHorizontal, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BUDGET_CATEGORIES } from '@/types';

interface BudgetTemplate {
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

interface SavedBudgetsPanelProps {
  onEditBudget: (template: BudgetTemplate) => void;
  onApplyToProject: (template: BudgetTemplate) => void;
  refreshTrigger?: number;
}

export function SavedBudgetsPanel({ 
  onEditBudget, 
  onApplyToProject,
  refreshTrigger 
}: SavedBudgetsPanelProps) {
  const [templates, setTemplates] = useState<BudgetTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<BudgetTemplate | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('budget_templates')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTemplates((data as BudgetTemplate[]) || []);
    } catch (error) {
      console.error('Error fetching budget templates:', error);
      toast.error('Failed to load saved budgets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [refreshTrigger]);

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      const { error } = await supabase
        .from('budget_templates')
        .delete()
        .eq('id', templateToDelete.id);

      if (error) throw error;
      
      toast.success('Budget deleted');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    } finally {
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleDuplicate = async (template: BudgetTemplate) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('budget_templates')
        .insert({
          user_id: user.id,
          name: `${template.name} (Copy)`,
          description: template.description,
          purchase_price: template.purchase_price,
          arv: template.arv,
          category_budgets: template.category_budgets,
        });

      if (error) throw error;
      
      toast.success('Budget duplicated');
      fetchTemplates();
    } catch (error) {
      console.error('Error duplicating budget:', error);
      toast.error('Failed to duplicate budget');
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

  // Calculate total from category_budgets (not stored total_budget which may be stale)
  const calculateTotal = (budgets: Record<string, number>) => {
    return Object.values(budgets).reduce((sum, val) => sum + (val || 0), 0);
  };

  const getCategoryCount = (budgets: Record<string, number>) => {
    return Object.values(budgets).filter(v => v > 0).length;
  };

  const getCategoryLabel = (categoryValue: string) => {
    const cat = BUDGET_CATEGORIES.find(c => c.value === categoryValue);
    return cat?.label || categoryValue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Folder className="h-5 w-5" />
            Saved Budgets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Folder className="h-5 w-5" />
            Saved Budgets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No saved budgets yet</p>
              <p className="text-sm">Create a budget and save it to your folder</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {templates.map((template) => {
                  const isExpanded = expandedId === template.id;
                  const calculatedTotal = calculateTotal(template.category_budgets);
                  const sortedCategories = Object.entries(template.category_budgets)
                    .filter(([_, value]) => value > 0)
                    .sort((a, b) => getCategoryLabel(a[0]).localeCompare(getCategoryLabel(b[0])));

                  return (
                    <Collapsible
                      key={template.id}
                      open={isExpanded}
                      onOpenChange={() => setExpandedId(isExpanded ? null : template.id)}
                    >
                      <div className="rounded-lg border bg-card overflow-hidden">
                        <div className="p-4 hover:bg-accent/50 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <CollapsibleTrigger asChild>
                              <button className="flex-1 min-w-0 text-left cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium truncate">{template.name}</h4>
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  )}
                                </div>
                                {template.description && (
                                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                                    {template.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <span className="font-mono text-primary font-medium">
                                    {formatCurrency(calculatedTotal)}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {getCategoryCount(template.category_budgets)} categories
                                  </span>
                                </div>
                              </button>
                            </CollapsibleTrigger>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEditBudget(template)}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onApplyToProject(template)}>
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Apply to Project
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setTemplateToDelete(template);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <CollapsibleContent>
                          <div className="border-t bg-muted/30 p-3">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                              {sortedCategories.map(([category, value]) => (
                                <div key={category} className="flex items-center justify-between text-sm py-1">
                                  <span className="text-muted-foreground truncate">
                                    {getCategoryLabel(category)}
                                  </span>
                                  <span className="font-mono text-xs ml-2 flex-shrink-0">
                                    {formatCurrency(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {(template.purchase_price > 0 || template.arv > 0) && (
                              <div className="border-t mt-3 pt-3 flex gap-4 text-sm">
                                {template.purchase_price > 0 && (
                                  <div>
                                    <span className="text-muted-foreground">Purchase: </span>
                                    <span className="font-mono">{formatCurrency(template.purchase_price)}</span>
                                  </div>
                                )}
                                {template.arv > 0 && (
                                  <div>
                                    <span className="text-muted-foreground">ARV: </span>
                                    <span className="font-mono">{formatCurrency(template.arv)}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
