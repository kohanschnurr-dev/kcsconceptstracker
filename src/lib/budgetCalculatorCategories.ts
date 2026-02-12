import { CategoryItem } from '@/hooks/useCustomCategories';
import { Zap, Droplets, PaintBucket, Home, Trees, Package, LucideIcon } from 'lucide-react';
import { getBudgetCategories } from '@/types';

export interface BudgetCalcGroupDef {
  label: string;
  icon: LucideIcon;
  emoji?: string;
}

export const BUDGET_CALC_GROUP_DEFS: Record<string, BudgetCalcGroupDef> = {
  structure: { label: 'Structure', icon: Home },
  meps: { label: 'MEPs', icon: Zap },
  finishes: { label: 'Finishes', icon: PaintBucket },
  kitchen_bath: { label: 'Kitchen & Bath', icon: Droplets },
  exterior: { label: 'Exterior', icon: Trees },
  other: { label: 'Other', icon: Package },
};

// --- Custom trade groups (localStorage) ---
export const CUSTOM_GROUPS_STORAGE_KEY = 'custom-trade-groups';

export interface CustomGroupEntry {
  key: string;
  label: string;
  emoji?: string;
}

const EMOJI_MAP: Record<string, string> = {
  purchase: '🏠', buy: '🏠', acquire: '🏠',
  sale: '💰', sell: '💰', profit: '💰',
  closing: '📝', close: '📝',
  'pre-close': '🔑', preclose: '🔑',
  finance: '💵', loan: '💵', lending: '💵', mortgage: '💵',
  labor: '👷', crew: '👷', contractor: '👷',
  land: '🌍', lot: '🌍',
  legal: '⚖️', attorney: '⚖️',
  marketing: '📣', advertising: '📣',
  office: '🏢',
  insurance: '🛡️',
  tax: '🧾', taxes: '🧾',
  holding: '⏳', carry: '⏳',
  rehab: '🔨', renovation: '🔨', construction: '🔨',
  utility: '⚡', utilities: '⚡',
  inspection: '🔍', inspect: '🔍',
  permit: '📋', permits: '📋',
  design: '🎨', architect: '🎨',
  title: '📄', escrow: '📄',
};

export function pickEmoji(label: string): string {
  const words = label.toLowerCase().split(/[\s&,]+/);
  for (const word of words) {
    if (EMOJI_MAP[word]) return EMOJI_MAP[word];
  }
  return '📦';
}

export function loadCustomGroups(): Record<string, BudgetCalcGroupDef> {
  try {
    const raw = localStorage.getItem(CUSTOM_GROUPS_STORAGE_KEY);
    if (!raw) return {};
    const entries: CustomGroupEntry[] = JSON.parse(raw);
    const result: Record<string, BudgetCalcGroupDef> = {};
    for (const e of entries) {
      result[e.key] = { label: e.label, icon: Package, emoji: e.emoji };
    }
    return result;
  } catch {
    return {};
  }
}

export function saveCustomGroups(entries: CustomGroupEntry[]) {
  localStorage.setItem(CUSTOM_GROUPS_STORAGE_KEY, JSON.stringify(entries));
  import('@/hooks/useSettingsSync').then(({ triggerSettingsSync }) => triggerSettingsSync()).catch(() => {});
}

/** Returns built-in groups merged with any user-created custom groups */
export function getAllGroupDefs(): Record<string, BudgetCalcGroupDef> {
  return { ...BUDGET_CALC_GROUP_DEFS, ...loadCustomGroups() };
}

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
  return getBudgetCategories().map((cat: any) => ({
    value: cat.value,
    label: cat.label,
    group: cat.group || CATEGORY_GROUP_MAP[cat.value] || 'other',
  }));
}

/** Resolve the trade group for a category, checking item.group first then the static map */
export function resolveTradeGroup(item: CategoryItem): string {
  return item.group || CATEGORY_GROUP_MAP[item.value] || 'other';
}

/** Build grouped structure from expense categories for BudgetCanvas rendering */
export function buildBudgetCalcGroups(categories: CategoryItem[]) {
  const allDefs = getAllGroupDefs();
  const customDefs = loadCustomGroups();
  const groupOrder = Object.keys(allDefs);
  return groupOrder
    .map(groupKey => {
      const def = allDefs[groupKey];
      const cats = categories.filter(c => c.group === groupKey);
      return {
        key: groupKey,
        name: def.label,
        icon: def.icon,
        emoji: def.emoji,
        categories: cats.map(c => c.value),
      };
    })
    .filter(g => g.categories.length > 0 || g.key in customDefs);
}
