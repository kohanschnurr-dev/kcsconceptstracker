import { CategoryItem } from '@/hooks/useCustomCategories';
import { Zap, Droplets, PaintBucket, Home, Trees, Package, LucideIcon, DollarSign, Banknote, HardHat, Scale, Shield, Receipt, Clock, Hammer, Search, ClipboardList, Palette, FileText, Megaphone, Building2, MapPin, FileSignature, Key, Landmark } from 'lucide-react';
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

// --- Custom trade groups (localStorage) ---
export const CUSTOM_GROUPS_STORAGE_KEY = 'custom-trade-groups';

// --- Group order persistence ---
export const GROUPS_ORDER_STORAGE_KEY = 'trade-groups-order';

export function loadGroupOrder(): string[] {
  try {
    const raw = localStorage.getItem(GROUPS_ORDER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveGroupOrder(order: string[]) {
  localStorage.setItem(GROUPS_ORDER_STORAGE_KEY, JSON.stringify(order));
  import('@/hooks/useSettingsSync').then(({ triggerSettingsSync }) => triggerSettingsSync()).catch(() => {});
}

export interface CustomGroupEntry {
  key: string;
  label: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  purchase: Landmark, buy: Landmark, acquire: Landmark,
  sale: DollarSign, sell: DollarSign, profit: DollarSign,
  closing: FileSignature, close: FileSignature,
  'pre-close': Key, preclose: Key,
  finance: Banknote, loan: Banknote, lending: Banknote, mortgage: Banknote,
  labor: HardHat, crew: HardHat, contractor: HardHat,
  land: MapPin, lot: MapPin,
  legal: Scale, attorney: Scale,
  marketing: Megaphone, advertising: Megaphone,
  office: Building2,
  insurance: Shield,
  tax: Receipt, taxes: Receipt,
  holding: Clock, carry: Clock,
  rehab: Hammer, renovation: Hammer, construction: Hammer,
  utility: Zap, utilities: Zap,
  inspection: Search, inspect: Search,
  permit: ClipboardList, permits: ClipboardList,
  design: Palette, architect: Palette,
  title: FileText, escrow: FileText,
};

export function pickIcon(label: string): LucideIcon {
  const words = label.toLowerCase().split(/[\s&,]+/);
  for (const word of words) {
    if (ICON_MAP[word]) return ICON_MAP[word];
  }
  return Package;
}

export function loadCustomGroups(): Record<string, BudgetCalcGroupDef> {
  try {
    const raw = localStorage.getItem(CUSTOM_GROUPS_STORAGE_KEY);
    if (!raw) return {};
    const entries: CustomGroupEntry[] = JSON.parse(raw);
    const result: Record<string, BudgetCalcGroupDef> = {};
    for (const e of entries) {
      result[e.key] = { label: e.label, icon: pickIcon(e.label) };
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

/** Returns built-in groups merged with any user-created custom groups, sorted by saved order */
export function getAllGroupDefs(): Record<string, BudgetCalcGroupDef> {
  const raw = { ...BUDGET_CALC_GROUP_DEFS, ...loadCustomGroups() };
  // Ensure 'other' is always last
  const { other, ...rest } = (() => {
    const o = raw['other'];
    const r = { ...raw };
    delete r['other'];
    return { other: o, ...r };
  })();
  const merged: Record<string, BudgetCalcGroupDef> = { ...rest, ...(other ? { other } : {}) };
  const savedOrder = loadGroupOrder();
  if (savedOrder.length === 0) return merged;

  // Build an ordered record: saved keys first, then any new/untracked keys
  const ordered: Record<string, BudgetCalcGroupDef> = {};
  for (const key of savedOrder) {
    if (merged[key]) ordered[key] = merged[key];
  }
  for (const key of Object.keys(merged)) {
    if (!ordered[key]) ordered[key] = merged[key];
  }
  return ordered;
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
        
        categories: cats.map(c => c.value),
      };
    })
    .filter(g => g.categories.length > 0 || g.key in customDefs);
}
