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

export const CATEGORY_GROUPS: Record<CategoryGroup, { label: string; color: string; bgClass: string; swatchClass: string; textClass: string; borderClass: string }> = {
  acquisition_admin: {
    label: 'Acquisition/Admin',
    color: 'blue',
    bgClass: 'bg-blue-100 dark:bg-blue-500/20',
    swatchClass: 'bg-blue-500',
    textClass: 'text-blue-900 dark:text-blue-200',
    borderClass: 'border-blue-200 dark:border-blue-500/30',
  },
  structural_exterior: {
    label: 'Structural/Exterior',
    color: 'red',
    bgClass: 'bg-red-100 dark:bg-red-500/20',
    swatchClass: 'bg-red-500',
    textClass: 'text-red-900 dark:text-red-200',
    borderClass: 'border-red-200 dark:border-red-500/30',
  },
  rough_ins: {
    label: 'Rough-ins',
    color: 'orange',
    bgClass: 'bg-orange-100 dark:bg-orange-500/20',
    swatchClass: 'bg-orange-500',
    textClass: 'text-orange-900 dark:text-orange-200',
    borderClass: 'border-orange-200 dark:border-orange-500/30',
  },
  inspections: {
    label: 'Inspections',
    color: 'purple',
    bgClass: 'bg-purple-100 dark:bg-purple-500/20',
    swatchClass: 'bg-purple-500',
    textClass: 'text-purple-900 dark:text-purple-200',
    borderClass: 'border-purple-200 dark:border-purple-500/30',
  },
  interior_finishes: {
    label: 'Interior Finishes',
    color: 'green',
    bgClass: 'bg-emerald-100 dark:bg-emerald-500/20',
    swatchClass: 'bg-emerald-500',
    textClass: 'text-emerald-900 dark:text-emerald-200',
    borderClass: 'border-emerald-200 dark:border-emerald-500/30',
  },
  milestones: {
    label: 'Milestones',
    color: 'gold',
    bgClass: 'bg-amber-100 dark:bg-amber-500/20',
    swatchClass: 'bg-amber-500',
    textClass: 'text-amber-900 dark:text-amber-200',
    borderClass: 'border-amber-200 dark:border-amber-500/30',
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
  { value: 'garage', label: 'Garage', group: 'structural_exterior', groupLabel: 'Structural/Exterior' },
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
  
  // Milestones (Gold) - Fix & Flip first (more calendar days), then Rentals
  { value: 'purchase', label: 'Purchase', group: 'milestones', groupLabel: 'Milestones' },
  { value: 'stage_clean', label: 'Stage/Clean', group: 'milestones', groupLabel: 'Milestones' },
  { value: 'listing_date', label: 'Listing Date', group: 'milestones', groupLabel: 'Milestones' },
  { value: 'open_house', label: 'Open House', group: 'milestones', groupLabel: 'Milestones' },
  { value: 'sale_closing', label: 'Sale Closing', group: 'milestones', groupLabel: 'Milestones' },
  // Rental milestones
  { value: 'refinancing', label: 'Refinancing', group: 'milestones', groupLabel: 'Milestones' },
];

// Dynamic getter that checks localStorage first
export function getCalendarCategories(): CalendarCategory[] {
  try {
    const saved = localStorage.getItem('custom-calendar-categories');
    if (saved) {
      const parsed = JSON.parse(saved) as CalendarCategory[];
      const valid = parsed
        .filter(c => c.value && c.label && c.group)
        .map(c => ({
          ...c,
          groupLabel: c.groupLabel || CATEGORY_GROUPS[c.group as CategoryGroup]?.label || c.group,
        }));
      if (valid.length > 0) {
        return valid;
      }
      // All entries invalid — clear corrupted data
      localStorage.removeItem('custom-calendar-categories');
    }
  } catch (e) {
    console.error('Error loading custom calendar categories:', e);
    localStorage.removeItem('custom-calendar-categories');
  }
  return [...CALENDAR_CATEGORIES];
}

export function getCategoryGroup(categoryValue: string): CategoryGroup {
  const category = getCalendarCategories().find(c => c.value === categoryValue);
  return category?.group || 'acquisition_admin';
}

export function getCategoryLabel(categoryValue: string): string {
  const category = getCalendarCategories().find(c => c.value === categoryValue);
  return category?.label || categoryValue;
}

export function getCategoryStyles(categoryValue: string) {
  const group = getCategoryGroup(categoryValue);
  return CATEGORY_GROUPS[group];
}

// Checklist presets per category
export const CATEGORY_CHECKLIST_PRESETS: Record<string, string[]> = {
  // Acquisition/Admin
  due_diligence: ['Property walkthrough', 'Comps pulled', 'Scope of work drafted', 'Title search'],
  underwriting: ['Run numbers', 'Verify ARV', 'Confirm rehab budget', 'Lender pre-approval'],
  closing: ['Title clear', 'Funding confirmed', 'Docs signed', 'Keys received'],
  permitting: ['Application submitted', 'Plans approved', 'Permit posted', 'Inspections scheduled'],
  order: ['Items selected', 'PO submitted', 'Delivery confirmed', 'Tracking received'],
  item_arrived: ['Verify quantity', 'Check for damage', 'Store on site', 'Notify crew'],
  // Structural/Exterior
  demo: ['Dumpster ordered', 'Utilities disconnected', 'Permits pulled', 'Hazmat check', 'Demo complete walkthrough'],
  foundation_piers: ['Engineering report', 'Piers installed', 'Foundation leveled', 'Grade beams poured'],
  roofing: ['Materials delivered', 'Tear-off complete', 'Underlayment', 'Shingles installed', 'Gutters', 'Final inspection'],
  garage: ['Door ordered', 'Framing complete', 'Door installed', 'Opener installed'],
  grading: ['Survey complete', 'Drainage plan', 'Grade set', 'Sod/seed'],
  siding: ['Materials delivered', 'Old siding removed', 'Wrap installed', 'Siding installed', 'Trim complete'],
  windows: ['Windows ordered', 'Old windows removed', 'New windows installed', 'Flashing/trim', 'Caulked/sealed'],
  exterior_paint: ['Power wash', 'Scrape/prep', 'Prime', 'Paint', 'Touch-up'],
  // Rough-ins
  plumbing_rough: ['Water lines', 'Drain lines', 'Gas lines', 'Pressure test', 'Stub-outs'],
  electrical_rough: ['Panel installed', 'Wiring run', 'Boxes set', 'Low voltage', 'Label circuits'],
  hvac_rough: ['Ductwork', 'Line set', 'Condensate drain', 'Thermostat wire', 'Equipment set'],
  framing: ['Layout', 'Walls framed', 'Headers set', 'Blocking', 'Sheathing'],
  // Inspections
  city_rough_in: ['Schedule inspection', 'Prep site', 'Inspector on site', 'Corrections noted', 'Passed'],
  third_party: ['Schedule inspection', 'Report received', 'Issues addressed'],
  foundation_pre_pour: ['Forms set', 'Rebar inspected', 'Plumbing verified', 'Ready to pour'],
  final_green_tag: ['Final walkthrough', 'All trades signed off', 'CO received'],
  // Interior Finishes
  drywall: ['Hang', 'Tape/bed', 'Texture', 'Touch-up'],
  painting: ['Prime', 'First coat', 'Second coat', 'Touch-up', 'Trim/doors'],
  tile: ['Layout', 'Set tile', 'Grout', 'Seal'],
  flooring: ['Acclimate', 'Underlayment', 'Install', 'Transitions', 'Final clean'],
  cabinetry: ['Template', 'Cabinets delivered', 'Uppers installed', 'Lowers installed', 'Hardware'],
  countertops: ['Template', 'Fabrication', 'Install', 'Backsplash', 'Seal'],
  // Milestones
  purchase: ['Earnest money', 'Inspection period', 'Appraisal', 'Close'],
  stage_clean: ['Deep clean', 'Stage furniture', 'Photos scheduled', 'Listing prep'],
  listing_date: ['MLS listing live', 'Sign in yard', 'Lockbox on', 'Showings enabled'],
  open_house: ['Marketing sent', 'Refreshments', 'Sign-in sheet', 'Follow-up calls'],
  sale_closing: ['Buyer financing confirmed', 'Final walkthrough', 'Docs signed', 'Funds received'],
  refinancing: ['Appraisal ordered', 'Docs submitted', 'Rate locked', 'Closing scheduled'],
};

// Group categories for the dropdown
export const GROUP_ORDER: CategoryGroup[] = [
  'acquisition_admin',
  'structural_exterior',
  'rough_ins',
  'inspections',
  'interior_finishes',
  'milestones',
];

export function getGroupedCategories(): Record<CategoryGroup, CalendarCategory[]> {
  const categories = getCalendarCategories();
  const result = {} as Record<CategoryGroup, CalendarCategory[]>;
  for (const group of GROUP_ORDER) {
    const cats = categories.filter(c => c.group === group);
    if (cats.length > 0) {
      result[group] = cats;
    }
  }
  return result;
}
