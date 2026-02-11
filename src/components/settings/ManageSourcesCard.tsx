import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, RotateCcw, List, Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCustomCategories, type CategoryItem } from '@/hooks/useCustomCategories';
import { CALENDAR_CATEGORIES, CATEGORY_GROUPS, type CategoryGroup } from '@/lib/calendarCategories';
import { MONTHLY_COST_CATEGORIES } from '@/lib/monthlyCategories';
import { BUDGET_CATEGORIES, BUSINESS_EXPENSE_CATEGORIES } from '@/types';
import { DEFAULT_STORES } from '@/hooks/useCustomStores';
import { DEFAULT_PROPERTY_FIELDS } from '@/components/project/ProjectInfo';
import { BUDGET_CALC_GROUP_DEFS, CATEGORY_GROUP_MAP, resolveTradeGroup } from '@/lib/budgetCalculatorCategories';
import { supabase } from '@/integrations/supabase/client';
import { reassignBudgetCategory, reassignGenericColumn } from '@/lib/reassignCategory';
import ReassignCategoryDialog from './ReassignCategoryDialog';
import GenericReassignDialog from './GenericReassignDialog';

function CategoryBadge({
  item,
  onDelete,
  onRename,
  className,
}: {
  item: CategoryItem;
  onDelete: () => void;
  onRename?: (newLabel: string) => void;
  className?: string;
}) {
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(item.label);

  const handleStartRename = () => {
    setRenameValue(item.label);
    setRenaming(true);
  };

  const handleConfirmRename = () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === item.label) {
      setRenaming(false);
      return;
    }
    onRename?.(trimmed);
    setRenaming(false);
  };

  if (renaming) {
    return (
      <Badge variant="outline" className={`text-xs px-1 py-0.5 gap-1 ${className ?? ''}`}>
        <Input
          value={renameValue}
          onChange={e => setRenameValue(e.target.value)}
          className="h-5 text-xs w-24 px-1 py-0"
          autoFocus
          onKeyDown={e => {
            if (e.key === 'Enter') handleConfirmRename();
            if (e.key === 'Escape') setRenaming(false);
          }}
        />
        <button onClick={handleConfirmRename} className="hover:text-primary">
          <Check className="h-3 w-3" />
        </button>
        <button onClick={() => setRenaming(false)} className="hover:text-destructive">
          <X className="h-3 w-3" />
        </button>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`text-xs ${className ?? ''}`}>
      {item.label}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="ml-1.5 hover:text-foreground text-muted-foreground">
            <MoreHorizontal className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[120px]">
          {onRename && (
            <DropdownMenuItem onClick={handleStartRename}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Rename
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Badge>
  );
}

function CategorySection({
  items,
  onAdd,
  onRemove,
  onBeforeRemove,
  onRename,
  onReset,
  placeholder,
  grouped,
  tradeGrouped,
}: {
  items: CategoryItem[];
  onAdd: (label: string, group?: string) => boolean;
  onRemove: (value: string) => void;
  onBeforeRemove?: (value: string, label: string) => void;
  onRename?: (oldValue: string, newLabel: string) => void;
  onReset: () => void;
  placeholder: string;
  grouped?: boolean;
  tradeGrouped?: boolean;
}) {
  const [newLabel, setNewLabel] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('acquisition_admin');
  const [selectedTradeGroup, setSelectedTradeGroup] = useState<string>('other');

  const handleAdd = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    const group = grouped ? selectedGroup : tradeGrouped ? selectedTradeGroup : undefined;
    const success = onAdd(trimmed, group);
    if (success) {
      setNewLabel('');
      toast.success(`Added "${trimmed}"`);
    } else {
      toast.error('Item already exists');
    }
  };

  const handleReset = () => {
    onReset();
    toast.success('Reset to defaults');
  };

  const handleRemove = (value: string, label: string) => {
    if (onBeforeRemove) {
      onBeforeRemove(value, label);
    } else {
      onRemove(value);
    }
  };

  const renderBadge = (item: CategoryItem, badgeClassName?: string) => (
    <CategoryBadge
      key={item.value}
      item={item}
      onDelete={() => handleRemove(item.value, item.label)}
      onRename={onRename ? (newLabel) => onRename(item.value, newLabel) : undefined}
      className={badgeClassName}
    />
  );

  const renderItems = () => {
    if (grouped) {
      const groups = Object.entries(CATEGORY_GROUPS) as [CategoryGroup, typeof CATEGORY_GROUPS[CategoryGroup]][];
      return groups.map(([groupKey, groupInfo]) => {
        const groupItems = items.filter(i => i.group === groupKey).sort((a, b) => a.label.localeCompare(b.label));
        if (groupItems.length === 0) return null;
        return (
          <div key={groupKey} className="space-y-1.5">
            <p className={`text-xs font-medium ${groupInfo.textClass}`}>{groupInfo.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {groupItems.map(item => renderBadge(item, `${groupInfo.borderClass} ${groupInfo.textClass}`))}
            </div>
          </div>
        );
      });
    }

    if (tradeGrouped) {
      const groupOrder = Object.keys(BUDGET_CALC_GROUP_DEFS);
      return groupOrder.map(groupKey => {
        const def = BUDGET_CALC_GROUP_DEFS[groupKey];
        const groupItems = items
          .filter(i => resolveTradeGroup(i) === groupKey)
          .sort((a, b) => a.label.localeCompare(b.label));
        if (groupItems.length === 0) return null;
        return (
          <div key={groupKey} className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{def.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {groupItems.map(item => renderBadge(item))}
            </div>
          </div>
        );
      });
    }

    return (
      <div className="flex flex-wrap gap-1.5">
        {[...items].sort((a, b) => a.label.localeCompare(b.label)).map(item => renderBadge(item))}
      </div>
    );
  };

  return (
    <div className="space-y-3 px-1">
      {renderItems()}
      <div className="flex gap-2">
        {grouped && (
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(CATEGORY_GROUPS) as [CategoryGroup, typeof CATEGORY_GROUPS[CategoryGroup]][]).map(([key, info]) => (
                <SelectItem key={key} value={key}>{info.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {tradeGrouped && (
          <Select value={selectedTradeGroup} onValueChange={setSelectedTradeGroup}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BUDGET_CALC_GROUP_DEFS).map(([key, def]) => (
                <SelectItem key={key} value={key}>{def.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <Button variant="outline" size="sm" onClick={handleAdd} disabled={!newLabel.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-muted-foreground">
        <RotateCcw className="h-3 w-3 mr-1" />
        Reset to Defaults
      </Button>
    </div>
  );
}

// Convert calendar categories to CategoryItem format with group
const calendarDefaults: CategoryItem[] = CALENDAR_CATEGORIES.map(c => ({
  value: c.value,
  label: c.label,
  group: c.group,
}));

const budgetDefaults: CategoryItem[] = BUDGET_CATEGORIES.map(c => ({ value: c.value, label: c.label }));
const monthlyDefaults: CategoryItem[] = MONTHLY_COST_CATEGORIES.map(c => ({ value: c.value, label: c.label }));
const businessDefaults: CategoryItem[] = BUSINESS_EXPENSE_CATEGORIES.map(c => ({ value: c.value, label: c.label }));
const storeDefaults: CategoryItem[] = DEFAULT_STORES.map(s => ({ value: s.value, label: s.label }));
const propertyInfoDefaults: CategoryItem[] = DEFAULT_PROPERTY_FIELDS.map(f => ({ value: f.value, label: f.label }));

// Section configs for GenericReassignDialog
type SectionKey = 'business' | 'calendar' | 'monthly' | 'stores' | 'propertyInfo';

const SECTION_DB_CONFIG: Record<SectionKey, { tableName: 'business_expenses' | 'calendar_events' | 'procurement_items'; columnName: string } | null> = {
  business: { tableName: 'business_expenses', columnName: 'category' },
  calendar: { tableName: 'calendar_events', columnName: 'event_category' },
  monthly: null,
  stores: { tableName: 'procurement_items', columnName: 'source_store' },
  propertyInfo: null,
};

const SECTION_LABELS: Record<SectionKey, string> = {
  business: 'category',
  calendar: 'category',
  monthly: 'expense type',
  stores: 'store',
  propertyInfo: 'field',
};

export default function ManageSourcesCard() {
  const calendar = useCustomCategories('calendar', calendarDefaults);
  const budget = useCustomCategories('budget', budgetDefaults);
  const monthly = useCustomCategories('monthly', monthlyDefaults);
  const business = useCustomCategories('business', businessDefaults);
  const stores = useCustomCategories('stores', storeDefaults);
  const propertyInfo = useCustomCategories('propertyInfo', propertyInfoDefaults);

  // Expense Categories — existing specialized dialog
  const [pendingDelete, setPendingDelete] = useState<{ value: string; label: string } | null>(null);
  const [reassignOpen, setReassignOpen] = useState(false);

  // Generic dialog state for all other sections
  const [genericPending, setGenericPending] = useState<{ value: string; label: string } | null>(null);
  const [genericSection, setGenericSection] = useState<SectionKey | null>(null);
  const [genericOpen, setGenericOpen] = useState(false);

  const handleBeforeRemoveBudget = useCallback((value: string, label: string) => {
    setPendingDelete({ value, label });
    setReassignOpen(true);
  }, []);

  const handleReassignComplete = useCallback((value: string, newCategory?: { value: string; label: string }) => {
    if (newCategory) {
      budget.addItem(newCategory.label);
    }
    budget.removeItem(value);
    setPendingDelete(null);
  }, [budget]);

  // Rename handler for Expense Categories (tradeGrouped)
  const handleRenameBudgetCategory = useCallback(async (oldValue: string, newLabel: string) => {
    const newValue = newLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (budget.items.some(i => i.value === newValue && i.value !== oldValue)) {
      toast.error('A category with that name already exists');
      return;
    }
    try {
      // Register new enum value
      await supabase.rpc('add_budget_category', { new_value: newValue });
      // Reassign all expenses/budgets in DB
      await reassignBudgetCategory(oldValue, newValue);
      // Update localStorage
      budget.renameItem(oldValue, newLabel);
      toast.success(`Renamed to "${newLabel}"`);
    } catch (err) {
      console.error('Rename error:', err);
      toast.error('Failed to rename category');
    }
  }, [budget]);

  // Rename handler for generic sections
  const handleRenameGeneric = useCallback((section: SectionKey) => {
    return async (oldValue: string, newLabel: string) => {
      const hook = sectionHooks[section];
      const newValue = newLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      if (hook.items.some(i => i.value === newValue && i.value !== oldValue)) {
        toast.error('An item with that name already exists');
        return;
      }
      try {
        const dbConfig = SECTION_DB_CONFIG[section];
        if (dbConfig) {
          await reassignGenericColumn(dbConfig.tableName, dbConfig.columnName, oldValue, newValue);
        }
        hook.renameItem(oldValue, newLabel);
        toast.success(`Renamed to "${newLabel}"`);
      } catch (err) {
        console.error('Rename error:', err);
        toast.error('Failed to rename');
      }
    };
  }, [business, calendar, monthly, stores, propertyInfo]);

  const makeBeforeRemove = useCallback((section: SectionKey) => {
    return (value: string, label: string) => {
      setGenericPending({ value, label });
      setGenericSection(section);
      setGenericOpen(true);
    };
  }, []);

  const sectionHooks: Record<SectionKey, typeof business> = {
    business,
    calendar,
    monthly,
    stores,
    propertyInfo,
  };

  const handleGenericComplete = useCallback((value: string) => {
    if (!genericSection) return;
    sectionHooks[genericSection].removeItem(value);
    setGenericPending(null);
    setGenericSection(null);
  }, [genericSection, business, calendar, monthly, stores, propertyInfo]);

  // Handle adding budget categories with group
  const handleAddBudgetCategory = useCallback((label: string, group?: string) => {
    const success = budget.addItem(label, group);
    return success;
  }, [budget]);

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-5 w-5" />
          Manage Sources
        </CardTitle>
        <CardDescription>Customize categories, expense types, and store lists used across the app</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="business">
            <AccordionTrigger className="text-sm">Business Expense Categories ({business.items.length})</AccordionTrigger>
            <AccordionContent>
              <CategorySection
                items={business.items}
                onAdd={business.addItem}
                onRemove={business.removeItem}
                onBeforeRemove={makeBeforeRemove('business')}
                onRename={handleRenameGeneric('business')}
                onReset={business.resetToDefaults}
                placeholder="New business category"
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="calendar">
            <AccordionTrigger className="text-sm">Calendar Categories ({calendar.items.length})</AccordionTrigger>
            <AccordionContent>
              <CategorySection
                items={calendar.items}
                onAdd={calendar.addItem}
                onRemove={calendar.removeItem}
                onBeforeRemove={makeBeforeRemove('calendar')}
                onRename={handleRenameGeneric('calendar')}
                onReset={calendar.resetToDefaults}
                placeholder="New category name"
                grouped
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="budget">
            <AccordionTrigger className="text-sm">Expense Categories ({budget.items.length})</AccordionTrigger>
            <AccordionContent>
              <CategorySection
                items={budget.items}
                onAdd={handleAddBudgetCategory}
                onRemove={budget.removeItem}
                onBeforeRemove={handleBeforeRemoveBudget}
                onRename={handleRenameBudgetCategory}
                onReset={budget.resetToDefaults}
                placeholder="New expense category"
                tradeGrouped
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="monthly">
            <AccordionTrigger className="text-sm">Monthly Expense Types ({monthly.items.length})</AccordionTrigger>
            <AccordionContent>
              <CategorySection
                items={monthly.items}
                onAdd={monthly.addItem}
                onRemove={monthly.removeItem}
                onBeforeRemove={makeBeforeRemove('monthly')}
                onRename={handleRenameGeneric('monthly')}
                onReset={monthly.resetToDefaults}
                placeholder="New monthly expense type"
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="stores">
            <AccordionTrigger className="text-sm">Procurement Stores ({stores.items.length})</AccordionTrigger>
            <AccordionContent>
              <CategorySection
                items={stores.items}
                onAdd={stores.addItem}
                onRemove={stores.removeItem}
                onBeforeRemove={makeBeforeRemove('stores')}
                onRename={handleRenameGeneric('stores')}
                onReset={stores.resetToDefaults}
                placeholder="New store name"
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="propertyInfo">
            <AccordionTrigger className="text-sm">Property Info Fields ({propertyInfo.items.length})</AccordionTrigger>
            <AccordionContent>
              <CategorySection
                items={propertyInfo.items}
                onAdd={propertyInfo.addItem}
                onRemove={propertyInfo.removeItem}
                onBeforeRemove={makeBeforeRemove('propertyInfo')}
                onRename={handleRenameGeneric('propertyInfo')}
                onReset={propertyInfo.resetToDefaults}
                placeholder="New property field"
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>

    {/* Existing specialized dialog for Expense Categories */}
    <ReassignCategoryDialog
      open={reassignOpen}
      onOpenChange={setReassignOpen}
      category={pendingDelete}
      remainingCategories={budget.items}
      onComplete={handleReassignComplete}
    />

    {/* Generic dialog for all other sections */}
    <GenericReassignDialog
      open={genericOpen}
      onOpenChange={setGenericOpen}
      category={genericPending}
      remainingItems={genericSection ? sectionHooks[genericSection].items : []}
      onComplete={handleGenericComplete}
      dbConfig={genericSection ? SECTION_DB_CONFIG[genericSection] : null}
      sectionLabel={genericSection ? SECTION_LABELS[genericSection] : 'item'}
    />
    </>
  );
}
