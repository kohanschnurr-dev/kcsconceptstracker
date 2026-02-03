import { useState, useEffect } from 'react';
import { BudgetCategoryCard } from './BudgetCategoryCard';
import { BUDGET_CATEGORIES } from '@/types';
import { 
  Zap, Droplets, PaintBucket, 
  Home, Trees, Package,
  ChevronRight, ChevronsUpDown, ChevronsDownUp,
  Ruler, Settings
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface CategoryPreset {
  category: string;
  label: string;
  pricePerSqft: number;
}

const DEFAULT_CATEGORY_PRESETS: CategoryPreset[] = [
  { category: 'painting', label: 'Painting', pricePerSqft: 3.50 },
  { category: 'flooring', label: 'Flooring', pricePerSqft: 8.00 },
  { category: 'tile', label: 'Tile', pricePerSqft: 12.00 },
  { category: 'drywall', label: 'Drywall', pricePerSqft: 2.50 },
  { category: 'roofing', label: 'Roofing', pricePerSqft: 5.00 },
];

const PRESETS_STORAGE_KEY = 'budget-category-presets';

interface BudgetCanvasProps {
  categoryBudgets: Record<string, string>;
  onCategoryChange: (category: string, value: string) => void;
  sqft: string;
}

// Category groups for organized display
const CATEGORY_GROUPS = [
  {
    name: 'Structure',
    icon: Home,
    categories: ['demolition', 'framing', 'foundation_repair', 'roofing', 'drywall', 'insulation'],
  },
  {
    name: 'MEPs',
    icon: Zap,
    categories: ['electrical', 'plumbing', 'hvac', 'natural_gas', 'water_heater'],
  },
  {
    name: 'Finishes',
    icon: PaintBucket,
    categories: ['painting', 'flooring', 'tile', 'doors', 'windows', 'hardware', 'light_fixtures'],
  },
  {
    name: 'Kitchen & Bath',
    icon: Droplets,
    categories: ['kitchen', 'bathroom', 'main_bathroom', 'cabinets', 'countertops', 'appliances'],
  },
  {
    name: 'Exterior',
    icon: Trees,
    categories: ['landscaping', 'fencing', 'driveway_concrete', 'garage', 'pool', 'brick_siding_stucco', 'railing'],
  },
  {
    name: 'Other',
    icon: Package,
    categories: ['permits_inspections', 'dumpsters_trash', 'cleaning', 'final_punch', 'staging', 'carpentry', 'pest_control', 'drain_line_repair', 'misc'],
  },
];


export function BudgetCanvas({ categoryBudgets, onCategoryChange, sqft }: BudgetCanvasProps) {
  const [openGroups, setOpenGroups] = useState<string[]>(['Structure']);
  const [presets, setPresets] = useState<CategoryPreset[]>(DEFAULT_CATEGORY_PRESETS);
  const [editingPresets, setEditingPresets] = useState<CategoryPreset[]>([]);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const allGroupNames = CATEGORY_GROUPS.map(g => g.name);
  const allExpanded = allGroupNames.every(name => openGroups.includes(name));

  // Load presets from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setPresets(parsed);
        }
      } catch (e) {
        console.error('Failed to parse stored presets:', e);
      }
    }
  }, []);

  const toggleAll = () => {
    if (allExpanded) {
      setOpenGroups([]);
    } else {
      setOpenGroups(allGroupNames);
    }
  };

  const handleApplyPreset = (preset: CategoryPreset) => {
    const sqftNum = parseFloat(sqft) || 0;
    if (sqftNum <= 0) {
      toast.error('Please enter square footage first');
      return;
    }
    const calculated = sqftNum * preset.pricePerSqft;
    onCategoryChange(preset.category, calculated.toFixed(2));
    toast.success(`Applied $${calculated.toLocaleString()} to ${preset.label}`);
  };

  const handleApplyAll = () => {
    const sqftNum = parseFloat(sqft) || 0;
    if (sqftNum <= 0) {
      toast.error('Please enter square footage first');
      return;
    }
    presets.forEach(preset => {
      const calculated = sqftNum * preset.pricePerSqft;
      onCategoryChange(preset.category, calculated.toFixed(2));
    });
    setIsPresetsOpen(false);
    toast.success('Applied all presets');
  };

  const handleOpenEditDialog = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingPresets([...presets]);
    setIsEditDialogOpen(true);
  };

  const handleSavePresets = () => {
    setPresets(editingPresets);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(editingPresets));
    setIsEditDialogOpen(false);
    toast.success('Presets saved');
  };

  const handleResetDefaults = () => {
    setEditingPresets([...DEFAULT_CATEGORY_PRESETS]);
  };

  const updatePresetRate = (index: number, value: number) => {
    setEditingPresets(prev => prev.map((p, i) => 
      i === index ? { ...p, pricePerSqft: value } : p
    ));
  };

  const getCategoryLabel = (categoryValue: string) => {
    const cat = BUDGET_CATEGORIES.find(c => c.value === categoryValue);
    return cat?.label || categoryValue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getGroupTotal = (categories: string[]) => {
    return categories.reduce((sum, cat) => {
      return sum + (parseFloat(categoryBudgets[cat]) || 0);
    }, 0);
  };

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };

  const sqftNum = parseFloat(sqft) || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAll}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {allExpanded ? (
              <>
                <ChevronsDownUp className="h-3.5 w-3.5" />
                Collapse All
              </>
            ) : (
              <>
                <ChevronsUpDown className="h-3.5 w-3.5" />
                Expand All
              </>
            )}
          </button>

          <Popover open={isPresetsOpen} onOpenChange={setIsPresetsOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-4">
                <Ruler className="h-3.5 w-3.5" />
                Presets
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Category Presets</h4>
                  <button
                    onClick={handleOpenEditDialog}
                    className="p-1 hover:bg-accent rounded-sm transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Calculate category budgets from $/sqft rates
                </p>
                
                <div className="space-y-2">
                  {presets.map((preset) => {
                    const calculated = sqftNum * preset.pricePerSqft;
                    return (
                      <div key={preset.category} className="flex items-center justify-between gap-2">
                        <span className="text-sm flex-1">{preset.label}</span>
                        <span className="text-xs text-muted-foreground w-16">
                          ${preset.pricePerSqft}/sqft
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApplyPreset(preset)}
                          disabled={sqftNum <= 0}
                          className="h-6 text-xs"
                        >
                          {sqftNum > 0 ? `$${calculated.toLocaleString()}` : 'Apply'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex justify-end pt-2 border-t">
                  <Button
                    size="sm"
                    onClick={handleApplyAll}
                    disabled={sqftNum <= 0}
                  >
                    Apply All
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Edit Presets Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category Presets</DialogTitle>
            <DialogDescription>
              Customize your $/sqft rates for quick budget calculations
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-[1fr,100px] gap-2 text-sm font-medium text-muted-foreground">
              <span>Category</span>
              <span>$/sqft</span>
            </div>
            
            {editingPresets.map((preset, index) => (
              <div key={preset.category} className="grid grid-cols-[1fr,100px] gap-2">
                <span className="text-sm flex items-center">{preset.label}</span>
                <Input
                  type="number"
                  step="0.01"
                  value={preset.pricePerSqft}
                  onChange={(e) => updatePresetRate(index, parseFloat(e.target.value) || 0)}
                  placeholder="$/sqft"
                  className="h-8"
                />
              </div>
            ))}
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="ghost" onClick={handleResetDefaults}>
              Reset to Defaults
            </Button>
            <Button onClick={handleSavePresets}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {CATEGORY_GROUPS.map((group) => {
          const GroupIcon = group.icon;
          const groupCategories = group.categories.filter(cat => 
            BUDGET_CATEGORIES.some(bc => bc.value === cat)
          );
          const groupTotal = getGroupTotal(groupCategories);
          const isOpen = openGroups.includes(group.name);
          const hasValue = groupTotal > 0;

          if (groupCategories.length === 0) return null;

          return (
            <Collapsible 
              key={group.name} 
              open={isOpen}
              onOpenChange={() => toggleGroup(group.name)}
              className={cn(
                "rounded-lg border bg-card transition-colors",
                hasValue && "border-primary/30"
              )}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-accent/50 transition-colors rounded-t-lg">
                <div className="flex items-center gap-2">
                  <ChevronRight className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-90"
                  )} />
                  <GroupIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{group.name}</span>
                </div>
                <span className={cn(
                  "text-sm font-mono",
                  hasValue ? "text-primary font-semibold" : "text-muted-foreground"
                )}>
                  {formatCurrency(groupTotal)}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-2 pt-0 grid grid-cols-2 lg:grid-cols-3 gap-1.5">
                  {groupCategories.map((category) => (
                    <BudgetCategoryCard
                      key={category}
                      category={category}
                      label={getCategoryLabel(category)}
                      value={categoryBudgets[category] || ''}
                      onChange={(value) => onCategoryChange(category, value)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
