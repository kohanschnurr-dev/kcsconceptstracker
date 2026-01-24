// DFW Construction Workflow Categories
// Each category group has a distinct color for calendar visualization

export type CategoryGroup = 
  | 'acquisition_admin'
  | 'structural_exterior'
  | 'rough_ins'
  | 'inspections'
  | 'interior_finishes'
  | 'milestones';

export interface CalendarCategory {
  value: string;
  label: string;
  group: CategoryGroup;
  groupLabel: string;
}

export const CATEGORY_GROUPS: Record<CategoryGroup, { label: string; color: string; bgClass: string; textClass: string; borderClass: string }> = {
  acquisition_admin: {
    label: 'Acquisition/Admin',
    color: 'blue',
    bgClass: 'bg-blue-500/20',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/30',
  },
  structural_exterior: {
    label: 'Structural/Exterior',
    color: 'red',
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/30',
  },
  rough_ins: {
    label: 'Rough-ins',
    color: 'orange',
    bgClass: 'bg-orange-500/20',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/30',
  },
  inspections: {
    label: 'Inspections',
    color: 'purple',
    bgClass: 'bg-purple-500/20',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/30',
  },
  interior_finishes: {
    label: 'Interior Finishes',
    color: 'green',
    bgClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
  },
  milestones: {
    label: 'Milestones',
    color: 'gold',
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
  },
};

export const CALENDAR_CATEGORIES: CalendarCategory[] = [
  // Acquisition/Admin (Blue)
  { value: 'due_diligence', label: 'Due Diligence', group: 'acquisition_admin', groupLabel: 'Acquisition/Admin' },
  { value: 'underwriting', label: 'Underwriting', group: 'acquisition_admin', groupLabel: 'Acquisition/Admin' },
  { value: 'closing', label: 'Closing', group: 'acquisition_admin', groupLabel: 'Acquisition/Admin' },
  { value: 'permitting', label: 'Permitting', group: 'acquisition_admin', groupLabel: 'Acquisition/Admin' },
  { value: 'order', label: 'Order', group: 'acquisition_admin', groupLabel: 'Acquisition/Admin' },
  { value: 'item_arrived', label: 'Item Arrived', group: 'acquisition_admin', groupLabel: 'Acquisition/Admin' },
  
  // Structural/Exterior (Red)
  { value: 'demo', label: 'Demo', group: 'structural_exterior', groupLabel: 'Structural/Exterior' },
  { value: 'foundation_piers', label: 'Foundation/Piers', group: 'structural_exterior', groupLabel: 'Structural/Exterior' },
  { value: 'roofing', label: 'Roofing', group: 'structural_exterior', groupLabel: 'Structural/Exterior' },
  { value: 'grading', label: 'Grading', group: 'structural_exterior', groupLabel: 'Structural/Exterior' },
  { value: 'siding', label: 'Siding', group: 'structural_exterior', groupLabel: 'Structural/Exterior' },
  { value: 'windows', label: 'Windows', group: 'structural_exterior', groupLabel: 'Structural/Exterior' },
  { value: 'exterior_paint', label: 'Exterior Paint', group: 'structural_exterior', groupLabel: 'Structural/Exterior' },
  
  // Rough-ins (Orange)
  { value: 'plumbing_rough', label: 'Plumbing (Cast Iron/PVC)', group: 'rough_ins', groupLabel: 'Rough-ins' },
  { value: 'electrical_rough', label: 'Electrical', group: 'rough_ins', groupLabel: 'Rough-ins' },
  { value: 'hvac_rough', label: 'HVAC', group: 'rough_ins', groupLabel: 'Rough-ins' },
  { value: 'framing', label: 'Framing', group: 'rough_ins', groupLabel: 'Rough-ins' },
  
  // Inspections (Purple)
  { value: 'city_rough_in', label: 'City Rough-in', group: 'inspections', groupLabel: 'Inspections' },
  { value: 'third_party', label: 'Third Party', group: 'inspections', groupLabel: 'Inspections' },
  { value: 'foundation_pre_pour', label: 'Foundation Pre-pour', group: 'inspections', groupLabel: 'Inspections' },
  { value: 'final_green_tag', label: 'Final Green Tag', group: 'inspections', groupLabel: 'Inspections' },
  
  // Interior Finishes (Green)
  { value: 'drywall', label: 'Drywall', group: 'interior_finishes', groupLabel: 'Interior Finishes' },
  { value: 'painting', label: 'Painting', group: 'interior_finishes', groupLabel: 'Interior Finishes' },
  { value: 'tile', label: 'Tile', group: 'interior_finishes', groupLabel: 'Interior Finishes' },
  { value: 'flooring', label: 'LVP/Hardwoods', group: 'interior_finishes', groupLabel: 'Interior Finishes' },
  { value: 'cabinetry', label: 'Cabinetry', group: 'interior_finishes', groupLabel: 'Interior Finishes' },
  { value: 'countertops', label: 'Countertops', group: 'interior_finishes', groupLabel: 'Interior Finishes' },
  
  // Milestones (Gold)
  { value: 'purchase', label: 'Purchase', group: 'milestones', groupLabel: 'Milestones' },
  { value: 'refinancing', label: 'Refinancing', group: 'milestones', groupLabel: 'Milestones' },
  { value: 'sale_closing', label: 'Sale Closing', group: 'milestones', groupLabel: 'Milestones' },
  { value: 'listing_date', label: 'Listing Date', group: 'milestones', groupLabel: 'Milestones' },
  { value: 'open_house', label: 'Open House', group: 'milestones', groupLabel: 'Milestones' },
  { value: 'stage_clean', label: 'Stage/Clean', group: 'milestones', groupLabel: 'Milestones' },
];

export function getCategoryGroup(categoryValue: string): CategoryGroup {
  const category = CALENDAR_CATEGORIES.find(c => c.value === categoryValue);
  return category?.group || 'acquisition_admin';
}

export function getCategoryLabel(categoryValue: string): string {
  const category = CALENDAR_CATEGORIES.find(c => c.value === categoryValue);
  return category?.label || categoryValue;
}

export function getCategoryStyles(categoryValue: string) {
  const group = getCategoryGroup(categoryValue);
  return CATEGORY_GROUPS[group];
}

// Group categories for the dropdown
export function getGroupedCategories(): Record<CategoryGroup, CalendarCategory[]> {
  return CALENDAR_CATEGORIES.reduce((acc, category) => {
    if (!acc[category.group]) {
      acc[category.group] = [];
    }
    acc[category.group].push(category);
    return acc;
  }, {} as Record<CategoryGroup, CalendarCategory[]>);
}
