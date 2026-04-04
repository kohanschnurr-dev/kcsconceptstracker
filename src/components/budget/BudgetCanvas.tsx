import { useState, useEffect, useRef, useMemo } from 'react';
import { BudgetCategoryCard } from './BudgetCategoryCard';
import {
  ChevronRight, ChevronsUpDown, ChevronsDownUp,
  Settings, X, Plus, Eye, EyeOff, GripVertical, Minus, Star, Trash2, Pencil
} from 'lucide-react';
import { getBudgetCalcCategories, buildBudgetCalcGroups, buildCostTypeGroups, getAllGroupDefs } from '@/lib/budgetCalculatorCategories';
import { buildTimelineGroups, getCategoriesNotInPhase, TIMELINE_CUSTOM_STORAGE_KEY, PHASE_CONFIG_STORAGE_KEY, TimelineCustomization, TimelinePhaseConfig, PhaseOverride, ICON_MAP, ICON_OPTIONS, getIconByName, getEffectivePhases, TIMELINE_PHASES } from '@/lib/budgetTimelinePhases';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

/** Sortable row for drag-reorder in timeline settings */
function SortablePhaseItem({
  id,
  label,
  isHidden,
  onToggleVisibility,
  onRemove,
  isTimeline,
}: {
  id: string;
  label: string;
  isHidden: boolean;
  onToggleVisibility: () => void;
  onRemove: () => void;
  isTimeline: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors",
        isHidden
          ? "text-muted-foreground bg-muted/20"
          : "text-foreground bg-muted/10"
      )}
    >
      {isTimeline && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground hover:text-foreground touch-none"
          tabIndex={-1}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}
      <span className={cn("flex-1", isHidden && "line-through opacity-50")}>
        {label}
      </span>
      <button
        onClick={onToggleVisibility}
        className="p-1 rounded hover:bg-muted/30 transition-colors"
      >
        {isHidden ? (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Eye className="h-4 w-4 text-primary" />
        )}
      </button>
      {isTimeline && (
        <button
          onClick={onRemove}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Remove from this phase"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function BudgetCanvas({ categoryBudgets, onCategoryChange, sqft, baselineActive, expandAll, onExpandHandled, autoRevealCategory, onRevealHandled }: BudgetCanvasProps) {
  const { user } = useAuth();
  const [favoriteMode, setFavoriteMode] = useState<'category' | 'timeline'>(() => {
    try {
      const saved = localStorage.getItem('budget-view-mode-favorite');
      if (saved === 'timeline') return 'timeline';
    } catch {}
    return 'category';
  });
  const [viewMode, setViewMode] = useState<'category' | 'timeline'>(() => {
    try {
      const saved = localStorage.getItem('budget-view-mode-favorite');
      if (saved === 'timeline') return 'timeline';
    } catch {}
    return 'category';
  });
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

  // Timeline customization state
  const [timelineCustom, setTimelineCustom] = useState<TimelineCustomization>(() => {
    try {
      const raw = localStorage.getItem(TIMELINE_CUSTOM_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  });

  // Phase config state (renames, deletions, additions)
  const [phaseConfig, setPhaseConfig] = useState<TimelinePhaseConfig>(() => {
    try {
      const raw = localStorage.getItem(PHASE_CONFIG_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { overrides: [], deleted: [] };
  });

  // Group settings dialog state
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [groupHiddenDraft, setGroupHiddenDraft] = useState<Set<string>>(new Set());
  const [groupEditingPresets, setGroupEditingPresets] = useState<CategoryPreset[]>([]);
  const [groupNewCategoryValue, setGroupNewCategoryValue] = useState<string>('');

  // Timeline settings drafts
  const [phaseCategoriesDraft, setPhaseCategoriesDraft] = useState<string[]>([]);
  const [addItemValue, setAddItemValue] = useState<string>('');
  const [phaseRenameDraft, setPhaseRenameDraft] = useState<string>('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Add Phase dialog state
  const [isAddPhaseOpen, setIsAddPhaseOpen] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseIcon, setNewPhaseIcon] = useState('Package');

  const allCategories = useMemo(() => getBudgetCalcCategories(), []);
  const dynamicGroups = useMemo(() => buildBudgetCalcGroups(allCategories), [allCategories]);
  const timelineGroups = useMemo(
    () => buildTimelineGroups(
      allCategories,
      Object.keys(timelineCustom).length > 0 ? timelineCustom : undefined,
      phaseConfig
    ),
    [allCategories, timelineCustom, phaseConfig]
  );
  const displayGroups = viewMode === 'timeline' ? timelineGroups : dynamicGroups;
  const allGroupNames = displayGroups.map(g => g.name);
  const allExpanded = allGroupNames.every(name => openGroups.includes(name));
  const presetCategories = new Set(presets.map(p => p.category));

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleViewModeChange = (mode: 'category' | 'timeline') => {
    setViewMode(mode);
    localStorage.setItem('budget-view-mode', mode);
  };

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
    const parentGroup = dynamicGroups.find(g => g.categories.includes(autoRevealCategory));
    if (parentGroup) {
      setOpenGroups(prev => prev.includes(parentGroup.name) ? prev : [...prev, parentGroup.name]);
    }
    setHiddenCategories(prev => {
      if (!prev.has(autoRevealCategory)) return prev;
      const next = new Set(prev);
      next.delete(autoRevealCategory);
      localStorage.setItem(HIDDEN_CATEGORIES_STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
    onRevealHandled?.();
  }, [autoRevealCategory]);

  // Load presets from database on mount
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
          const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const normalized = parsed.map((p: any) => ({ ...p, mode: p.mode || 'psf' }));
                setPresets(normalized);
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

    if (sqftNum > 0 && sqft !== prevSqftRef.current) {
      presets.forEach(preset => {
        const calculated = preset.mode === 'flat'
          ? preset.pricePerSqft
          : sqftNum * preset.pricePerSqft;
        onCategoryChange(preset.category, Math.round(calculated).toString());
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
    if (editingPresets.some(p => p.category === newCategoryValue)) {
      toast.error('Category already in presets');
      return;
    }
    const catInfo = allCategories.find(c => c.value === newCategoryValue);
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
    setAddItemValue('');

    // Initialize phase categories draft from current display
    const group = displayGroups.find(g => g.key === groupKey);
    setPhaseCategoriesDraft(group?.categories ? [...group.categories] : []);
    setPhaseRenameDraft(group?.name || '');

    setIsGroupSettingsOpen(true);
  };

  const handleDeletePhase = () => {
    if (!activeGroupKey) return;
    const newConfig: TimelinePhaseConfig = {
      overrides: (phaseConfig.overrides || []).filter(o => o.key !== activeGroupKey),
      deleted: [...(phaseConfig.deleted || []), activeGroupKey],
    };
    setPhaseConfig(newConfig);
    localStorage.setItem(PHASE_CONFIG_STORAGE_KEY, JSON.stringify(newConfig));

    // Remove custom category mapping for this phase
    const newCustom = { ...timelineCustom };
    delete newCustom[activeGroupKey];
    setTimelineCustom(newCustom);
    localStorage.setItem(TIMELINE_CUSTOM_STORAGE_KEY, JSON.stringify(newCustom));

    setIsGroupSettingsOpen(false);
    setDeleteConfirmOpen(false);
    toast.success('Phase deleted');
  };

  const handleAddPhase = () => {
    if (!newPhaseName.trim()) return;
    const key = `phase_custom_${Date.now()}`;
    const override: PhaseOverride = {
      key,
      label: newPhaseName.trim(),
      iconName: newPhaseIcon,
    };
    const newConfig: TimelinePhaseConfig = {
      overrides: [...(phaseConfig.overrides || []), override],
      deleted: phaseConfig.deleted || [],
    };
    setPhaseConfig(newConfig);
    localStorage.setItem(PHASE_CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
    setIsAddPhaseOpen(false);
    setNewPhaseName('');
    setNewPhaseIcon('Package');
    toast.success('Phase added');
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
    const catInfo = allCategories.find(c => c.value === groupNewCategoryValue);
    if (!catInfo) return;
    setGroupEditingPresets(prev => [...prev, {
      category: groupNewCategoryValue,
      label: catInfo.label,
      pricePerSqft: 5.00,
      mode: 'psf' as const,
    }]);
    setGroupNewCategoryValue('');
  };

  // --- Timeline phase customization ---
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPhaseCategoriesDraft(prev => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleAddItemToPhase = () => {
    if (!addItemValue || !activeGroupKey) return;
    setPhaseCategoriesDraft(prev => [...prev, addItemValue]);
    setAddItemValue('');
  };

  const handleRemoveFromPhase = (category: string) => {
    setPhaseCategoriesDraft(prev => prev.filter(c => c !== category));
  };

  // Compute available items for "Add item" dropdown (items not in current phase draft)
  const availableItemsForPhase = useMemo(() => {
    if (!activeGroupKey || viewMode !== 'timeline') return [];
    const inPhase = new Set(phaseCategoriesDraft);
    return allCategories
      .filter(c => !inPhase.has(c.value))
      .map(c => ({ value: c.value, label: c.label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [activeGroupKey, phaseCategoriesDraft, allCategories, viewMode]);

  const handleSaveGroupSettings = async () => {
    setHiddenCategories(groupHiddenDraft);
    localStorage.setItem(HIDDEN_CATEGORIES_STORAGE_KEY, JSON.stringify([...groupHiddenDraft]));
    setPresets(groupEditingPresets);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(groupEditingPresets));

    // Save timeline customization if in timeline mode
    if (viewMode === 'timeline' && activeGroupKey) {
      const newCustom = { ...timelineCustom };

      // Save this phase's custom category order
      newCustom[activeGroupKey] = [...phaseCategoriesDraft];

      // Clean up: remove items from ALL phases (including defaults without custom overrides)
      const movedHere = new Set(phaseCategoriesDraft);
      for (const group of timelineGroups) {
        if (group.key === activeGroupKey) continue;
        const existing = newCustom[group.key] || group.categories;
        if (existing.some(c => movedHere.has(c))) {
          newCustom[group.key] = existing.filter(c => !movedHere.has(c));
          if (newCustom[group.key].length === 0) delete newCustom[group.key];
        }
      }

      setTimelineCustom(newCustom);
      localStorage.setItem(TIMELINE_CUSTOM_STORAGE_KEY, JSON.stringify(newCustom));

      // Save phase rename if changed
      if (phaseRenameDraft && phaseRenameDraft !== activeGroup?.name) {
        const existingOverrides = (phaseConfig.overrides || []).filter(o => o.key !== activeGroupKey);
        // Find current icon name
        const currentOverride = (phaseConfig.overrides || []).find(o => o.key === activeGroupKey);
        const defaultPhase = TIMELINE_PHASES.find(p => p.key === activeGroupKey);
        const iconName = currentOverride?.iconName ||
          Object.entries(ICON_MAP).find(([, icon]) => icon === defaultPhase?.icon)?.[0] || 'Package';

        const newConfig: TimelinePhaseConfig = {
          overrides: [...existingOverrides, { key: activeGroupKey, label: phaseRenameDraft, iconName }],
          deleted: phaseConfig.deleted || [],
        };
        setPhaseConfig(newConfig);
        localStorage.setItem(PHASE_CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
      }
    }

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
    const cat = allCategories.find(c => c.value === categoryValue);
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
  const availableCategories = allCategories.filter(
    cat => !editingPresets.some(p => p.category === cat.value)
  ).sort((a, b) => a.label.localeCompare(b.label));

  // Active group data for group settings dialog
  const activeGroup = displayGroups.find(g => g.key === activeGroupKey);
  const activeGroupCategories = viewMode === 'timeline' ? phaseCategoriesDraft : (activeGroup?.categories || []);
  const activeGroupName = activeGroup?.name || '';
  const groupPresetsForActive = groupEditingPresets.filter(p => activeGroupCategories.includes(p.category));
  const groupAvailableForPreset = activeGroupCategories
    .filter(cat => !groupEditingPresets.some(p => p.category === cat))
    .map(cat => ({ value: cat, label: getCategoryLabel(cat) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const isTimelineSettings = viewMode === 'timeline';

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-4">
        <div className="flex items-center gap-3">
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

          {/* View mode toggle */}
          <div className="flex items-center rounded-md border border-border/50 overflow-hidden">
            <button
              onClick={() => handleViewModeChange('category')}
              className={cn(
                "px-3 py-1 text-xs font-medium transition-colors",
                viewMode === 'category'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              Category
            </button>
            <button
              onClick={() => handleViewModeChange('timeline')}
              className={cn(
                "px-3 py-1 text-xs font-medium transition-colors",
                viewMode === 'timeline'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
             Timeline
            </button>
            <div className="w-px bg-border" />
            <button
              onClick={() => {
                setFavoriteMode(viewMode);
                localStorage.setItem('budget-view-mode-favorite', viewMode);
                toast.success(`${viewMode === 'timeline' ? 'Timeline' : 'Category'} set as default view`);
              }}
              title="Set as default view"
              className="px-2 py-1 transition-colors hover:bg-accent/50"
            >
              <Star
                size={14}
                className={cn(
                  "transition-colors",
                  viewMode === favoriteMode
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground"
                )}
              />
            </button>
          </div>

          {/* Add Phase button (timeline only) */}
          {viewMode === 'timeline' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setIsAddPhaseOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Phase
            </Button>
          )}
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
            <div className="grid grid-cols-[1fr,80px,100px,40px] gap-2 text-sm font-medium text-muted-foreground">
              <span>Category</span>
              <span>Mode</span>
              <span>Amount</span>
              <span></span>
            </div>

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
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{isTimelineSettings ? phaseRenameDraft || activeGroupName : activeGroupName} Settings</DialogTitle>
            <DialogDescription>
              {isTimelineSettings
                ? `Reorder, add, or remove items in this phase. Toggle visibility and configure presets.`
                : `Toggle visibility of line items and configure $/sqft presets for ${activeGroupName}.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-2 -mx-6 px-6">
            {/* Phase rename (timeline only) */}
            {isTimelineSettings && activeGroupKey !== 'phase_other' && (
              <div>
                <p className="text-sm font-semibold mb-2">Phase Name</p>
                <Input
                  value={phaseRenameDraft}
                  onChange={(e) => setPhaseRenameDraft(e.target.value)}
                  placeholder="Phase name..."
                  className="h-9"
                />
              </div>
            )}

            {/* Section 1: Presets for this group */}
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

            {/* Section 2: Items in this phase (with drag reorder in timeline mode) */}
            <div>
              <p className="text-sm font-semibold mb-3">
                {isTimelineSettings ? 'Items in this phase' : 'Show / Hide Items'}
              </p>
              {isTimelineSettings ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={phaseCategoriesDraft} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                      {phaseCategoriesDraft.map(cat => (
                        <SortablePhaseItem
                          key={cat}
                          id={cat}
                          label={getCategoryLabel(cat)}
                          isHidden={groupHiddenDraft.has(cat)}
                          onToggleVisibility={() => toggleCategoryVisibility(cat)}
                          onRemove={() => handleRemoveFromPhase(cat)}
                          isTimeline={true}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
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
              )}

              {/* Add item from another phase (timeline only) */}
              {isTimelineSettings && availableItemsForPhase.length > 0 && (
                <div className="pt-3 border-t border-border/30 mt-3">
                  <p className="text-xs text-muted-foreground mb-2">Add item from another phase</p>
                  <div className="flex gap-2">
                    <Select value={addItemValue} onValueChange={setAddItemValue}>
                      <SelectTrigger className="flex-1 h-9">
                        <SelectValue placeholder="Select item..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {availableItemsForPhase.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddItemToPhase}
                      disabled={!addItemValue}
                      className="h-9"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {phaseCategoriesDraft.length === 0 && isTimelineSettings && (
                <p className="text-sm text-muted-foreground italic mt-2">
                  No items in this phase. Add items from the dropdown above.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-border bg-background pt-4 -mx-6 px-6 -mb-6 pb-6 sticky bottom-0">
            <div className="flex w-full justify-between">
              {isTimelineSettings && activeGroupKey !== 'phase_other' ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Phase
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setIsGroupSettingsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveGroupSettings}>
                  Save
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Phase Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Phase</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this phase? All items will be moved to "Other".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePhase}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Phase Dialog */}
      <Dialog open={isAddPhaseOpen} onOpenChange={setIsAddPhaseOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Phase</DialogTitle>
            <DialogDescription>
              Create a custom phase for your timeline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Phase Name</label>
              <Input
                value={newPhaseName}
                onChange={(e) => setNewPhaseName(e.target.value)}
                placeholder="e.g. Phase 10 — Final Systems"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Icon</label>
              <Select value={newPhaseIcon} onValueChange={setNewPhaseIcon}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map(name => {
                    const IconComp = getIconByName(name);
                    return (
                      <SelectItem key={name} value={name}>
                        <span className="flex items-center gap-2">
                          <IconComp className="h-4 w-4" />
                          {name}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddPhaseOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPhase} disabled={!newPhaseName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Add Phase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div key={viewMode} className="grid grid-cols-1 md:grid-cols-2 gap-2 animate-in fade-in-0 duration-200">
        {displayGroups.map((group) => {
          const GroupIcon = group.icon;
          const groupCategories = group.categories;
          const visibleCategories = groupCategories.filter(cat => !hiddenCategories.has(cat));
          const groupTotal = getGroupTotal(visibleCategories);
          const isOpen = openGroups.includes(group.name);
          const hasValue = groupTotal > 0;
          const hiddenCount = groupCategories.length - visibleCategories.length;

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
