import { CategoryItem } from '@/hooks/useCustomCategories';
import { Zap, Droplets, PaintBucket, Home, Trees, Package, LucideIcon } from 'lucide-react';
import { getBudgetCategories } from '@/types';

export interface BudgetCalcGroupDef {
  label: string;
  icon: LucideIcon;
}

export const BUDGET_CALC_GROUP_DEFS: Record<string, BudgetCalcGroupDef> = {
  structure: { label: 'Structure', icon: Home },
  meps: { label: 'MEPs', icon: Zap },
  finishes: { label: 'Finishes', icon: PaintBucket },
  kitchen_bath: { label: 'Kitchen & Bath', icon: Droplets },
  exterior: { label: 'Exterior', icon: Trees },
  other: { label: 'Other', icon: Package },
};

/** Maps category values to their trade group. Unmapped categories default to 'other'. */
export const CATEGORY_GROUP_MAP: Record<string, string> = {
  // Structure
  demolition: 'structure',
  framing: 'structure',
  foundation_repair: 'structure',
  roofing: 'structure',
  drywall: 'structure',
  insulation: 'structure',
  // MEPs
  electrical: 'meps',
  plumbing: 'meps',
  hvac: 'meps',
  natural_gas: 'meps',
  water_heater: 'meps',
  drain_line_repair: 'meps',
  // Finishes
  painting: 'finishes',
  flooring: 'finishes',
  tile: 'finishes',
  doors: 'finishes',
  windows: 'finishes',
  hardware: 'finishes',
  light_fixtures: 'finishes',
  // Kitchen & Bath
  kitchen: 'kitchen_bath',
  bathroom: 'kitchen_bath',
  main_bathroom: 'kitchen_bath',
  cabinets: 'kitchen_bath',
  countertops: 'kitchen_bath',
  appliances: 'kitchen_bath',
  // Exterior
  landscaping: 'exterior',
  fencing: 'exterior',
  driveway_concrete: 'exterior',
  garage: 'exterior',
  pool: 'exterior',
  brick_siding_stucco: 'exterior',
  railing: 'exterior',
  permits: 'other',
  inspections: 'other',
};

/** Get budget calculator categories by enriching expense categories with group info */
export function getBudgetCalcCategories(): CategoryItem[] {
  return getBudgetCategories().map(cat => ({
    value: cat.value,
    label: cat.label,
    group: CATEGORY_GROUP_MAP[cat.value] || 'other',
  }));
}

/** Build grouped structure from expense categories for BudgetCanvas rendering */
export function buildBudgetCalcGroups(categories: CategoryItem[]) {
  const groupOrder = Object.keys(BUDGET_CALC_GROUP_DEFS);
  return groupOrder
    .map(groupKey => {
      const def = BUDGET_CALC_GROUP_DEFS[groupKey];
      const cats = categories.filter(c => c.group === groupKey);
      return {
        name: def.label,
        icon: def.icon,
        categories: cats.map(c => c.value),
      };
    })
    .filter(g => g.categories.length > 0);
}
