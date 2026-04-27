import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Info, Sparkles, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Loan, LoanPayment, LoanDraw } from '@/types/loans';
import { ACCRUES_INTEREST_TYPES, currentAccruedInterest, effectiveOutstandingBalance } from '@/types/loans';
import { isAutoPayment } from '@/lib/loanPayments';
import { formatDisplayDate } from '@/lib/dateUtils';

const fmt = (v: number | null | undefined) =>
  v == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);

interface PaymentHistoryTabProps {
  /** Effective payments (manual + auto-derived for amortizing loans) */
  payments: LoanPayment[];
  /** Just the real, manually-logged payments (used for split suggestions) */
  manualPayments?: LoanPayment[];
  loanId: string;
  loan?: Loan | null;
  draws?: LoanDraw[];
  extensions?: { extended_to: string }[];
  onAdd: (p: Omit<LoanPayment, 'id' | 'created_at'>) => void;
  onDelete: (id: string) => void;
}

const emptyPayment = (loanId: string): Omit<LoanPayment, 'id' | 'created_at'> => ({
  loan_id: loanId,
  payment_date: new Date().toISOString().split('T')[0],
  amount: 0,
  principal_portion: null,
  interest_portion: null,
  late_fee: null,
  notes: null,
});

export function PaymentHistoryTab({ payments, manualPayments, loanId, loan, draws = [], extensions = [], onAdd, onDelete }: PaymentHistoryTabProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => emptyPayment(loanId));
  // Track which fields the user has manually overridden so we don't fight them.
  const [touched, setTouched] = useState<{ principal: boolean; interest: boolean }>({ principal: false, interest: false });

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const totalPrincipal = payments.reduce((s, p) => {
    if (p.principal_portion != null) return s + p.principal_portion;
    return s + Math.max(0, (p.amount ?? 0) - (p.interest_portion ?? 0) - (p.late_fee ?? 0));
  }, 0);
  const totalInterest = payments.reduce((s, p) => s + (p.interest_portion ?? 0), 0);

  // Live snapshot of what the loan owes right now — used to suggest the split.
  // Reads the same chronological ledger that powers the Interest Schedule tab,
  // the loan table, and the summary tile, so all four numbers agree.
  const unpaidInterest = useMemo(() => {
    if (!loan) return 0;
    return Math.round(currentAccruedInterest(loan, payments, draws, extensions) * 100) / 100;
  }, [loan, payments, draws, extensions]);
  const remainingPrincipal = useMemo(() => {
    if (!loan) return 0;
    return Math.round(effectiveOutstandingBalance(loan, payments) * 100) / 100;
  }, [loan, payments]);
  const accruesUnpaidInterest = loan ? ACCRUES_INTEREST_TYPES.includes(loan.loan_type as any) : false;

  // Auto-fill the split whenever Amount changes (and the user hasn't overridden).
  useEffect(() => {
    if (!open) return;
    const amount = form.amount ?? 0;
    const lateFee = form.late_fee ?? 0;
    const usable = Math.max(0, amount - lateFee);
    if (usable <= 0) return;

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
  }, [form.amount, form.late_fee, open, unpaidInterest, accruesUnpaidInterest]);

  const splitTotal = (form.principal_portion ?? 0) + (form.interest_portion ?? 0) + (form.late_fee ?? 0);
  const splitDelta = Math.round((splitTotal - (form.amount ?? 0)) * 100) / 100;
  const splitMatches = Math.abs(splitDelta) < 0.01;

  const handleSubmit = () => {
    if (!form.amount || !splitMatches) return;
    onAdd(form);
    setOpen(false);
    setForm(emptyPayment(loanId));
    setTouched({ principal: false, interest: false });
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      setForm(emptyPayment(loanId));
      setTouched({ principal: false, interest: false });
    }
  };

  const set = (field: keyof typeof form, val: any) => setForm(f => ({ ...f, [field]: val }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-4 text-sm flex-wrap">
          <span className="text-muted-foreground">Total Paid: <span className="font-semibold text-foreground">{fmt(totalPaid)}</span></span>
          <span className="text-muted-foreground">Principal: <span className="font-semibold text-foreground">{fmt(totalPrincipal)}</span></span>
          <span className="text-muted-foreground">Interest: <span className="font-semibold text-foreground">{fmt(totalInterest)}</span></span>
          {loan && payments.length > 0 && (
            <span className="text-muted-foreground">Remaining: <span className="font-semibold text-warning">{fmt(remainingPrincipal)}</span></span>
          )}
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Log Payment
        </Button>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No payments logged yet.</p>
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
                return (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">{formatDisplayDate(p.payment_date)}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(p.amount)}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(principalDisplay)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{fmt(p.interest_portion)}</TableCell>
                    <TableCell className="text-right text-sm text-destructive">{fmt(p.late_fee)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-32 truncate">{p.notes ?? '—'}</TableCell>
                    <TableCell>
                      <button onClick={() => onDelete(p.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Payment</DialogTitle>
          </DialogHeader>
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
                  // Reset overrides so the split auto-suggests again.
                  setTouched({ principal: false, interest: false });
                }} />
              </div>
              <div>
                <Label>Interest Portion</Label>
                <Input
                  className="mt-1"
                  type="number"
                  step="0.01"
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

            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>Interest is applied first, the rest pays down principal. Edit either field to override.</span>
            </div>

            {form.amount > 0 && !splitMatches && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                Split doesn't match amount — off by {fmt(Math.abs(splitDelta))}.
              </div>
            )}

            <div>
              <Label>Notes</Label>
              <Textarea className="mt-1" rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.amount || !splitMatches}>Log Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
