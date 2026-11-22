import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  detectDuplicates, detectReceiptChargePairs, pairKey, qbBase, topFlag, findLikelyDuplicates,
  type DupFlag, type DupRecord, type PairFlag,
} from '@/lib/duplicateDetection';

const REFRESH_EVENT = 'duplicates:refresh';
export const refreshDuplicateFlags = () => window.dispatchEvent(new Event(REFRESH_EVENT));

async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>) {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(from, from + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export const expenseKey = (e: { id: string; source?: string; qb_id?: string | null }) =>
  e.source === 'quickbooks' && e.qb_id ? `qb:${qbBase(e.qb_id)}` : `exp:${e.id}`;
export const qbKey = (qb: { qb_id: string }) => `qb:${qbBase(qb.qb_id)}`;
export const businessKey = (b: { id: string }) => `biz:${b.id}`;
export const receiptKey = (r: { id: string }) => `rcpt:${r.id}`;

export const OPEN_PAIR_EVENT = 'smartsplit:open-pair';
export interface OpenPairDetail { receiptId: string; qbBase: string; handled?: boolean }
export const openReceiptPair = (receiptId: string, qbBase: string) => {
  const detail: OpenPairDetail = { receiptId, qbBase };
  window.dispatchEvent(new CustomEvent(OPEN_PAIR_EVENT, { detail }));
  return !!detail.handled;
};

export async function loadDuplicateRecords(): Promise<{ records: DupRecord[]; dismissed: Set<string> }> {
  const [projects, expenses, qb, biz, dism, rcpts, rItems] = await Promise.all([
    fetchAll<any>((a, b) => supabase.from('projects').select('id, name, deleted_at').range(a, b)),
    fetchAll<any>((a, b) => supabase.from('expenses').select('id, project_id, amount, date, vendor_name, description, qb_expense_id, is_hidden').range(a, b)),
    fetchAll<any>((a, b) => supabase.from('quickbooks_expenses').select('id, qb_id, project_id, amount, original_amount, date, vendor_name, description, is_imported, is_hidden').range(a, b)),
    fetchAll<any>((a, b) => supabase.from('business_expenses').select('id, amount, date, vendor_name, description').range(a, b)),
    fetchAll<any>((a, b) => supabase.from('duplicate_dismissals').select('record_a, record_b').range(a, b)),
    fetchAll<any>((a, b) => supabase.from('pending_receipts').select('id, vendor_name, total_amount, purchase_date').eq('status', 'pending').range(a, b)),
    fetchAll<any>((a, b) => supabase.from('receipt_line_items').select('receipt_id').range(a, b)),
  ]);
  const live = new Map(projects.filter(p => !p.deleted_at).map(p => [p.id, p.name as string]));
  const records: DupRecord[] = [];

  // Project expense rows created from a QuickBooks charge are the same charge: skip the QuickBooks copy
  const linkedQb = new Set(expenses.map(e => e.qb_expense_id).filter(Boolean));
  for (const e of expenses) {
    if (e.is_hidden || !live.has(e.project_id)) continue;
    records.push({
      key: expenseKey(e), source: 'expense', amount: Number(e.amount), date: e.date,
      vendor: e.vendor_name, description: e.description, location: live.get(e.project_id)!, ids: [e.id],
    });
  }
  // QuickBooks rows: group category splits into one charge
  const groups = new Map<string, any[]>();
  for (const q of qb) {
    if (q.is_hidden || linkedQb.has(q.id)) continue;
    const isPending = !q.is_imported && !q.project_id;
    const isProject = q.project_id && live.has(q.project_id);
    if (!isPending && !isProject) continue;
    const k = `${isPending ? 'p' : 'i'}|${qbBase(q.qb_id)}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(q);
  }
  for (const [k, rows] of groups) {
    const pending = k.startsWith('p|');
    const first = rows[0];
    const amount = first.original_amount != null ? Number(first.original_amount) : rows.reduce((s, r) => s + Number(r.amount), 0);
    records.push({
      key: qbKey(first), source: pending ? 'qb_pending' : 'qb_project', amount, date: first.date,
      vendor: first.vendor_name, description: first.description,
      location: pending ? 'Pending' : live.get(first.project_id) || 'Project', ids: rows.map(r => r.id),
    });
  }
  for (const b of biz) {
    records.push({
      key: businessKey(b), source: 'business', amount: Number(b.amount), date: b.date,
      vendor: b.vendor_name, description: b.description, location: 'KCS Concepts', ids: [b.id],
    });
  }
  const itemCounts = new Map<string, number>();
  for (const it of rItems) itemCounts.set(it.receipt_id, (itemCounts.get(it.receipt_id) || 0) + 1);
  for (const r of rcpts) {
    records.push({
      key: receiptKey(r), source: 'receipt', amount: Number(r.total_amount), date: r.purchase_date,
      vendor: r.vendor_name, description: null, location: 'Receipt queue', ids: [r.id], itemCount: itemCounts.get(r.id) || 0,
    });
  }
  const dismissed = new Set(dism.map(d => pairKey(d.record_a, d.record_b)));
  return { records, dismissed };
}

/** Warn before importing a pending charge that would create a likely duplicate. Returns true to proceed. */
export async function confirmNoLikelyDuplicate(qb: { qb_id: string; amount: number; date: string; description?: string | null }) {
  try {
    const { records } = await loadDuplicateRecords();
    const hits = findLikelyDuplicates({ key: qbKey(qb), amount: Number(qb.amount), date: qb.date, description: qb.description || null }, records);
    if (!hits.length) return true;
    const h = hits[0];
    return window.confirm(`This looks like a duplicate of $${h.amount.toFixed(2)} on ${h.date} already in ${h.location}. Import anyway?`);
  } catch {
    return true;
  }
}

export function useDuplicateFlags() {
  const [records, setRecords] = useState<DupRecord[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const r = await loadDuplicateRecords();
      setRecords(r.records);
      setDismissed(r.dismissed);
    } catch (e) {
      console.error('Duplicate check failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const h = () => void refresh();
    window.addEventListener(REFRESH_EVENT, h);
    return () => window.removeEventListener(REFRESH_EVENT, h);
  }, [refresh]);

  const flags = useMemo(() => detectDuplicates(records.filter(r => r.source !== 'receipt'), dismissed), [records, dismissed]);
  const pairs = useMemo(() => detectReceiptChargePairs(
    records.filter(r => r.source === 'receipt'),
    records.filter(r => r.source === 'qb_pending' || r.source === 'qb_project'),
    dismissed,
  ), [records, dismissed]);
  const pairFor = useCallback((key: string): PairFlag | undefined => pairs.get(key), [pairs]);
  const isFlagged = useCallback((key: string) => flags.has(key) || pairs.has(key), [flags, pairs]);
  const byKey = useMemo(() => new Map(records.map(r => [r.key, r])), [records]);

  const flagFor = useCallback((key: string): DupFlag | undefined => topFlag(flags.get(key)), [flags]);

  const countWhere = useCallback((pred: (r: DupRecord) => boolean) =>
    records.filter(r => pred(r) && (flags.has(r.key) || pairs.has(r.key))).length, [records, flags, pairs]);

  const dismiss = useCallback(async (key: string, otherKey: string) => {
    const [a, b] = key < otherKey ? [key, otherKey] : [otherKey, key];
    const { error } = await supabase.from('duplicate_dismissals').insert({ record_a: a, record_b: b });
    if (error && !String(error.message).includes('duplicate key')) throw error;
    refreshDuplicateFlags();
  }, []);

  const deleteRecord = useCallback(async (rec: DupRecord) => {
    if (rec.source === 'expense') {
      const { error } = await supabase.from('expenses').delete().in('id', rec.ids);
      if (error) throw error;
    } else if (rec.source === 'business') {
      const { error } = await supabase.from('business_expenses').delete().in('id', rec.ids);
      if (error) throw error;
    } else {
      // QuickBooks rows: hide instead of delete so the bank sync never re-creates them
      const { error } = await supabase.from('quickbooks_expenses')
        .update({ is_hidden: true, hidden_at: new Date().toISOString(), project_id: null, category_id: null })
        .in('id', rec.ids);
      if (error) throw error;
    }
    refreshDuplicateFlags();
  }, []);

  const removeFromPending = useCallback(async (rec: DupRecord) => {
    const { error } = await supabase.from('quickbooks_expenses').update({ is_imported: true }).in('id', rec.ids);
    if (error) throw error;
    refreshDuplicateFlags();
  }, []);

  return { loading, flags, pairs, byKey, flagFor, pairFor, isFlagged, countWhere, dismiss, deleteRecord, removeFromPending, refresh };
}

export type DuplicateFlagsApi = ReturnType<typeof useDuplicateFlags>;
