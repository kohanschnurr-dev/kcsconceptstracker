import { triggerSettingsSync } from '@/hooks/useSettingsSync';

export interface RuleGroup {
  key: string;
  label: string;
}

const STORAGE_KEY = 'custom-rule-groups';

const DEFAULT_GROUPS: RuleGroup[] = [
  { key: 'order_of_operations', label: 'Order of Operations' },
  { key: 'vendor_requirements', label: 'Contractor Requirements' },
];

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
