import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { LoanPayment } from '@/types/loans';
import { formatDisplayDate } from '@/lib/dateUtils';

const fmt = (v: number | null | undefined) =>
  v == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);

interface PaymentHistoryTabProps {
  payments: LoanPayment[];
  loanId: string;
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

export function PaymentHistoryTab({ payments, loanId, onAdd, onDelete }: PaymentHistoryTabProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => emptyPayment(loanId));

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const totalPrincipal = payments.reduce((s, p) => s + (p.principal_portion ?? 0), 0);
  const totalInterest = payments.reduce((s, p) => s + (p.interest_portion ?? 0), 0);

  const handleSubmit = () => {
    if (!form.amount) return;
    onAdd(form);
    setOpen(false);
    setForm(emptyPayment(loanId));
  };

  const set = (field: keyof typeof form, val: any) => setForm(f => ({ ...f, [field]: val }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">Total Paid: <span className="font-semibold text-foreground">{fmt(totalPaid)}</span></span>
          <span className="text-muted-foreground">Principal: <span className="font-semibold text-foreground">{fmt(totalPrincipal)}</span></span>
          <span className="text-muted-foreground">Interest: <span className="font-semibold text-foreground">{fmt(totalInterest)}</span></span>
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
              {payments.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm">{formatDisplayDate(p.payment_date)}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(p.amount)}</TableCell>
                  <TableCell className="text-right text-sm">{fmt(p.principal_portion)}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{fmt(p.interest_portion)}</TableCell>
                  <TableCell className="text-right text-sm text-destructive">{fmt(p.late_fee)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-32 truncate">{p.notes ?? '—'}</TableCell>
                  <TableCell>
                    <button onClick={() => onDelete(p.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input className="mt-1" type="date" value={form.payment_date} onChange={e => set('payment_date', e.target.value)} />
              </div>
              <div>
                <Label>Amount</Label>
                <Input className="mt-1" type="number" step="0.01" value={form.amount || ''} onChange={e => set('amount', parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Principal Portion <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input className="mt-1" type="number" step="0.01" value={form.principal_portion ?? ''} onChange={e => set('principal_portion', parseFloat(e.target.value) || null)} />
              </div>
              <div>
                <Label>Interest Portion <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input className="mt-1" type="number" step="0.01" value={form.interest_portion ?? ''} onChange={e => set('interest_portion', parseFloat(e.target.value) || null)} />
              </div>
              <div>
                <Label>Late Fee <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input className="mt-1" type="number" step="0.01" value={form.late_fee ?? ''} onChange={e => set('late_fee', parseFloat(e.target.value) || null)} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea className="mt-1" rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.amount}>Log Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
