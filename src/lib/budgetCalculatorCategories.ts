import { CategoryItem } from '@/hooks/useCustomCategories';
import { Zap, Droplets, PaintBucket, Home, Trees, Package, LucideIcon } from 'lucide-react';

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

export const DEFAULT_BUDGET_CALC_CATEGORIES: CategoryItem[] = [
  // Structure
  { value: 'demolition', label: 'Demolition', group: 'structure' },
  { value: 'framing', label: 'Framing', group: 'structure' },
  { value: 'foundation_repair', label: 'Foundation', group: 'structure' },
  { value: 'roofing', label: 'Roofing', group: 'structure' },
  { value: 'drywall', label: 'Drywall', group: 'structure' },
  { value: 'insulation', label: 'Insulation', group: 'structure' },
  // MEPs
  { value: 'electrical', label: 'Electrical', group: 'meps' },
  { value: 'plumbing', label: 'Plumbing', group: 'meps' },
  { value: 'hvac', label: 'HVAC', group: 'meps' },
  { value: 'natural_gas', label: 'Gas', group: 'meps' },
  { value: 'water_heater', label: 'Water Heater', group: 'meps' },
  { value: 'drain_line_repair', label: 'Drain Line Repair', group: 'meps' },
  // Finishes
  { value: 'painting', label: 'Painting', group: 'finishes' },
  { value: 'flooring', label: 'Flooring', group: 'finishes' },
  { value: 'tile', label: 'Tile', group: 'finishes' },
  { value: 'doors', label: 'Doors', group: 'finishes' },
  { value: 'windows', label: 'Windows', group: 'finishes' },
  { value: 'hardware', label: 'Hardware', group: 'finishes' },
  { value: 'light_fixtures', label: 'Light Fixtures', group: 'finishes' },
  // Kitchen & Bath
  { value: 'kitchen', label: 'Kitchen', group: 'kitchen_bath' },
  { value: 'bathroom', label: 'Bathroom', group: 'kitchen_bath' },
  { value: 'main_bathroom', label: 'Main Bathroom', group: 'kitchen_bath' },
  { value: 'cabinets', label: 'Cabinets', group: 'kitchen_bath' },
  { value: 'countertops', label: 'Countertops', group: 'kitchen_bath' },
  { value: 'appliances', label: 'Appliances', group: 'kitchen_bath' },
  // Exterior
  { value: 'landscaping', label: 'Landscaping', group: 'exterior' },
  { value: 'fencing', label: 'Fencing', group: 'exterior' },
  { value: 'driveway_concrete', label: 'Concrete', group: 'exterior' },
  { value: 'garage', label: 'Garage', group: 'exterior' },
  { value: 'pool', label: 'Pool', group: 'exterior' },
  { value: 'brick_siding_stucco', label: 'Exterior Finish', group: 'exterior' },
  { value: 'railing', label: 'Railing', group: 'exterior' },
  // Other
  { value: 'permits_inspections', label: 'Permits & Inspections', group: 'other' },
  { value: 'dumpsters_trash', label: 'Trash Hauling', group: 'other' },
  { value: 'cleaning', label: 'Cleaning', group: 'other' },
  { value: 'final_punch', label: 'Final Punch', group: 'other' },
  { value: 'staging', label: 'Staging', group: 'other' },
  { value: 'carpentry', label: 'Trims', group: 'other' },
  { value: 'pest_control', label: 'Pest Control', group: 'other' },
  { value: 'misc', label: 'Misc.', group: 'other' },
  { value: 'rehab_filler', label: 'Filler', group: 'other' },
];

const STORAGE_KEY = 'custom-budget-calc-categories';

export function getBudgetCalcCategories(): CategoryItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading budget calc categories:', e);
  }
  return DEFAULT_BUDGET_CALC_CATEGORIES;
}

/** Build grouped structure from flat category list for BudgetCanvas rendering */
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
