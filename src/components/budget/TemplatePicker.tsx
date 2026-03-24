import { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronRight, Ruler, FolderOpen, Plus, Settings, Star, Trash2, Copy } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BudgetTemplate {
  id: string;
  name: string;
  description: string | null;
  purchase_price: number;
  arv: number;
  sqft: number | null;
  is_default: boolean;
  category_budgets: Record<string, number>;
  total_budget: number;
}

interface TemplatePickerProps {
  onSelectTemplate: (template: BudgetTemplate | null) => void;
  onCreateNew: () => void;
  currentTemplateName?: string;
  sqft: string;
  onSqftChange: (value: string) => void;
  refreshKey?: number;
}

interface BaselineTier {
  name: string;
  pricePerSqft: number;
  description: string;
}

const DEFAULT_BASELINE_TIERS: BaselineTier[] = [
  { name: 'Cosmetic', pricePerSqft: 35, description: 'Light refresh - paint, fixtures' },
  { name: 'Standard', pricePerSqft: 45, description: 'Typical rental-ready updates' },
  { name: 'High Level', pricePerSqft: 55, description: 'Quality finishes and systems' },
  { name: 'Overhaul', pricePerSqft: 65, description: 'Major renovation work' },
];

const BASELINES_STORAGE_KEY = 'budget-baseline-tiers';

const DEFAULT_CATEGORY_PRESETS = [
  { category: 'painting', label: 'Painting', pricePerSqft: 3.50 },
  { category: 'flooring', label: 'Flooring', pricePerSqft: 8.00 },
  { category: 'tile', label: 'Tile', pricePerSqft: 12.00 },
  { category: 'drywall', label: 'Drywall', pricePerSqft: 2.50 },
  { category: 'roofing', label: 'Roofing', pricePerSqft: 5.00 },
];

export function TemplatePicker({ onSelectTemplate, onCreateNew, currentTemplateName, sqft, onSqftChange, refreshKey }: TemplatePickerProps) {
  const [savedTemplates, setSavedTemplates] = useState<BudgetTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [baselineTiers, setBaselineTiers] = useState<BaselineTier[]>(DEFAULT_BASELINE_TIERS);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTiers, setEditingTiers] = useState<BaselineTier[]>([]);
  const [baselinesOpen, setBaselinesOpen] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('budget_templates')
          .select('*')
          .order('is_default', { ascending: false })
          .order('updated_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        
        const templates: BudgetTemplate[] = (data || []).map(d => ({
          id: d.id,
          name: d.name,
          description: d.description,
          purchase_price: d.purchase_price || 0,
          arv: d.arv || 0,
          sqft: d.sqft,
          is_default: d.is_default || false,
          category_budgets: (d.category_budgets as Record<string, number>) || {},
          total_budget: d.total_budget || 0,
        }));
        
        setSavedTemplates(templates);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [refreshKey]);

  // Load custom baselines from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(BASELINES_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 4) {
          setBaselineTiers(parsed);
        }
      } catch (e) {
        console.error('Failed to parse stored baselines:', e);
      }
    }
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleBaselineSelect = (tier: BaselineTier) => {
    const sqftNum = parseFloat(sqft) || 0;
    const totalBudget = sqftNum * tier.pricePerSqft;
    
    // Pre-populate preset categories and put remainder into Filler
    const categoryBudgets: Record<string, number> = {};
    if (sqftNum > 0) {
      const stored = localStorage.getItem('budget-category-presets');
      const presets: { category: string; pricePerSqft: number; mode?: string }[] = stored ? JSON.parse(stored) : [];
      let presetsTotal = 0;
      presets.forEach(p => {
        const amt = p.mode === 'flat' ? p.pricePerSqft : sqftNum * p.pricePerSqft;
        categoryBudgets[p.category] = amt;
        presetsTotal += amt;
      });
      categoryBudgets['rehab_filler'] = Math.max(0, totalBudget - presetsTotal);
    }

    const template: BudgetTemplate = {
      id: `baseline-${tier.name.toLowerCase().replace(' ', '-')}`,
      name: tier.name,
      description: `$${tier.pricePerSqft}/sqft`,
      purchase_price: 0,
      arv: 0,
      sqft: sqftNum || null,
      is_default: false,
      total_budget: totalBudget,
      category_budgets: categoryBudgets,
    };
    
    onSelectTemplate(template);
  };

  const handleOpenEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingTiers([...baselineTiers]);
    setIsEditOpen(true);
  };

  const handleSaveBaselines = () => {
    setBaselineTiers(editingTiers);
    localStorage.setItem(BASELINES_STORAGE_KEY, JSON.stringify(editingTiers));
    setIsEditOpen(false);
  };

  const handleResetDefaults = () => {
    setEditingTiers([...DEFAULT_BASELINE_TIERS]);
  };

  const updateEditingTier = (index: number, field: 'name' | 'pricePerSqft', value: string | number) => {
    setEditingTiers(prev => prev.map((tier, i) => 
      i === index ? { ...tier, [field]: value } : tier
    ));
  };

  const handleSetDefault = async (e: React.MouseEvent, templateId: string, currentlyDefault: boolean) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('budget_templates')
        .update({ is_default: !currentlyDefault })
        .eq('id', templateId);

      if (error) throw error;

      // Update local state
      setSavedTemplates(prev => prev.map(t => ({
        ...t,
        is_default: t.id === templateId ? !currentlyDefault : (currentlyDefault ? t.is_default : false)
      })));
      
      toast.success(currentlyDefault ? 'Default removed' : 'Set as default startup template');
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to update default');
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, templateId: string, templateName: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteTarget({ id: templateId, name: templateName });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase
        .from('budget_templates')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;
      setSavedTemplates(prev => prev.filter(t => t.id !== deleteTarget.id));
      toast.success('Budget deleted');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete budget');
    } finally {
      setDeleteTarget(null);
    }
  };

  const sqftNum = parseFloat(sqft) || 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            {currentTemplateName || 'Load Template'}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          <DropdownMenuItem onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Start Blank
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <Collapsible open={baselinesOpen} onOpenChange={setBaselinesOpen}>
            <CollapsibleTrigger asChild>
              <div 
                className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ChevronRight 
                    className={`h-3 w-3 transition-transform ${baselinesOpen ? 'rotate-90' : ''}`} 
                  />
                  <Ruler className="h-3 w-3" />
                  Baselines
                </div>
                <button
                  onClick={handleOpenEdit}
                  className="p-1 hover:bg-accent rounded-sm transition-colors"
                >
                  <Settings className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              {baselineTiers.map((tier, index) => {
                const calculatedTotal = sqftNum * tier.pricePerSqft;
                return (
                  <DropdownMenuItem 
                    key={`${tier.name}-${index}`}
                    onClick={() => handleBaselineSelect(tier)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-medium">{tier.name}</span>
                        <span className="text-xs text-muted-foreground">{tier.description}</span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          ${tier.pricePerSqft}/sqft
                        </span>
                        {sqftNum > 0 && (
                          <span className="text-xs font-mono text-primary">
                            {formatCurrency(calculatedTotal)}
                          </span>
                        )}
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </CollapsibleContent>
          </Collapsible>

          {savedTemplates.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="flex items-center gap-2">
                <FolderOpen className="h-3 w-3" />
                Your Saved Budgets
              </DropdownMenuLabel>
              {savedTemplates.map((template) => {
                const total = Object.entries(template.category_budgets)
                  .filter(([k]) => k !== '_meta')
                  .reduce((sum, [, val]) => sum + ((val as number) || 0), 0);
                return (
                  <DropdownMenuItem 
                    key={template.id}
                    onClick={() => onSelectTemplate(template)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={(e) => handleSetDefault(e, template.id, template.is_default)}
                          className="shrink-0 p-0.5 hover:scale-110 transition-transform"
                          title={template.is_default ? 'Remove as default' : 'Set as default startup'}
                        >
                          {template.is_default ? (
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          ) : (
                            <Star className="h-3.5 w-3.5 text-muted-foreground hover:text-amber-400" />
                          )}
                        </button>
                        <span className="font-medium truncate">{template.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-muted-foreground">
                          {formatCurrency(total)}
                        </span>
                        <button
                          onClick={(e) => handleDeleteClick(e, template.id, template.name)}
                          className="p-0.5 hover:scale-110 transition-transform text-muted-foreground hover:text-destructive"
                          title="Delete budget"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Baseline Tiers</DialogTitle>
            <DialogDescription>
              Customize your $/sqft rates for quick budget estimates
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-[1fr,100px] gap-2 text-sm font-medium text-muted-foreground">
              <span>Name</span>
              <span>$/sqft</span>
            </div>
            
            {editingTiers.map((tier, index) => (
              <div key={index} className="grid grid-cols-[1fr,100px] gap-2">
                <Input
                  value={tier.name}
                  onChange={(e) => updateEditingTier(index, 'name', e.target.value)}
                  placeholder="Tier name"
                />
                <Input
                  type="number"
                  value={tier.pricePerSqft || ''}
                  onChange={(e) => updateEditingTier(index, 'pricePerSqft', parseFloat(e.target.value) || 0)}
                  placeholder="$/sqft"
                />
              </div>
            ))}
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="ghost" onClick={handleResetDefaults}>
              Reset to Defaults
            </Button>
            <Button onClick={handleSaveBaselines}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
