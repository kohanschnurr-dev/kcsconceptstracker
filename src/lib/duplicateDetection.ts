// Duplicate transaction detection across project expenses, KCS Concepts business
// expenses and pending QuickBooks charges. Pure functions — no database access.

export type DupSource = 'expense' | 'qb_project' | 'business' | 'qb_pending' | 'receipt';
export type DupLevel = 'high' | 'medium' | 'imported';

export interface DupRecord {
  key: string; // stable identity; QuickBooks rows use `qb:<base qb_id>` so split rows are one record
  source: DupSource;
  amount: number;
  date: string; // YYYY-MM-DD
  vendor: string | null;
  description: string | null;
  location: string; // project name or "KCS Concepts" or "Pending"
  ids: string[]; // underlying row ids (all split rows for QuickBooks)
  itemCount?: number; // receipts only
}

export interface DupFlag {
  level: DupLevel;
  other: DupRecord;
}

export const qbBase = (qbId: string) => String(qbId).split('_split_')[0];

export function normalizeVendor(name: string | null | undefined): string {
  if (!name) return '';
  let n = name.toLowerCase();
  if (/amazon|amzn/.test(n)) return 'amazon';
  if (/home\s*depot|homedepot/.test(n)) return 'home depot';
  if (/lowe/.test(n)) return 'lowes';
  if (/wal-?mart/.test(n)) return 'walmart';
  if (/menard/.test(n)) return 'menards';
  n = n.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return n.split(' ').slice(0, 2).join(' ');
}

const normDesc = (d: string | null | undefined) => (d || '').toLowerCase().replace(/\s+/g, ' ').trim();
const cents = (v: number) => Math.round(v * 100);
const dayNum = (d: string) => {
  const [y, m, day] = d.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, (m || 1) - 1, day || 1) / 86400000;
};

export const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export function detectDuplicates(records: DupRecord[], dismissed: Set<string> = new Set()) {
  const flags = new Map<string, DupFlag[]>();
  const add = (k: string, f: DupFlag) => {
    const list = flags.get(k) || [];
    if (!list.some(x => x.other.key === f.other.key)) list.push(f);
    flags.set(k, list);
  };
  const buckets = new Map<number, DupRecord[]>();
  for (const r of records) {
    if (!r.amount) continue;
    const c = cents(r.amount);
    if (!buckets.has(c)) buckets.set(c, []);
    buckets.get(c)!.push(r);
  }
  for (const group of buckets.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i], b = group[j];
        if (a.key === b.key) continue; // split rows of the same charge
        if (dismissed.has(pairKey(a.key, b.key))) continue;
        const sameDate = a.date.slice(0, 10) === b.date.slice(0, 10);
        const da = normDesc(a.description), db = normDesc(b.description);
        const high = sameDate && da !== '' && da === db;
        const va = normalizeVendor(a.vendor), vb = normalizeVendor(b.vendor);
        const medium = !high && va !== '' && va === vb && Math.abs(dayNum(a.date) - dayNum(b.date)) <= 3;
        if (!high && !medium) continue;
        const aPending = a.source === 'qb_pending', bPending = b.source === 'qb_pending';
        if (high && aPending !== bPending) {
          // pending charge already imported elsewhere
          const pending = aPending ? a : b, settled = aPending ? b : a;
          add(pending.key, { level: 'imported', other: settled });
          add(settled.key, { level: 'high', other: pending });
          continue;
        }
        const level: DupLevel = high ? 'high' : 'medium';
        add(a.key, { level, other: b });
        add(b.key, { level, other: a });
      }
    }
  }
  return flags;
}

/** Strongest flag for a record: imported > high > medium */
export function topFlag(list: DupFlag[] | undefined): DupFlag | undefined {
  if (!list?.length) return undefined;
  const rank: Record<DupLevel, number> = { imported: 3, high: 2, medium: 1 };
  return [...list].sort((x, y) => rank[y.level] - rank[x.level])[0];
}

/** Settled records that would be likely duplicates of a charge about to be imported. */
export function findLikelyDuplicates(candidate: Pick<DupRecord, 'key' | 'amount' | 'date' | 'description'>, settled: DupRecord[]) {
  const d = normDesc(candidate.description);
  return settled.filter(r =>
    r.key !== candidate.key &&
    r.source !== 'qb_pending' &&
    cents(r.amount) === cents(candidate.amount) &&
    r.date.slice(0, 10) === candidate.date.slice(0, 10) &&
    d !== '' && normDesc(r.description) === d);
}

// ---------- Pending/imported bank charge vs queued receipt pairing ----------

export type PairLevel = 'receipt_exact' | 'receipt_close';
export interface PairFlag {
  level: PairLevel;
  other: DupRecord;
}

/**
 * Pair queued receipts (source 'receipt') with bank charges (qb_pending / qb_project).
 * Exact: same cents + similar vendor; Close: same vendor, within $1.00 or 2%.
 * Receipt date must fall 2 days before to 7 days after the charge. Each receipt and
 * each charge gets at most one pair (exact first, then nearest date).
 */
export function detectReceiptChargePairs(receipts: DupRecord[], charges: DupRecord[], dismissed: Set<string> = new Set()) {
  const cands: { r: DupRecord; c: DupRecord; level: PairLevel; dist: number; diff: number }[] = [];
  for (const r of receipts) {
    const vr = normalizeVendor(r.vendor);
    if (!vr || !r.amount) continue;
    for (const c of charges) {
      if (c.source !== 'qb_pending' && c.source !== 'qb_project') continue;
      if (normalizeVendor(c.vendor) !== vr) continue;
      if (dismissed.has(pairKey(r.key, c.key))) continue;
      const delta = dayNum(r.date) - dayNum(c.date);
      if (delta < -2 || delta > 7) continue;
      const diff = Math.abs(cents(r.amount) - cents(c.amount));
      const level: PairLevel | null = diff === 0 ? 'receipt_exact'
        : diff <= Math.max(100, Math.round(Math.abs(c.amount) * 2)) ? 'receipt_close' : null; // 2% of dollars in cents = amount*2
      if (!level) continue;
      cands.push({ r, c, level, dist: Math.abs(delta), diff });
    }
  }
  cands.sort((a, b) => (a.level === b.level ? 0 : a.level === 'receipt_exact' ? -1 : 1) || a.diff - b.diff || a.dist - b.dist
    || (a.c.source === b.c.source ? 0 : a.c.source === 'qb_pending' ? -1 : 1));
  const pairs = new Map<string, PairFlag>();
  for (const x of cands) {
    if (pairs.has(x.r.key) || pairs.has(x.c.key)) continue;
    pairs.set(x.r.key, { level: x.level, other: x.c });
    pairs.set(x.c.key, { level: x.level, other: x.r });
  }
  return pairs;
}
