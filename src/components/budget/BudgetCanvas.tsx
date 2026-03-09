import { useState, useEffect, useRef, useMemo } from 'react';
import { BudgetCategoryCard } from './BudgetCategoryCard';
import {
  ChevronRight, ChevronsUpDown, ChevronsDownUp,
  Settings, X, Plus, Eye, EyeOff
} from 'lucide-react';
import { getBudgetCalcCategories, buildBudgetCalcGroups, getAllGroupDefs } from '@/lib/budgetCalculatorCategories';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

import { CategoryPreset, DEFAULT_CATEGORY_PRESETS, PRESETS_STORAGE_KEY } from '@/lib/budgetPresets';

const HIDDEN_CATEGORIES_STORAGE_KEY = 'budget-hidden-categories';

interface BudgetCanvasProps {
  categoryBudgets: Record<string, string>;
  onCategoryChange: (category: string, value: string) => void;
  sqft: string;
  baselineActive?: boolean;
  expandAll?: boolean;
  onExpandHandled?: () => void;
  autoRevealCategory?: string | null;
  onRevealHandled?: () => void;
}



export function BudgetCanvas({ categoryBudgets, onCategoryChange, sqft, baselineActive, expandAll, onExpandHandled, autoRevealCategory, onRevealHandled }: BudgetCanvasProps) {
  const { user } = useAuth();
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [presets, setPresets] = useState<CategoryPreset[]>(DEFAULT_CATEGORY_PRESETS);
  const [editingPresets, setEditingPresets] = useState<CategoryPreset[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newCategoryValue, setNewCategoryValue] = useState<string>('');
  const prevSqftRef = useRef<string>(sqft);
  const dbLoadedRef = useRef(false);

  // Per-group settings: hidden categories
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(HIDDEN_CATEGORIES_STORAGE_KEY);
      if (raw) return new Set<string>(JSON.parse(raw));
    } catch {}
    return new Set<string>();
  });

  // Group settings dialog state
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [groupHiddenDraft, setGroupHiddenDraft] = useState<Set<string>>(new Set());
  const [groupEditingPresets, setGroupEditingPresets] = useState<CategoryPreset[]>([]);
  const [groupNewCategoryValue, setGroupNewCategoryValue] = useState<string>('');

  const dynamicGroups = useMemo(() => buildBudgetCalcGroups(getBudgetCalcCategories()), [getBudgetCalcCategories]);
  const allGroupNames = dynamicGroups.map(g => g.name);
  const allExpanded = allGroupNames.every(name => openGroups.includes(name));
  const presetCategories = new Set(presets.map(p => p.category));

  // Auto-expand all groups when expandAll is triggered
  useEffect(() => {
    if (expandAll) {
      setOpenGroups(allGroupNames);
      onExpandHandled?.();
    }
  }, [expandAll]);

  // Auto-reveal a specific category (unhide it and expand its parent group)
  useEffect(() => {
    if (!autoRevealCategory) return;
    // Find the group containing this category
    const parentGroup = dynamicGroups.find(g => g.categories.includes(autoRevealCategory));
    if (parentGroup) {
      setOpenGroups(prev => prev.includes(parentGroup.name) ? prev : [...prev, parentGroup.name]);
    }
    // Unhide the category
    setHiddenCategories(prev => {
      if (!prev.has(autoRevealCategory)) return prev;
      const next = new Set(prev);
      next.delete(autoRevealCategory);
      localStorage.setItem(HIDDEN_CATEGORIES_STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
    onRevealHandled?.();
  }, [autoRevealCategory]);

  // Load presets from database on mount, fall back to localStorage for migration
  useEffect(() => {
    if (!user || dbLoadedRef.current) return;

    const loadPresets = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('budget_presets')
          .eq('user_id', user.id)
          .maybeSingle();

        const dbPresets = data?.budget_presets as unknown as CategoryPreset[] | null;

        if (dbPresets && Array.isArray(dbPresets) && dbPresets.length > 0) {
          const normalized = dbPresets.map((p: any) => ({ ...p, mode: p.mode || 'psf' }));
          setPresets(normalized);
          localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(normalized));
        } else {
          // Migration: check localStorage for existing presets
          const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const normalized = parsed.map((p: any) => ({ ...p, mode: p.mode || 'psf' }));
                setPresets(normalized);
                // Migrate to database
                await supabase
                  .from('profiles')
                  .update({ budget_presets: normalized } as any)
                  .eq('user_id', user.id);
              }
            } catch (e) {
              console.error('Failed to parse stored presets:', e);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load presets from database:', e);
      }
      dbLoadedRef.current = true;
    };

    loadPresets();
  }, [user]);

  // Auto-calculate presets when sqft changes
  useEffect(() => {
    const sqftNum = parseFloat(sqft) || 0;
    const prevSqftNum = parseFloat(prevSqftRef.current) || 0;

    // Only auto-calculate if sqft actually changed, is > 0, and no baseline is active
    if (sqftNum > 0 && sqft !== prevSqftRef.current) {
      presets.forEach(preset => {
        const calculated = preset.mode === 'flat'
          ? preset.pricePerSqft
          : sqftNum * preset.pricePerSqft;
        onCategoryChange(preset.category, calculated.toFixed(2));
      });
    }

    prevSqftRef.current = sqft;
  }, [sqft, presets, onCategoryChange]);

  const toggleAll = () => {
    if (allExpanded) {
      setOpenGroups([]);
    } else {
      setOpenGroups(allGroupNames);
    }
  };

  // --- Global presets dialog ---
  const handleOpenEditDialog = () => {
    setEditingPresets([...presets]);
    setNewCategoryValue('');
    setIsEditDialogOpen(true);
  };

  const handleSavePresets = async () => {
    setPresets(editingPresets);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(editingPresets));
    setIsEditDialogOpen(false);

    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ budget_presets: editingPresets as any } as any)
          .eq('user_id', user.id);
        toast.success('Presets saved');
      } catch (e) {
        console.error('Failed to save presets to database:', e);
        toast.error('Presets saved locally but failed to sync');
      }
    } else {
      toast.success('Presets saved');
    }
  };

  const handleResetDefaults = () => {
    setEditingPresets([...DEFAULT_CATEGORY_PRESETS]);
  };

  const updatePresetRate = (index: number, value: number) => {
    setEditingPresets(prev => prev.map((p, i) =>
      i === index ? { ...p, pricePerSqft: value } : p
    ));
  };

  const updatePresetMode = (index: number, mode: 'psf' | 'flat') => {
    setEditingPresets(prev => prev.map((p, i) =>
      i === index ? { ...p, mode } : p
    ));
  };

  const removePreset = (index: number) => {
    setEditingPresets(prev => prev.filter((_, i) => i !== index));
  };

  const addPreset = () => {
    if (!newCategoryValue) return;

    // Check if already exists
    if (editingPresets.some(p => p.category === newCategoryValue)) {
      toast.error('Category already in presets');
      return;
    }

    const catInfo = getBudgetCalcCategories().find(c => c.value === newCategoryValue);
    if (!catInfo) return;

    setEditingPresets(prev => [...prev, {
      category: newCategoryValue,
      label: catInfo.label,
      pricePerSqft: 5.00,
      mode: 'psf' as const,
    }]);
    setNewCategoryValue('');
  };

  // --- Group settings dialog ---
  const openGroupSettings = (groupKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveGroupKey(groupKey);
    setGroupHiddenDraft(new Set(hiddenCategories));
    setGroupEditingPresets([...presets]);
    setGroupNewCategoryValue('');
    setIsGroupSettingsOpen(true);
  };

  const toggleCategoryVisibility = (category: string) => {
    setGroupHiddenDraft(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const updateGroupPresetRate = (index: number, value: number) => {
    setGroupEditingPresets(prev => prev.map((p, i) =>
      i === index ? { ...p, pricePerSqft: value } : p
    ));
  };

  const updateGroupPresetMode = (index: number, mode: 'psf' | 'flat') => {
    setGroupEditingPresets(prev => prev.map((p, i) =>
      i === index ? { ...p, mode } : p
    ));
  };

  const removeGroupPreset = (category: string) => {
    setGroupEditingPresets(prev => prev.filter(p => p.category !== category));
  };

  const addGroupPreset = () => {
    if (!groupNewCategoryValue) return;
    if (groupEditingPresets.some(p => p.category === groupNewCategoryValue)) {
      toast.error('Category already in presets');
      return;
    }
    const catInfo = getBudgetCalcCategories().find(c => c.value === groupNewCategoryValue);
    if (!catInfo) return;
    setGroupEditingPresets(prev => [...prev, {
      category: groupNewCategoryValue,
      label: catInfo.label,
      pricePerSqft: 5.00,
      mode: 'psf' as const,
    }]);
    setGroupNewCategoryValue('');
  };

  const handleSaveGroupSettings = async () => {
    setHiddenCategories(groupHiddenDraft);
    localStorage.setItem(HIDDEN_CATEGORIES_STORAGE_KEY, JSON.stringify([...groupHiddenDraft]));
    setPresets(groupEditingPresets);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(groupEditingPresets));
    setIsGroupSettingsOpen(false);

    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ budget_presets: groupEditingPresets as any } as any)
          .eq('user_id', user.id);
        toast.success('Group settings saved');
      } catch (e) {
        console.error('Failed to save group settings:', e);
        toast.error('Settings saved locally but failed to sync');
      }
    } else {
      toast.success('Group settings saved');
    }
  };

  const getCategoryLabel = (categoryValue: string) => {
    const cat = getBudgetCalcCategories().find(c => c.value === categoryValue);
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

  // Categories available to add (not already in presets)
  const availableCategories = getBudgetCalcCategories().filter(
    cat => !editingPresets.some(p => p.category === cat.value)
  ).sort((a, b) => a.label.localeCompare(b.label));

  // Active group data for group settings dialog
  const activeGroup = dynamicGroups.find(g => g.key === activeGroupKey);
  const activeGroupCategories = activeGroup?.categories || [];
  const activeGroupName = activeGroup?.name || '';
  const groupPresetsForActive = groupEditingPresets.filter(p => activeGroupCategories.includes(p.category));
  const groupAvailableForPreset = activeGroupCategories
    .filter(cat => !groupEditingPresets.some(p => p.category === cat))
    .map(cat => ({ value: cat, label: getCategoryLabel(cat) }))
    .sort((a, b) => a.label.localeCompare(b.label));

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
        </div>
      </div>

      {/* Global Edit Presets Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Category Presets</DialogTitle>
            <DialogDescription>
              Customize your $/sqft rates for quick budget calculations. Add or remove categories as needed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr,80px,100px,40px] gap-2 text-sm font-medium text-muted-foreground">
              <span>Category</span>
              <span>Mode</span>
              <span>Amount</span>
              <span></span>
            </div>

            {/* Preset rows */}
            {editingPresets.map((preset, index) => (
              <div key={preset.category} className="grid grid-cols-[1fr,80px,100px,40px] gap-2 items-center">
                <span className="text-sm">{preset.label}</span>
                <Select value={preset.mode} onValueChange={(v) => updatePresetMode(index, v as 'psf' | 'flat')}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="psf">$/sqft</SelectItem>
                    <SelectItem value="flat">Flat $</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  value={preset.pricePerSqft || ''}
                  onChange={(e) => updatePresetRate(index, parseFloat(e.target.value) || 0)}
                  placeholder={preset.mode === 'flat' ? '$' : '$/sqft'}
                  className="h-8"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removePreset(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {editingPresets.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No presets configured. Add categories below.
              </p>
            )}

            {/* Add new category */}
            <div className="pt-2 border-t border-border/30">
              <p className="text-sm font-medium text-muted-foreground mb-2">Add Category</p>
              <div className="flex gap-2">
                <Select value={newCategoryValue} onValueChange={setNewCategoryValue}>
                  <SelectTrigger className="flex-1 h-9">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px]">
                    {availableCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPreset}
                  disabled={!newCategoryValue}
                  className="h-9"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
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

      {/* Per-Group Settings Dialog */}
      <Dialog open={isGroupSettingsOpen} onOpenChange={setIsGroupSettingsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{activeGroupName} Settings</DialogTitle>
            <DialogDescription>
              Toggle visibility of line items and configure $/sqft presets for {activeGroupName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Section 1: Visibility */}
            <div>
              <p className="text-sm font-semibold mb-3">Show / Hide Items</p>
              <div className="space-y-1">
                {activeGroupCategories.map(cat => {
                  const isHidden = groupHiddenDraft.has(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategoryVisibility(cat)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                        isHidden
                          ? "text-muted-foreground bg-muted/20 hover:bg-muted/40"
                          : "text-foreground bg-muted/10 hover:bg-muted/30"
                      )}
                    >
                      <span className={cn(isHidden && "line-through opacity-50")}>
                        {getCategoryLabel(cat)}
                      </span>
                      {isHidden ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Presets for this group */}
            <div>
              <p className="text-sm font-semibold mb-3">Presets</p>
              {groupPresetsForActive.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr,80px,100px,40px] gap-2 text-xs font-medium text-muted-foreground">
                    <span>Category</span>
                    <span>Mode</span>
                    <span>Amount</span>
                    <span></span>
                  </div>
                  {groupPresetsForActive.map((preset) => {
                    const globalIndex = groupEditingPresets.findIndex(p => p.category === preset.category);
                    return (
                      <div key={preset.category} className="grid grid-cols-[1fr,80px,100px,40px] gap-2 items-center">
                        <span className="text-sm">{preset.label}</span>
                        <Select value={preset.mode} onValueChange={(v) => updateGroupPresetMode(globalIndex, v as 'psf' | 'flat')}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="psf">$/sqft</SelectItem>
                            <SelectItem value="flat">Flat $</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step="0.01"
                          value={preset.pricePerSqft || ''}
                          onChange={(e) => updateGroupPresetRate(globalIndex, parseFloat(e.target.value) || 0)}
                          placeholder={preset.mode === 'flat' ? '$' : '$/sqft'}
                          className="h-8"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeGroupPreset(preset.category)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic mb-2">
                  No presets for this group yet.
                </p>
              )}

              {/* Add preset for a category in this group */}
              {groupAvailableForPreset.length > 0 && (
                <div className="pt-3 border-t border-border/30 mt-3">
                  <p className="text-xs text-muted-foreground mb-2">Add preset</p>
                  <div className="flex gap-2">
                    <Select value={groupNewCategoryValue} onValueChange={setGroupNewCategoryValue}>
                      <SelectTrigger className="flex-1 h-9">
                        <SelectValue placeholder="Select item..." />
                      </SelectTrigger>
                      <SelectContent>
                        {groupAvailableForPreset.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addGroupPreset}
                      disabled={!groupNewCategoryValue}
                      className="h-9"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsGroupSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGroupSettings}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {dynamicGroups.map((group) => {
          const GroupIcon = group.icon;
          const groupCategories = group.categories;
          const visibleCategories = groupCategories.filter(cat => !hiddenCategories.has(cat));
          const groupTotal = getGroupTotal(visibleCategories);
          const isOpen = openGroups.includes(group.name);
          const hasValue = groupTotal > 0;
          const hiddenCount = groupCategories.length - visibleCategories.length;

          // Empty built-in groups are already filtered out by buildBudgetCalcGroups

          return (
            <Collapsible
              key={group.name}
              open={isOpen}
              onOpenChange={() => toggleGroup(group.name)}
              className={cn(
                "rounded-lg border border-border/30 bg-card transition-colors",
                hasValue && "border-primary/40"
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
                  {hiddenCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({hiddenCount} hidden)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "text-sm font-mono",
                    hasValue ? "text-primary font-semibold" : "text-muted-foreground"
                  )}>
                    {formatCurrency(groupTotal)}
                  </span>
                  <button
                    onClick={(e) => openGroupSettings(group.key, e)}
                    className="ml-1 p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                    title={`${group.name} settings`}
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {visibleCategories.length > 0 ? (
                  <div className="p-2 pt-0 grid grid-cols-2 lg:grid-cols-3 gap-1.5">
                    {visibleCategories.map((category) => (
                      <BudgetCategoryCard
                        key={category}
                        category={category}
                        label={getCategoryLabel(category)}
                        value={categoryBudgets[category] || ''}
                        onChange={(value) => onCategoryChange(category, value)}
                        hasPreset={presetCategories.has(category)}
                      />
                    ))}
                  </div>
                ) : groupCategories.length > 0 ? (
                  <p className="px-3 pb-3 text-xs text-muted-foreground">
                    All items hidden. Click the gear icon to show them.
                  </p>
                ) : (
                  <p className="px-3 pb-3 text-xs text-muted-foreground">
                    No categories assigned yet. Go to Settings &gt; Expense Categories to assign categories to this group.
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
