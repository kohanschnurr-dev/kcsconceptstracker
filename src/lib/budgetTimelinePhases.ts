import { CategoryItem } from '@/hooks/useCustomCategories';
import { LucideIcon, ClipboardList, Shovel, Home, Zap, Layers, Trees, Paintbrush, CookingPot, Wrench, CheckCircle2, Package } from 'lucide-react';

export interface TimelinePhase {
  key: string;
  label: string;
  icon: LucideIcon;
  categories: string[];
}

export const TIMELINE_PHASES: TimelinePhase[] = [
  {
    key: 'phase_1',
    label: 'Phase 1 — Pre-Construction',
    icon: ClipboardList,
    categories: ['permits', 'insurance_project', 'inspections', 'closing_costs'],
  },
  {
    key: 'phase_2',
    label: 'Phase 2 — Site Work & Foundation',
    icon: Shovel,
    categories: ['demolition', 'driveway_concrete', 'foundation_repair', 'foundation', 'drain_line_repair'],
  },
  {
    key: 'phase_3',
    label: 'Phase 3 — Framing & Structure',
    icon: Home,
    categories: ['framing', 'roofing', 'windows', 'doors'],
  },
  {
    key: 'phase_4',
    label: 'Phase 4 — Rough MEPs',
    icon: Zap,
    categories: ['plumbing', 'electrical', 'hvac', 'natural_gas'],
  },
  {
    key: 'phase_5',
    label: 'Phase 5 — Insulation & Drywall',
    icon: Layers,
    categories: ['insulation', 'drywall'],
  },
  {
    key: 'phase_6',
    label: 'Phase 6 — Exterior',
    icon: Trees,
    categories: ['brick_siding_stucco', 'garage', 'fencing', 'railing', 'landscaping', 'pool'],
  },
  {
    key: 'phase_7',
    label: 'Phase 7 — Finishes',
    icon: Paintbrush,
    categories: ['flooring', 'painting', 'tile', 'light_fixtures', 'hardware', 'carpentry'],
  },
  {
    key: 'phase_8',
    label: 'Phase 8 — Kitchen & Bath',
    icon: CookingPot,
    categories: ['cabinets', 'countertops', 'appliances', 'kitchen', 'bathroom', 'main_bathroom', 'water_heater'],
  },
  {
    key: 'phase_9',
    label: 'Phase 9 — Final Systems',
    icon: Wrench,
    categories: ['utilities'],
  },
  {
    key: 'phase_10',
    label: 'Phase 10 — Closeout',
    icon: CheckCircle2,
    categories: ['final_punch', 'cleaning', 'hoa', 'food', 'rehab_filler', 'misc', 'dumpsters_trash', 'pest_control', 'staging', 'taxes', 'variable', 'wholesale_fee'],
  },
];

/** Custom phase overrides: maps phase key -> ordered category value array */
export type TimelineCustomization = Record<string, string[]>;

export const TIMELINE_CUSTOM_STORAGE_KEY = 'budget-timeline-custom';

/** All category values claimed by a timeline phase (default mapping) */
const DEFAULT_PHASED_CATEGORIES = new Set(TIMELINE_PHASES.flatMap(p => p.categories));

/**
 * Build timeline groups from the same categories used by the category view.
 * Accepts optional customizations that override phase membership and order.
 */
export function buildTimelineGroups(
  categories: CategoryItem[],
  customization?: TimelineCustomization
) {
  const categoryValues = new Set(categories.map(c => c.value));
  const assignedByCustom = new Set<string>();

  const groups = TIMELINE_PHASES
    .map(phase => {
      // Use custom order if available, otherwise default
      const phaseCategories = customization?.[phase.key]
        ? customization[phase.key].filter(c => categoryValues.has(c))
        : phase.categories.filter(c => categoryValues.has(c));

      if (customization?.[phase.key]) {
        phaseCategories.forEach(c => assignedByCustom.add(c));
      }

      return {
        key: phase.key,
        name: phase.label,
        icon: phase.icon,
        categories: phaseCategories,
      };
    })
    .filter(g => g.categories.length > 0);

  // Build the set of all assigned categories across all phases
  const allAssigned = new Set<string>();
  groups.forEach(g => g.categories.forEach(c => allAssigned.add(c)));

  // Collect any categories not assigned to a phase into "Other"
  const unphased = categories
    .filter(c => !allAssigned.has(c.value))
    .map(c => c.value);

  // Apply custom order to Other if available
  const otherCategories = customization?.['phase_other']
    ? customization['phase_other'].filter(c => categoryValues.has(c) && !allAssigned.has(c))
    : unphased;

  // Also add any unphased items not captured by custom Other
  if (customization?.['phase_other']) {
    const otherSet = new Set(otherCategories);
    unphased.forEach(c => {
      if (!otherSet.has(c)) otherCategories.push(c);
    });
  }

  if (otherCategories.length > 0) {
    groups.push({
      key: 'phase_other',
      name: 'Other',
      icon: Package,
      categories: otherCategories,
    });
  }

  return groups;
}

/** Get all categories currently assigned to any phase (including custom) */
export function getCategoriesInPhase(
  phaseKey: string,
  categories: CategoryItem[],
  customization?: TimelineCustomization
): string[] {
  const groups = buildTimelineGroups(categories, customization);
  return groups.find(g => g.key === phaseKey)?.categories || [];
}

/** Get all categories NOT in the given phase */
export function getCategoriesNotInPhase(
  phaseKey: string,
  categories: CategoryItem[],
  customization?: TimelineCustomization
): { value: string; label: string }[] {
  const groups = buildTimelineGroups(categories, customization);
  const inPhase = new Set(groups.find(g => g.key === phaseKey)?.categories || []);
  return categories
    .filter(c => !inPhase.has(c.value))
    .map(c => ({ value: c.value, label: c.label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
