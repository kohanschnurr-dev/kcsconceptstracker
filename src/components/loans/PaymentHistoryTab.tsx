import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Info, Sparkles, Pencil, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Loan, LoanPayment, LoanDraw } from '@/types/loans';
import { ACCRUES_INTEREST_TYPES, currentAccruedInterest, effectiveOutstandingBalance } from '@/types/loans';
import { isAutoPayment } from '@/lib/loanPayments';
import { formatDisplayDate, formatDateString, parseDateString } from '@/lib/dateUtils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const fmt = (v: number | null | undefined) =>
  v == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);

interface PaymentHistoryTabProps {
  payments: LoanPayment[];
  manualPayments?: LoanPayment[];
  loanId: string;
  loan?: Loan | null;
  draws?: LoanDraw[];
  extensions?: { extended_to: string }[];
  onAdd: (p: Omit<LoanPayment, 'id' | 'created_at'>) => void;
  onUpdate?: (id: string, p: Omit<LoanPayment, 'id' | 'created_at'>) => void;
  onDelete: (id: string) => void;
}

type Mode = 'single' | 'bulk';
type DateMode = 'recurring' | 'custom';
type Interval = 'monthly' | 'biweekly' | 'weekly';
type OverlapKind = 'none' | 'auto' | 'manual';
type OverlapAction = 'override' | 'skip';

interface BulkRow {
  key: string;            // stable react key
  date: string;           // YYYY-MM-DD
  amount: number;
  interest: number | null;
  principal: number | null;
  late_fee: number | null;
  notes: string | null;
  principalOnly: boolean;
  touchedSplit: boolean;
  adjusted: boolean;      // date got clamped (e.g. Feb 30 → Feb 28)
  overlap: OverlapKind;
  action: OverlapAction;  // only relevant when overlap === 'auto'
}

const emptyPayment = (loanId: string): Omit<LoanPayment, 'id' | 'created_at'> => ({
  loan_id: loanId,
  payment_date: formatDateString(new Date()),
  amount: 0,
  principal_portion: null,
  interest_portion: null,
  late_fee: null,
  notes: null,
});

/** Add N months keeping the same day, clamping to last day of target month. */
function addMonthsClamped(start: Date, months: number): { date: Date; adjusted: boolean } {
  const targetMonth = start.getMonth() + months;
  const targetYear = start.getFullYear() + Math.floor(targetMonth / 12);
  const monthIdx = ((targetMonth % 12) + 12) % 12;
  const desiredDay = start.getDate();
  const lastDayOfTarget = new Date(targetYear, monthIdx + 1, 0).getDate();
  const day = Math.min(desiredDay, lastDayOfTarget);
  return { date: new Date(targetYear, monthIdx, day), adjusted: day !== desiredDay };
}

function generateRecurringDates(
  startISO: string,
  count: number,
  interval: Interval,
): { date: string; adjusted: boolean }[] {
  if (!startISO || count <= 0) return [];
  const start = parseDateString(startISO);
  const out: { date: string; adjusted: boolean }[] = [];
  for (let i = 0; i < count; i++) {
    if (interval === 'monthly') {
      const { date, adjusted } = addMonthsClamped(start, i);
      out.push({ date: formatDateString(date), adjusted });
    } else {
      const days = interval === 'biweekly' ? 14 : 7;
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i * days);
      out.push({ date: formatDateString(d), adjusted: false });
    }
  }
  return out;
}

function classifyOverlap(date: string, payments: LoanPayment[]): OverlapKind {
  for (const p of payments) {
    if (p.payment_date !== date) continue;
    return isAutoPayment(p) ? 'auto' : 'manual';
  }
  return 'none';
}

function computeSplit(
  amount: number,
  lateFee: number,
  unpaidInterest: number,
  accrues: boolean,
  principalOnly: boolean,
) {
  const usable = Math.max(0, amount - lateFee);
  if (usable <= 0) return { interest: 0, principal: 0 };
  if (principalOnly) return { interest: 0, principal: Math.round(usable * 100) / 100 };
  const interest = accrues ? Math.min(unpaidInterest, usable) : 0;
  const principal = Math.max(0, usable - interest);
  return {
    interest: Math.round(interest * 100) / 100,
    principal: Math.round(principal * 100) / 100,
  };
}

export function PaymentHistoryTab({ payments, manualPayments, loanId, loan, draws = [], extensions = [], onAdd, onDelete }: PaymentHistoryTabProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('single');

  // ── Single-payment state ─────────────────────────────────────────
  const [form, setForm] = useState(() => emptyPayment(loanId));
  const [touched, setTouched] = useState<{ principal: boolean; interest: boolean }>({ principal: false, interest: false });
  const [principalOnly, setPrincipalOnly] = useState(false);

  // ── Bulk state ──────────────────────────────────────────────────
  const [dateMode, setDateMode] = useState<DateMode>('recurring');
  const [bulkStart, setBulkStart] = useState(() => formatDateString(new Date()));
  const [bulkCount, setBulkCount] = useState(3);
  const [bulkInterval, setBulkInterval] = useState<Interval>('monthly');
  const [customDates, setCustomDates] = useState<string[]>([formatDateString(new Date())]);
  const [defAmount, setDefAmount] = useState<number>(0);
  const [defLateFee, setDefLateFee] = useState<number>(0);
  const [defPrincipalOnly, setDefPrincipalOnly] = useState(false);
  const [defNotes, setDefNotes] = useState('');
  const [rows, setRows] = useState<BulkRow[]>([]);
  // Track which rows have been hand-edited so regenerating defaults doesn't clobber them.
  const [rowOverrides, setRowOverrides] = useState<Record<string, Partial<BulkRow>>>({});

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const totalPrincipal = payments.reduce((s, p) => {
    if (p.principal_portion != null) return s + p.principal_portion;
    return s + Math.max(0, (p.amount ?? 0) - (p.interest_portion ?? 0) - (p.late_fee ?? 0));
  }, 0);
  const totalInterest = payments.reduce((s, p) => s + (p.interest_portion ?? 0), 0);

  const unpaidInterest = useMemo(() => {
    if (!loan) return 0;
    return Math.round(currentAccruedInterest(loan, payments, draws, extensions) * 100) / 100;
  }, [loan, payments, draws, extensions]);
  const remainingPrincipal = useMemo(() => {
    if (!loan) return 0;
    return Math.round(effectiveOutstandingBalance(loan, payments) * 100) / 100;
  }, [loan, payments]);
  const accruesUnpaidInterest = loan ? ACCRUES_INTEREST_TYPES.includes(loan.loan_type as any) : false;

  // Auto-fill the SINGLE-mode split whenever Amount changes (and the user hasn't overridden).
  useEffect(() => {
    if (!open || mode !== 'single') return;
    const amount = form.amount ?? 0;
    const lateFee = form.late_fee ?? 0;
    const usable = Math.max(0, amount - lateFee);
    if (usable <= 0) return;

    if (principalOnly) {
      setForm(f => ({
        ...f,
        interest_portion: 0,
        principal_portion: Math.round(usable * 100) / 100,
      }));
      return;
    }

    const suggestedInterest = accruesUnpaidInterest
      ? Math.min(unpaidInterest, usable)
      : 0;
    const suggestedPrincipal = Math.max(0, usable - suggestedInterest);

    setForm(f => ({
      ...f,
      interest_portion: touched.interest ? f.interest_portion : (suggestedInterest > 0 ? Math.round(suggestedInterest * 100) / 100 : null),
      principal_portion: touched.principal ? f.principal_portion : Math.round(suggestedPrincipal * 100) / 100,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.amount, form.late_fee, open, unpaidInterest, accruesUnpaidInterest, principalOnly, mode]);

  // ── Bulk: regenerate rows whenever date inputs OR defaults change ───
  useEffect(() => {
    if (!open || mode !== 'bulk') return;

    const dates: { date: string; adjusted: boolean }[] =
      dateMode === 'recurring'
        ? generateRecurringDates(bulkStart, bulkCount, bulkInterval)
        : customDates.filter(Boolean).map(d => ({ date: d, adjusted: false }));

    if (dates.length === 0) {
      setRows([]);
      return;
    }

    // Walk dates chronologically simulating remaining principal & accrued
    // interest after each prior bulk row, so the suggested split is realistic
    // for sequential payments.
    // Apply per-row date overrides FIRST (by index), then sort. This way
    // editing a row's date in the preview survives regeneration.
    const withOverrides = dates.map((d, idx) => {
      const key = `row-${idx}`;
      const ov = rowOverrides[key] as (Partial<BulkRow> & { date?: string }) | undefined;
      const date = ov?.date ?? d.date;
      const adjusted = ov?.date ? false : d.adjusted;
      return { date, adjusted, key };
    });
    const sorted = [...withOverrides].sort((a, b) => a.date.localeCompare(b.date));
    const prior: LoanPayment[] = [...payments.filter(p => !isAutoPayment(p))];

    const built: BulkRow[] = sorted.map((d) => {
      const key = d.key;
      const overlap = classifyOverlap(d.date, payments);
      const ov = rowOverrides[key];

      const amount = ov?.amount ?? defAmount;
      const lateFee = ov?.late_fee ?? defLateFee;
      const principalOnlyRow = ov?.principalOnly ?? defPrincipalOnly;

      // Compute split using the simulated remaining state for THIS row.
      let suggested: { interest: number; principal: number } = { interest: 0, principal: 0 };
      if (loan && amount > 0) {
        const acc = currentAccruedInterest(loan, prior, draws, extensions);
        suggested = computeSplit(amount, lateFee, acc, accruesUnpaidInterest, principalOnlyRow);
      }

      const interest = ov?.touchedSplit ? (ov.interest ?? suggested.interest) : suggested.interest;
      const principal = ov?.touchedSplit ? (ov.principal ?? suggested.principal) : suggested.principal;

      // Push this row into the simulated prior ledger so the next row sees it.
      if (amount > 0 && overlap !== 'manual') {
        prior.push({
          id: `bulk-sim-${key}`,
          loan_id: loanId,
          payment_date: d.date,
          amount,
          principal_portion: principal,
          interest_portion: interest,
          late_fee: lateFee || null,
          notes: null,
          created_at: d.date,
        });
      }

      return {
        key,
        date: d.date,
        amount,
        interest,
        principal,
        late_fee: lateFee || null,
        notes: ov?.notes ?? (defNotes || null),
        principalOnly: principalOnlyRow,
        touchedSplit: ov?.touchedSplit ?? false,
        adjusted: d.adjusted,
        overlap,
        action: ov?.action ?? 'override',
      };
    });

    setRows(built);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, dateMode, bulkStart, bulkCount, bulkInterval, customDates, defAmount, defLateFee, defPrincipalOnly, defNotes, payments, rowOverrides]);

  const splitTotal = (form.principal_portion ?? 0) + (form.interest_portion ?? 0) + (form.late_fee ?? 0);
  const splitDelta = Math.round((splitTotal - (form.amount ?? 0)) * 100) / 100;
  const splitMatches = principalOnly ? true : Math.abs(splitDelta) < 0.01;

  // ── Single-payment submit
  const handleSubmit = () => {
    if (!form.amount || !splitMatches) return;
    onAdd(form);
    resetAll();
    setOpen(false);
  };

  // ── Bulk submit
  const includedRows = rows.filter(r => !(r.overlap === 'auto' && r.action === 'skip') && r.overlap !== 'manual');

  const bulkValid = includedRows.length > 0 && includedRows.every(r => {
    if (!r.amount || r.amount <= 0) return false;
    if (r.principalOnly) return true;
    const sum = (r.principal ?? 0) + (r.interest ?? 0) + (r.late_fee ?? 0);
    return Math.abs(sum - r.amount) < 0.01;
  });

  const handleBulkSubmit = () => {
    if (!bulkValid) return;
    let added = 0;
    for (const r of includedRows) {
      onAdd({
        loan_id: loanId,
        payment_date: r.date,
        amount: r.amount,
        principal_portion: r.principal,
        interest_portion: r.interest,
        late_fee: r.late_fee,
        notes: r.notes,
      });
      added++;
    }
    toast.success(`Logged ${added} payment${added === 1 ? '' : 's'}`);
    resetAll();
    setOpen(false);
  };

  const resetAll = () => {
    setForm(emptyPayment(loanId));
    setTouched({ principal: false, interest: false });
    setPrincipalOnly(false);
    setMode('single');
    setDateMode('recurring');
    setBulkStart(formatDateString(new Date()));
    setBulkCount(3);
    setBulkInterval('monthly');
    setCustomDates([formatDateString(new Date())]);
    setDefAmount(0);
    setDefLateFee(0);
    setDefPrincipalOnly(false);
    setDefNotes('');
    setRows([]);
    setRowOverrides({});
  };

  const handleOpenChange = (v: boolean) => {
    // Bulk mode with edits → ignore accidental backdrop/Escape (multi-step rule).
    if (!v && mode === 'bulk' && (Object.keys(rowOverrides).length > 0 || rows.length > 0 && defAmount > 0)) {
      // allow only via Cancel button which calls forceClose()
      return;
    }
    setOpen(v);
    if (!v) resetAll();
  };

  const forceClose = () => {
    setOpen(false);
    resetAll();
  };

  const set = (field: keyof typeof form, val: any) => setForm(f => ({ ...f, [field]: val }));

  const updateRow = (key: string, patch: Partial<BulkRow>) => {
    setRowOverrides(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const removeBulkRow = (key: string) => {
    // Remove from custom list if applicable
    const row = rows.find(r => r.key === key);
    if (!row) return;
    if (dateMode === 'custom') {
      setCustomDates(prev => prev.filter(d => d !== row.date));
    } else {
      // For recurring mode, decrement count and skip via override
      setRowOverrides(prev => ({ ...prev, [key]: { ...prev[key], action: 'skip' } }));
      // Better UX: actually drop it visually
      setRows(prev => prev.filter(r => r.key !== key));
    }
  };

  const handleOverride = (p: LoanPayment) => {
    setForm({
      loan_id: loanId,
      payment_date: p.payment_date,
      amount: p.amount ?? 0,
      principal_portion: p.principal_portion ?? null,
      interest_portion: p.interest_portion ?? null,
      late_fee: p.late_fee ?? null,
      notes: p.notes ?? null,
    });
    setTouched({ principal: true, interest: true });
    setMode('single');
    setOpen(true);
  };

  const hasAutoRows = payments.some(isAutoPayment);

  // Bulk totals
  const bulkTotals = useMemo(() => {
    return includedRows.reduce(
      (acc, r) => ({
        amount: acc.amount + (r.amount || 0),
        interest: acc.interest + (r.interest || 0),
        principal: acc.principal + (r.principal || 0),
        lateFee: acc.lateFee + (r.late_fee || 0),
      }),
      { amount: 0, interest: 0, principal: 0, lateFee: 0 },
    );
  }, [includedRows]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-4 text-sm flex-wrap items-center">
          <span className="text-muted-foreground">Total Paid: <span className="font-semibold text-foreground">{fmt(totalPaid)}</span></span>
          <span className="text-muted-foreground">Principal: <span className="font-semibold text-foreground">{fmt(totalPrincipal)}</span></span>
          <span className="text-muted-foreground">Interest: <span className="font-semibold text-foreground">{fmt(totalInterest)}</span></span>
          {loan && payments.length > 0 && (
            <span className="text-muted-foreground">Remaining: <span className="font-semibold text-warning">{fmt(remainingPrincipal)}</span></span>
          )}
          {hasAutoRows && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-[10px] gap-1 cursor-help">
                  <Sparkles className="h-3 w-3" /> Auto-tracking
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Monthly payments are auto-derived from the amortization schedule.
                  Use Override to record an actual payment that differs (extra principal, late fee, etc.).
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <Button size="sm" onClick={() => { setMode('single'); setOpen(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Log Payment
        </Button>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No payments yet.</p>
          <p className="text-xs mt-1">Auto-tracking will begin on the first scheduled payment date.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Principal</TableHead>
                <TableHead className="text-right">Interest</TableHead>
                <TableHead className="text-right">Late Fee</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map(p => {
                const principalDisplay = p.principal_portion != null
                  ? p.principal_portion
                  : Math.max(0, (p.amount ?? 0) - (p.interest_portion ?? 0) - (p.late_fee ?? 0));
                const isAuto = isAutoPayment(p);
                return (
                  <TableRow key={p.id} className={isAuto ? 'opacity-80' : undefined}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <span>{formatDisplayDate(p.payment_date)}</span>
                        {isAuto && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-1 font-normal">
                            <Sparkles className="h-2.5 w-2.5" /> Auto
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{fmt(p.amount)}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(principalDisplay)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{fmt(p.interest_portion)}</TableCell>
                    <TableCell className="text-right text-sm text-destructive">{fmt(p.late_fee)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-32 truncate">{p.notes ?? '—'}</TableCell>
                    <TableCell>
                      {isAuto ? (
                        <button
                          onClick={() => handleOverride(p)}
                          className="text-muted-foreground hover:text-primary"
                          title="Override this auto-payment with actual values"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : (
                        <button onClick={() => onDelete(p.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(mode === 'bulk' ? 'max-w-4xl' : 'max-w-md')}
          onInteractOutside={(e) => { if (mode === 'bulk') e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (mode === 'bulk') e.preventDefault(); }}
        >
          <DialogHeader>
            <DialogTitle>Log Payment{mode === 'bulk' ? 's' : ''}</DialogTitle>
          </DialogHeader>

          {/* Mode switcher */}
          <div className="inline-flex rounded-md border border-border p-0.5 bg-secondary/30 self-start">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-sm transition-colors',
                mode === 'single' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Single
            </button>
            <button
              type="button"
              onClick={() => setMode('bulk')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-sm transition-colors',
                mode === 'bulk' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Bulk
            </button>
          </div>

          {mode === 'single' ? (
            <div className="space-y-4">
              {loan && (
                <div className="rounded-md border border-border bg-secondary/30 p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current balance</span>
                    <span className="font-medium">{fmt(remainingPrincipal)}</span>
                  </div>
                  {accruesUnpaidInterest && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Accrued interest owed</span>
                      <span className="font-medium text-warning">{fmt(unpaidInterest)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date</Label>
                  <Input className="mt-1" type="date" value={form.payment_date} onChange={e => set('payment_date', e.target.value)} />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input className="mt-1" type="number" step="0.01" value={form.amount || ''} onChange={e => {
                    set('amount', parseFloat(e.target.value) || 0);
                    setTouched({ principal: false, interest: false });
                  }} />
                </div>
                <div className="col-span-2 flex items-center gap-2 rounded-md border border-border bg-secondary/30 px-3 py-2">
                  <Checkbox
                    id="principal-only"
                    checked={principalOnly}
                    onCheckedChange={(v) => {
                      const checked = v === true;
                      setPrincipalOnly(checked);
                      if (checked) {
                        const usable = Math.max(0, (form.amount ?? 0) - (form.late_fee ?? 0));
                        setForm(f => ({
                          ...f,
                          interest_portion: 0,
                          principal_portion: Math.round(usable * 100) / 100,
                        }));
                        setTouched({ principal: true, interest: true });
                      } else {
                        setTouched({ principal: false, interest: false });
                      }
                    }}
                  />
                  <Label htmlFor="principal-only" className="text-sm cursor-pointer">
                    Apply entire payment to principal (skip interest)
                  </Label>
                </div>
                <div>
                  <Label>Interest Portion</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    step="0.01"
                    disabled={principalOnly}
                    value={form.interest_portion ?? ''}
                    onChange={e => {
                      set('interest_portion', e.target.value === '' ? null : parseFloat(e.target.value));
                      setTouched(t => ({ ...t, interest: true }));
                    }}
                  />
                </div>
                <div>
                  <Label>Principal Portion</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    step="0.01"
                    disabled={principalOnly}
                    value={form.principal_portion ?? ''}
                    onChange={e => {
                      set('principal_portion', e.target.value === '' ? null : parseFloat(e.target.value));
                      setTouched(t => ({ ...t, principal: true }));
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Late Fee <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input className="mt-1" type="number" step="0.01" value={form.late_fee ?? ''} onChange={e => set('late_fee', e.target.value === '' ? null : parseFloat(e.target.value))} />
                </div>
              </div>

              {!principalOnly && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>Interest is applied first, the rest pays down principal. Edit either field to override.</span>
                </div>
              )}

              {!principalOnly && form.amount > 0 && !splitMatches && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                  Split doesn't match amount — off by {fmt(Math.abs(splitDelta))}.
                </div>
              )}

              <div>
                <Label>Notes</Label>
                <Textarea className="mt-1" rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={forceClose}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={!form.amount || !splitMatches}>Log Payment</Button>
              </DialogFooter>
            </div>
          ) : (
            // ── BULK MODE ────────────────────────────────────────
            <div className="space-y-4">
              {/* Date entry */}
              <div className="rounded-md border border-border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Dates</Label>
                  <div className="inline-flex rounded-md border border-border p-0.5 bg-secondary/30">
                    <button
                      type="button"
                      onClick={() => setDateMode('recurring')}
                      className={cn(
                        'px-2.5 py-1 text-xs font-medium rounded-sm transition-colors',
                        dateMode === 'recurring' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      Repeat
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateMode('custom')}
                      className={cn(
                        'px-2.5 py-1 text-xs font-medium rounded-sm transition-colors',
                        dateMode === 'custom' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      Pick dates
                    </button>
                  </div>
                </div>

                {dateMode === 'recurring' ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Start date</Label>
                      <Input className="mt-1" type="date" value={bulkStart} onChange={e => setBulkStart(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs"># of payments</Label>
                      <Input
                        className="mt-1"
                        type="number"
                        min={1}
                        max={36}
                        value={bulkCount}
                        onChange={e => setBulkCount(Math.max(1, Math.min(36, parseInt(e.target.value) || 1)))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Interval</Label>
                      <Select value={bulkInterval} onValueChange={(v) => setBulkInterval(v as Interval)}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customDates.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={d}
                          onChange={e => setCustomDates(prev => prev.map((x, idx) => idx === i ? e.target.value : x))}
                        />
                        <button
                          type="button"
                          onClick={() => setCustomDates(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-muted-foreground hover:text-destructive p-1"
                          disabled={customDates.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomDates(prev => [...prev, formatDateString(new Date())])}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add date
                    </Button>
                  </div>
                )}
              </div>

              {/* Defaults */}
              <div className="rounded-md border border-border p-3 space-y-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Defaults (applied to every row)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Amount</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      step="0.01"
                      value={defAmount || ''}
                      onChange={e => setDefAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Late Fee</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      step="0.01"
                      value={defLateFee || ''}
                      onChange={e => setDefLateFee(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="bulk-principal-only"
                    checked={defPrincipalOnly}
                    onCheckedChange={(v) => setDefPrincipalOnly(v === true)}
                  />
                  <Label htmlFor="bulk-principal-only" className="text-sm cursor-pointer">
                    Apply each payment entirely to principal (skip interest)
                  </Label>
                </div>
                <div>
                  <Label className="text-xs">Notes (optional)</Label>
                  <Input
                    className="mt-1"
                    value={defNotes}
                    onChange={e => setDefNotes(e.target.value)}
                    placeholder="e.g. Catching up on missed monthly payments"
                  />
                </div>
              </div>

              {/* Preview table */}
              {rows.length > 0 && (
                <div className="rounded-md border border-border overflow-hidden">
                  <div className="max-h-72 overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-32">Date</TableHead>
                          <TableHead className="text-right w-28">Amount</TableHead>
                          <TableHead className="text-right w-28">Interest</TableHead>
                          <TableHead className="text-right w-28">Principal</TableHead>
                          <TableHead className="text-right w-24">Late Fee</TableHead>
                          <TableHead className="w-40">Status</TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map(r => {
                          const splitMismatch = !r.principalOnly && Math.abs((r.principal ?? 0) + (r.interest ?? 0) + (r.late_fee ?? 0) - r.amount) >= 0.01;
                          const skipped = r.overlap === 'auto' && r.action === 'skip';
                          const blocked = r.overlap === 'manual';
                          return (
                            <TableRow
                              key={r.key}
                              className={cn(
                                (skipped || blocked) && 'opacity-50',
                                blocked && 'bg-destructive/5',
                              )}
                            >
                              <TableCell className="text-xs">
                                <div className="flex flex-col gap-1">
                                  <Input
                                    type="date"
                                    className="h-8 text-xs w-[140px]"
                                    disabled={blocked || skipped}
                                    value={r.date}
                                    onChange={e => {
                                      const newDate = e.target.value;
                                      if (newDate) updateRow(r.key, { date: newDate } as Partial<BulkRow>);
                                    }}
                                  />
                                  {r.adjusted && (
                                    <span className="text-[9px] text-warning flex items-center gap-1">
                                      <AlertTriangle className="h-2.5 w-2.5" /> adjusted
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Input
                                  className="h-8 text-right text-xs"
                                  type="number"
                                  step="0.01"
                                  disabled={blocked || skipped}
                                  value={r.amount || ''}
                                  onChange={e => {
                                    const amt = parseFloat(e.target.value) || 0;
                                    updateRow(r.key, { amount: amt, touchedSplit: false });
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  className={cn('h-8 text-right text-xs', splitMismatch && 'border-destructive')}
                                  type="number"
                                  step="0.01"
                                  disabled={blocked || skipped || r.principalOnly}
                                  value={r.interest ?? ''}
                                  onChange={e => updateRow(r.key, {
                                    interest: e.target.value === '' ? 0 : parseFloat(e.target.value),
                                    touchedSplit: true,
                                  })}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  className={cn('h-8 text-right text-xs', splitMismatch && 'border-destructive')}
                                  type="number"
                                  step="0.01"
                                  disabled={blocked || skipped || r.principalOnly}
                                  value={r.principal ?? ''}
                                  onChange={e => updateRow(r.key, {
                                    principal: e.target.value === '' ? 0 : parseFloat(e.target.value),
                                    touchedSplit: true,
                                  })}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  className="h-8 text-right text-xs"
                                  type="number"
                                  step="0.01"
                                  disabled={blocked || skipped}
                                  value={r.late_fee ?? ''}
                                  onChange={e => updateRow(r.key, {
                                    late_fee: e.target.value === '' ? null : parseFloat(e.target.value),
                                  })}
                                />
                              </TableCell>
                              <TableCell>
                                {blocked ? (
                                  <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/40">
                                    Duplicate — exists
                                  </Badge>
                                ) : r.overlap === 'auto' ? (
                                  <Select
                                    value={r.action}
                                    onValueChange={(v) => updateRow(r.key, { action: v as OverlapAction })}
                                  >
                                    <SelectTrigger className="h-7 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="override" className="text-xs">Override auto</SelectItem>
                                      <SelectItem value="skip" className="text-xs">Skip this date</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge variant="outline" className="text-[10px]">New</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <button
                                  type="button"
                                  onClick={() => removeBulkRow(r.key)}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Totals footer */}
                  <div className="flex items-center justify-between gap-4 px-3 py-2 border-t border-border bg-secondary/20 text-xs">
                    <span className="text-muted-foreground">
                      <span className="font-semibold text-foreground">{includedRows.length}</span> of {rows.length} payment{rows.length === 1 ? '' : 's'} will be logged
                    </span>
                    <div className="flex gap-4">
                      <span className="text-muted-foreground">Amount: <span className="font-semibold text-foreground">{fmt(bulkTotals.amount)}</span></span>
                      <span className="text-muted-foreground">Interest: <span className="font-semibold text-foreground">{fmt(bulkTotals.interest)}</span></span>
                      <span className="text-muted-foreground">Principal: <span className="font-semibold text-foreground">{fmt(bulkTotals.principal)}</span></span>
                    </div>
                  </div>
                </div>
              )}

              {rows.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-6 border border-dashed border-border rounded-md">
                  Set a default amount above to preview your payments.
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={forceClose}>Cancel</Button>
                <Button onClick={handleBulkSubmit} disabled={!bulkValid}>
                  Log {includedRows.length || ''} Payment{includedRows.length === 1 ? '' : 's'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
