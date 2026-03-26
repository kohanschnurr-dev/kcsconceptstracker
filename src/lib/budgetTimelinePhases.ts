import { CategoryItem } from '@/hooks/useCustomCategories';
import { LucideIcon, ClipboardList, Shovel, Home, Zap, Layers, Trees, Paintbrush, CookingPot, Wrench, CheckCircle2, Package, Hammer, Ruler, Truck, HardHat, Warehouse } from 'lucide-react';

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
    label: 'Phase 9 — Closeout',
    icon: CheckCircle2,
    categories: ['utilities', 'final_punch', 'cleaning', 'hoa', 'food', 'rehab_filler', 'misc', 'dumpsters_trash', 'pest_control', 'staging', 'taxes', 'variable', 'wholesale_fee'],
  },
];

/** Icon name to component map for serialization */
export const ICON_MAP: Record<string, LucideIcon> = {
  ClipboardList,
  Shovel,
  Home,
  Zap,
  Layers,
  Trees,
  Paintbrush,
  CookingPot,
  Wrench,
  CheckCircle2,
  Package,
  Hammer,
  Ruler,
  Truck,
  HardHat,
  Warehouse,
};

export const ICON_OPTIONS = Object.keys(ICON_MAP);

export function getIconByName(name: string): LucideIcon {
  return ICON_MAP[name] || Package;
}

/** Custom phase overrides: maps phase key -> ordered category value array */
export type TimelineCustomization = Record<string, string[]>;

/** Stores user phase structure overrides (renames, deletions, additions) */
export interface PhaseOverride {
  key: string;
  label: string;
  iconName: string;
}

export interface TimelinePhaseConfig {
  /** Overridden / added phases */
  overrides: PhaseOverride[];
  /** Phase keys that have been deleted */
  deleted: string[];
}

export const TIMELINE_CUSTOM_STORAGE_KEY = 'budget-timeline-custom';
export const PHASE_CONFIG_STORAGE_KEY = 'budget-phase-config';

/**
 * Build the effective list of phases, merging defaults with user config.
 */
export function getEffectivePhases(config?: TimelinePhaseConfig): Array<{ key: string; label: string; icon: LucideIcon }> {
  const deletedSet = new Set(config?.deleted || []);
  const overrideMap = new Map((config?.overrides || []).map(o => [o.key, o]));

  // Start with default phases, applying renames and filtering deletions
  const phases: Array<{ key: string; label: string; icon: LucideIcon }> = [];

  for (const phase of TIMELINE_PHASES) {
    if (deletedSet.has(phase.key)) continue;
    const override = overrideMap.get(phase.key);
    if (override) {
      phases.push({
        key: phase.key,
        label: override.label,
        icon: getIconByName(override.iconName),
      });
    } else {
      phases.push({ key: phase.key, label: phase.label, icon: phase.icon });
    }
  }

  // Add user-created phases (keys not in defaults)
  const defaultKeys = new Set(TIMELINE_PHASES.map(p => p.key));
  for (const override of (config?.overrides || [])) {
    if (!defaultKeys.has(override.key) && !deletedSet.has(override.key)) {
      phases.push({
        key: override.key,
        label: override.label,
        icon: getIconByName(override.iconName),
      });
    }
  }

  return phases;
}

/**
 * Build timeline groups from the same categories used by the category view.
 * Accepts optional customizations that override phase membership and order.
 */
export function buildTimelineGroups(
  categories: CategoryItem[],
  customization?: TimelineCustomization,
  phaseConfig?: TimelinePhaseConfig
) {
  const categoryValues = new Set(categories.map(c => c.value));
  const effectivePhases = getEffectivePhases(phaseConfig);

  // Build default category map from TIMELINE_PHASES
  const defaultCategoryMap = new Map<string, string[]>();
  for (const phase of TIMELINE_PHASES) {
    defaultCategoryMap.set(phase.key, phase.categories);
  }

  const groups = effectivePhases
    .map(phase => {
      // Use custom order if available, otherwise default
      const defaultCats = defaultCategoryMap.get(phase.key) || [];
      const phaseCategories = customization?.[phase.key]
        ? customization[phase.key].filter(c => categoryValues.has(c))
        : defaultCats.filter(c => categoryValues.has(c));

      return {
        key: phase.key,
        name: phase.label,
        icon: phase.icon,
        categories: phaseCategories,
      };
    })
    .filter(g => g.categories.length > 0 || !TIMELINE_PHASES.some(p => p.key === g.key));
    // Keep user-created phases even if empty

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
    : [...unphased];

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
  customization?: TimelineCustomization,
  phaseConfig?: TimelinePhaseConfig
): string[] {
  const groups = buildTimelineGroups(categories, customization, phaseConfig);
  return groups.find(g => g.key === phaseKey)?.categories || [];
}

/** Get all categories NOT in the given phase */
export function getCategoriesNotInPhase(
  phaseKey: string,
  categories: CategoryItem[],
  customization?: TimelineCustomization,
  phaseConfig?: TimelinePhaseConfig
): { value: string; label: string }[] {
  const groups = buildTimelineGroups(categories, customization, phaseConfig);
  const inPhase = new Set(groups.find(g => g.key === phaseKey)?.categories || []);
  return categories
    .filter(c => !inPhase.has(c.value))
    .map(c => ({ value: c.value, label: c.label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
