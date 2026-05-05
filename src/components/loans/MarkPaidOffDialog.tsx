import { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle2, AlertTriangle, Pencil, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v);

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  remainingPrincipal: number;
  accruedInterest: number;
  loanType: string;
  onConfirm: (params: {
    mode: 'log_payment' | 'silent';
    payoffDate: string;
    principal: number;
    interest: number;
    lateFee: number;
    notes: string;
  }) => Promise<void> | void;
}

export function MarkPaidOffDialog({
  open, onOpenChange, remainingPrincipal, accruedInterest, loanType, onConfirm,
}: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [payoffDate, setPayoffDate] = useState(today);
  const [principal, setPrincipal] = useState(Math.max(0, remainingPrincipal));
  const [interest, setInterest] = useState(Math.max(0, accruedInterest));
  const [lateFee, setLateFee] = useState(0);
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState<'log_payment' | 'silent'>('log_payment');
  const [editPrincipal, setEditPrincipal] = useState(false);
  const [editInterest, setEditInterest] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isAlreadyZero = remainingPrincipal <= 0.01 && accruedInterest <= 0.01;
  const total = useMemo(() => principal + interest + lateFee, [principal, interest, lateFee]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm({ mode, payoffDate, principal, interest, lateFee, notes });
      onOpenChange(false);
      // reset
      setPayoffDate(today); setLateFee(0); setNotes('');
      setEditPrincipal(false); setEditInterest(false); setMode('log_payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Mark Loan Paid Off
          </DialogTitle>
          <DialogDescription>
            {isAlreadyZero
              ? 'This loan is fully reconciled. Confirm to close it out.'
              : 'Reconcile the remaining balance and accrued interest so your records stay in sync.'}
          </DialogDescription>
        </DialogHeader>

        {!isAlreadyZero && (
          <>
            {/* Mode selector */}
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)} className="space-y-2">
              <label
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                  mode === 'log_payment' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
                )}
              >
                <RadioGroupItem value="log_payment" className="mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Log final payoff payment</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Records a payment for the remaining balance + interest. Recommended.
                  </div>
                </div>
              </label>
              <label
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                  mode === 'silent' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
                )}
              >
                <RadioGroupItem value="silent" className="mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Close without recording payment</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 flex-shrink-0" />
                    <span>Balance & interest won't appear in payment history. Use only if tracked elsewhere.</span>
                  </div>
                </div>
              </label>
            </RadioGroup>

            {mode === 'log_payment' && (
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-xs">Payoff Date</Label>
                  <Input
                    type="date"
                    value={payoffDate}
                    onChange={(e) => setPayoffDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Remaining Principal</Label>
                      <button
                        type="button"
                        onClick={() => setEditPrincipal(v => !v)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        {editPrincipal ? <Lock className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                      </button>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={principal}
                      onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)}
                      readOnly={!editPrincipal}
                      className={cn('mt-1', !editPrincipal && 'bg-muted/40')}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Accrued Interest</Label>
                      <button
                        type="button"
                        onClick={() => setEditInterest(v => !v)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        {editInterest ? <Lock className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                      </button>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={interest}
                      onChange={(e) => setInterest(parseFloat(e.target.value) || 0)}
                      readOnly={!editInterest}
                      className={cn('mt-1', !editInterest && 'bg-muted/40')}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Late Fee / Other (optional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={lateFee || ''}
                    onChange={(e) => setLateFee(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Notes (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Refinance proceeds, sale at closing…"
                    rows={2}
                    className="mt-1"
                  />
                </div>

                {/* Total */}
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center justify-between">
                  <span className="text-sm font-medium">Total Payoff</span>
                  <span className="text-xl font-bold text-primary">{fmt(total)}</span>
                </div>
              </div>
            )}
          </>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Saving…' : isAlreadyZero ? 'Confirm Paid Off' : mode === 'log_payment' ? `Pay ${fmt(total)} & Close` : 'Close Loan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
