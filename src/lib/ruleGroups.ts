import { triggerSettingsSync } from '@/hooks/useSettingsSync';

export interface RuleGroup {
  key: string;
  label: string;
}

/** A guideline "page" in the Book of Rules */
export interface GuidelinePage {
  title: string;
  philosophy: string;
  standard: string;
  phase: ConstructionPhase;
}

/** Construction phases for contextual sidebar filtering */
export type ConstructionPhase =
  | 'pre_construction'
  | 'foundation'
  | 'framing'
  | 'rough_in'
  | 'exterior'
  | 'interior'
  | 'finish'
  | 'closeout'
  | 'general';

export const PHASE_LABELS: Record<ConstructionPhase, string> = {
  pre_construction: 'Pre-Construction',
  foundation: 'Foundation & Site',
  framing: 'Framing',
  rough_in: 'Rough-In (MEP)',
  exterior: 'Exterior Envelope',
  interior: 'Interior Build-Out',
  finish: 'Finish & Punch',
  closeout: 'Close-Out & Final',
  general: 'General',
};

/**
 * Seed guidelines — the institutional knowledge that ships with the app.
 * These are the "pages" a new user will find in their Book of Rules.
 */
export const SEED_GUIDELINES: GuidelinePage[] = [
  {
    title: 'The Oncor Rule',
    philosophy:
      'In the DFW market, utility lead times are unpredictable and outside your control. A missed Oncor call on Day 1 can cascade into weeks of delay that no amount of crew coordination can recover.',
    standard:
      'Utility activation requests (Oncor electric, Atmos gas, municipal water) must be submitted as the project\'s Day Zero task — before demo, before permits, before anything. Confirmation numbers are logged in the Daily Log on the first entry.',
    phase: 'pre_construction',
  },
  {
    title: 'The SOW Scrub',
    philosophy:
      'Budget leaks don\'t happen during construction — they\'re baked in during Pre-Con when vague line items slip through an unaudited Scope of Work. A $200 ambiguity on paper becomes a $2,000 change order on site.',
    standard:
      'Before any demo permit is pulled, the SOW undergoes a Line-by-Line audit. Every line item must have: a fixed dollar amount (no "TBD"), a responsible party, and a completion criteria. Items that fail any of the three are flagged and resolved before the project moves to Active.',
    phase: 'pre_construction',
  },
  {
    title: 'Foundation First',
    philosophy:
      'Cosmetic work on an unverified structural base is money buried underground. Pier work and plumbing rough-in are invisible once covered — mistakes found later require destructive rework that multiplies cost.',
    standard:
      'No cosmetic or finish SOW items (flooring, paint, fixtures, cabinetry) are approved for scheduling until pier and plumbing verification is documented with photos in the Daily Log and signed off by the PM. The project status must show "Foundation Verified" before any interior SOW items can be purchased or contracted.',
    phase: 'foundation',
  },
];

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

/** Get seed guidelines relevant to a specific phase */
export function getGuidelinesForPhase(phase: ConstructionPhase): GuidelinePage[] {
  return SEED_GUIDELINES.filter(g => g.phase === phase || g.phase === 'general');
}
