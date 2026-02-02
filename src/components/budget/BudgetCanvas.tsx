import { BudgetCategoryCard } from './BudgetCategoryCard';
import { BUDGET_CATEGORIES } from '@/types';
import { 
  Hammer, Wrench, Zap, Droplets, Wind, PaintBucket, 
  Grid3X3, Home, Fence, Trees, Package, FileCheck 
} from 'lucide-react';

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
    categories: ['permits_inspections', 'dumpsters_trash', 'cleaning_final_punch', 'staging', 'carpentry', 'pest_control', 'drain_line_repair', 'misc'],
  },
];

// Icons for specific categories
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  demolition: <Hammer className="h-4 w-4" />,
  framing: <Home className="h-4 w-4" />,
  electrical: <Zap className="h-4 w-4" />,
  plumbing: <Droplets className="h-4 w-4" />,
  hvac: <Wind className="h-4 w-4" />,
  painting: <PaintBucket className="h-4 w-4" />,
  flooring: <Grid3X3 className="h-4 w-4" />,
  landscaping: <Trees className="h-4 w-4" />,
  fencing: <Fence className="h-4 w-4" />,
  permits_inspections: <FileCheck className="h-4 w-4" />,
};

export function BudgetCanvas({ categoryBudgets, onCategoryChange }: BudgetCanvasProps) {
  const getCategoryLabel = (categoryValue: string) => {
    const cat = BUDGET_CATEGORIES.find(c => c.value === categoryValue);
    return cat?.label || categoryValue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-8">
      {CATEGORY_GROUPS.map((group) => {
        const GroupIcon = group.icon;
        const groupCategories = group.categories.filter(cat => 
          BUDGET_CATEGORIES.some(bc => bc.value === cat)
        );

        if (groupCategories.length === 0) return null;

        return (
          <div key={group.name}>
            <div className="flex items-center gap-2 mb-4">
              <GroupIcon className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                {group.name}
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {groupCategories.map((category) => (
                <BudgetCategoryCard
                  key={category}
                  category={category}
                  label={getCategoryLabel(category)}
                  value={categoryBudgets[category] || ''}
                  onChange={(value) => onCategoryChange(category, value)}
                  icon={CATEGORY_ICONS[category]}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
