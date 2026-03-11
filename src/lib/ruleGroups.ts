import { triggerSettingsSync } from '@/hooks/useSettingsSync';

export type SeverityLevel = 'information' | 'warning' | 'hard_stop';
export type RuleStatus = 'active' | 'paused' | 'triggered';

export interface RuleGroup {
  key: string;
  label: string;
}

const STORAGE_KEY = 'custom-rule-groups';

const DEFAULT_GROUPS: RuleGroup[] = [
  { key: 'order_of_operations', label: 'Order of Operations' },
  { key: 'vendor_requirements', label: 'Contractor Requirements' },
];

export const SEVERITY_CONFIG: Record<SeverityLevel, { label: string; cssClass: string; color: string; bgColor: string }> = {
  information: {
    label: 'Information',
    cssClass: 'severity-info',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/15',
  },
  warning: {
    label: 'Warning',
    cssClass: 'severity-warning',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
  },
  hard_stop: {
    label: 'Hard Stop',
    cssClass: 'severity-hard-stop',
    color: 'text-red-400',
    bgColor: 'bg-red-500/15',
  },
};

export const STATUS_CONFIG: Record<RuleStatus, { label: string; dotColor: string; cssClass: string }> = {
  active: { label: 'Active', dotColor: 'bg-emerald-400', cssClass: 'rule-status-active' },
  paused: { label: 'Paused', dotColor: 'bg-slate-500', cssClass: '' },
  triggered: { label: 'Triggered', dotColor: 'bg-red-500', cssClass: 'rule-status-triggered' },
};

// Construction phase ordering for guardrail logic
export const CONSTRUCTION_PHASE_ORDER = [
  'foundation',
  'framing',
  'roofing',
  'plumbing',
  'electrical',
  'hvac',
  'insulation',
  'drywall',
  'interior_finish',
  'flooring',
  'painting',
  'exterior_finish',
  'landscaping',
  'final_inspection',
] as const;

export function getPhaseIndex(category: string): number {
  const idx = CONSTRUCTION_PHASE_ORDER.indexOf(category as typeof CONSTRUCTION_PHASE_ORDER[number]);
  return idx === -1 ? -1 : idx;
}

export function isOutOfOrder(expenseCategory: string, completedPhases: string[]): boolean {
  const expenseIdx = getPhaseIndex(expenseCategory);
  if (expenseIdx <= 0) return false; // Unknown category or first phase

  // Check if all prior phases have been started
  for (let i = 0; i < expenseIdx; i++) {
    const priorPhase = CONSTRUCTION_PHASE_ORDER[i];
    if (!completedPhases.includes(priorPhase)) {
      return true; // Found an earlier phase that hasn't been started
    }
  }
  return false;
}

export function loadRuleGroups(): RuleGroup[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [...DEFAULT_GROUPS];
}

export function saveRuleGroups(groups: RuleGroup[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  triggerSettingsSync();
}

export function toSnakeCase(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_');
}
