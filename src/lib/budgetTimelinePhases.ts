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
    categories: ['demolition', 'driveway_concrete', 'foundation_repair', 'drain_line_repair'],
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

/** All category values claimed by a timeline phase */
const PHASED_CATEGORIES = new Set(TIMELINE_PHASES.flatMap(p => p.categories));

/**
 * Build timeline groups from the same categories used by the category view.
 * Returns the same shape as buildBudgetCalcGroups so the rendering loop is identical.
 */
export function buildTimelineGroups(categories: CategoryItem[]) {
  const categoryValues = new Set(categories.map(c => c.value));

  const groups = TIMELINE_PHASES
    .map(phase => ({
      key: phase.key,
      name: phase.label,
      icon: phase.icon,
      categories: phase.categories.filter(c => categoryValues.has(c)),
    }))
    .filter(g => g.categories.length > 0);

  // Collect any categories not assigned to a phase into "Other"
  const unphased = categories
    .filter(c => !PHASED_CATEGORIES.has(c.value))
    .map(c => c.value);

  if (unphased.length > 0) {
    groups.push({
      key: 'phase_other',
      name: 'Other',
      icon: Package,
      categories: unphased,
    });
  }

  return groups;
}
