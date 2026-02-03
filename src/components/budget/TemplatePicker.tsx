import { useState, useEffect } from 'react';
import { FileText, ChevronDown, Ruler, FolderOpen, Plus, Settings } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface BudgetTemplate {
  id: string;
  name: string;
  description: string | null;
  purchase_price: number;
  arv: number;
  category_budgets: Record<string, number>;
  total_budget: number;
}

interface TemplatePickerProps {
  onSelectTemplate: (template: BudgetTemplate | null) => void;
  onCreateNew: () => void;
  currentTemplateName?: string;
  sqft: string;
  onSqftChange: (value: string) => void;
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

export function TemplatePicker({ onSelectTemplate, onCreateNew, currentTemplateName, sqft, onSqftChange }: TemplatePickerProps) {
  const [savedTemplates, setSavedTemplates] = useState<BudgetTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [baselineTiers, setBaselineTiers] = useState<BaselineTier[]>(DEFAULT_BASELINE_TIERS);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTiers, setEditingTiers] = useState<BaselineTier[]>([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('budget_templates')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setSavedTemplates((data as BudgetTemplate[]) || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

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
    
    const template: BudgetTemplate = {
      id: `baseline-${tier.name.toLowerCase().replace(' ', '-')}`,
      name: `${tier.name} (${sqftNum.toLocaleString()} sqft)`,
      description: tier.description,
      purchase_price: 0,
      arv: 0,
      total_budget: totalBudget,
      category_budgets: {},
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
          
          <DropdownMenuLabel className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ruler className="h-3 w-3" />
              Baselines
            </div>
            <button
              onClick={handleOpenEdit}
              className="p-1 hover:bg-accent rounded-sm transition-colors"
            >
              <Settings className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </DropdownMenuLabel>
          
          
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

          {savedTemplates.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="flex items-center gap-2">
                <FolderOpen className="h-3 w-3" />
                Your Saved Budgets
              </DropdownMenuLabel>
              {savedTemplates.map((template) => {
                const total = Object.values(template.category_budgets).reduce((sum, val) => sum + (val || 0), 0);
                return (
                  <DropdownMenuItem 
                    key={template.id}
                    onClick={() => onSelectTemplate(template)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium truncate">{template.name}</span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {formatCurrency(total)}
                      </span>
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
                  value={tier.pricePerSqft}
                  onChange={(e) => updateEditingTier(index, 'pricePerSqft', parseInt(e.target.value) || 0)}
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
    </>
  );
}
