import { useState } from 'react';
import { BudgetCategoryCard } from './BudgetCategoryCard';
import { BUDGET_CATEGORIES } from '@/types';
import { 
  Zap, Droplets, PaintBucket, 
  Home, Trees, Package,
  ChevronRight
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface BudgetCanvasProps {
  categoryBudgets: Record<string, string>;
  onCategoryChange: (category: string, value: string) => void;
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


export function BudgetCanvas({ categoryBudgets, onCategoryChange }: BudgetCanvasProps) {
  const [openGroups, setOpenGroups] = useState<string[]>(['Structure']);

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

  return (
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
  );
}
