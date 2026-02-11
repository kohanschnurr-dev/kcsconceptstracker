import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, RotateCcw, List } from 'lucide-react';
import { toast } from 'sonner';
import { useCustomCategories, type CategoryItem } from '@/hooks/useCustomCategories';
import { CALENDAR_CATEGORIES, CATEGORY_GROUPS, type CategoryGroup } from '@/lib/calendarCategories';
import { MONTHLY_COST_CATEGORIES } from '@/lib/monthlyCategories';
import { BUDGET_CATEGORIES, BUSINESS_EXPENSE_CATEGORIES } from '@/types';
import { DEFAULT_STORES } from '@/hooks/useCustomStores';
import { DEFAULT_PROPERTY_FIELDS } from '@/components/project/ProjectInfo';
import { BUDGET_CALC_GROUP_DEFS, CATEGORY_GROUP_MAP } from '@/lib/budgetCalculatorCategories';
import ReassignCategoryDialog from './ReassignCategoryDialog';

function CategorySection({
  items,
  onAdd,
  onRemove,
  onBeforeRemove,
  onReset,
  placeholder,
  grouped,
  tradeGrouped,
}: {
  items: CategoryItem[];
  onAdd: (label: string, group?: string) => boolean;
  onRemove: (value: string) => void;
  onBeforeRemove?: (value: string, label: string) => void;
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
    const success = onAdd(trimmed, grouped ? selectedGroup : undefined);
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
              {groupItems.map(item => (
                <Badge key={item.value} variant="outline" className={`text-xs ${groupInfo.borderClass} ${groupInfo.textClass}`}>
                  {item.label}
                  <button onClick={() => handleRemove(item.value, item.label)} className="ml-1.5 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
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
          .filter(i => (CATEGORY_GROUP_MAP[i.value] || 'other') === groupKey)
          .sort((a, b) => a.label.localeCompare(b.label));
        if (groupItems.length === 0) return null;
        return (
          <div key={groupKey} className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{def.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {groupItems.map(item => (
                <Badge key={item.value} variant="outline" className="text-xs">
                  {item.label}
                  <button onClick={() => handleRemove(item.value, item.label)} className="ml-1.5 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        );
      });
    }

    return (
      <div className="flex flex-wrap gap-1.5">
        {[...items].sort((a, b) => a.label.localeCompare(b.label)).map(item => (
          <Badge key={item.value} variant="outline" className="text-xs">
            {item.label}
            <button onClick={() => handleRemove(item.value, item.label)} className="ml-1.5 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
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

export default function ManageSourcesCard() {
  const calendar = useCustomCategories('calendar', calendarDefaults);
  const budget = useCustomCategories('budget', budgetDefaults);
  const monthly = useCustomCategories('monthly', monthlyDefaults);
  const business = useCustomCategories('business', businessDefaults);
  const stores = useCustomCategories('stores', storeDefaults);
  const propertyInfo = useCustomCategories('propertyInfo', propertyInfoDefaults);

  const [pendingDelete, setPendingDelete] = useState<{ value: string; label: string } | null>(null);
  const [reassignOpen, setReassignOpen] = useState(false);

  const handleBeforeRemoveBudget = useCallback((value: string, label: string) => {
    setPendingDelete({ value, label });
    setReassignOpen(true);
  }, []);

  const handleReassignComplete = useCallback((value: string) => {
    budget.removeItem(value);
    setPendingDelete(null);
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
                onAdd={budget.addItem}
                onRemove={budget.removeItem}
                onBeforeRemove={handleBeforeRemoveBudget}
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
                onReset={propertyInfo.resetToDefaults}
                placeholder="New property field"
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>

    <ReassignCategoryDialog
      open={reassignOpen}
      onOpenChange={setReassignOpen}
      category={pendingDelete}
      remainingCategories={budget.items}
      onComplete={handleReassignComplete}
    />
    </>
  );
}
