import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Landmark, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface LoanExpenseInfo {
  expenseId: string;
  amount: number;
  date: string;
  projectId: string;
  vendorName?: string;
  description?: string;
}

interface LinkedLoan {
  id: string;
  lender_name: string;
  nickname: string | null;
  monthly_payment: number | null;
  original_amount: number;
  interest_rate: number;
  status: string;
  interest_calc_method: string;
}

interface LoanPaymentAssignDialogProps {
  expense: LoanExpenseInfo | null;
  onClose: () => void;
}

export function LoanPaymentAssignDialog({ expense, onClose }: LoanPaymentAssignDialogProps) {
  const { user } = useAuth();
  const [loans, setLoans] = useState<LinkedLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!expense) return;
    fetchLinkedLoans();
  }, [expense]);

  const fetchLinkedLoans = async () => {
    if (!expense || !user) return;
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('loans' as any) as any)
        .select('id, lender_name, nickname, monthly_payment, original_amount, interest_rate, status, interest_calc_method')
        .eq('project_id', expense.projectId)
        .eq('user_id', user.id)
        .in('status', ['active', 'extended']);

      if (error) throw error;
      const linkedLoans = (data ?? []) as LinkedLoan[];

      if (linkedLoans.length === 0) {
        onClose();
        return;
      }

      // Auto-assign if only one loan
      if (linkedLoans.length === 1) {
        await assignToLoan(linkedLoans[0], expense);
        return;
      }

      // Sort: recommended first
      const sorted = [...linkedLoans].sort((a, b) => {
        const aMatch = isAmountMatch(a, expense.amount);
        const bMatch = isAmountMatch(b, expense.amount);
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });

      setLoans(sorted);

      // Pre-select recommended if exactly one match
      const matches = sorted.filter(l => isAmountMatch(l, expense.amount));
      if (matches.length === 1) {
        setSelectedLoanId(matches[0].id);
      }
    } catch (err) {
      console.error('Error fetching linked loans:', err);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const isAmountMatch = (loan: LinkedLoan, amount: number): boolean => {
    if (!loan.monthly_payment) return false;
    return Math.abs(Number(loan.monthly_payment) - amount) < 0.50;
  };

  const assignToLoan = async (loan: LinkedLoan, exp: LoanExpenseInfo) => {
    if (!user) return;
    setAssigning(true);
    try {
      const isInterestOnly = loan.interest_calc_method === 'simple' || loan.interest_calc_method === 'interest_only';
      const row: Record<string, unknown> = {
        loan_id: loan.id,
        project_id: exp.projectId,
        user_id: user.id,
        amount: exp.amount,
        date: exp.date,
        expense_id: exp.expenseId,
        payment_type: 'monthly',
        source: 'auto',
        description: exp.description || exp.vendorName || 'Auto-filed from expense',
        notes: `Auto-filed from expense`,
      };

      if (isInterestOnly) {
        row.interest_portion = exp.amount;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('loan_payments' as any) as any).insert(row);
      if (error) throw error;

      const loanLabel = loan.nickname || loan.lender_name;
      toast.success(`Payment logged to ${loanLabel}`);
      onClose();
    } catch (err: unknown) {
      console.error('Error assigning loan payment:', err);
      toast.error('Failed to assign loan payment');
    } finally {
      setAssigning(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedLoanId || !expense) return;
    const loan = loans.find(l => l.id === selectedLoanId);
    if (!loan) return;
    await assignToLoan(loan, expense);
  };

  const formatLoanLabel = (loan: LinkedLoan) => {
    return loan.nickname || loan.lender_name;
  };

  const formatMonthly = (loan: LinkedLoan) => {
    if (!loan.monthly_payment) return null;
    return `$${Number(loan.monthly_payment).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo`;
  };

  if (!expense || loading || loans.length <= 1) return null;

  return (
    <Dialog open={!!expense && !loading && loans.length > 1} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            Assign to Loan Payment
          </DialogTitle>
          <DialogDescription>
            This ${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} expense matches multiple loans. Which loan should it be logged to?
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={selectedLoanId} onValueChange={setSelectedLoanId} className="space-y-3">
          {loans.map((loan) => {
            const match = isAmountMatch(loan, expense.amount);
            return (
              <div key={loan.id} className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors ${selectedLoanId === loan.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}>
                <RadioGroupItem value={loan.id} id={loan.id} />
                <Label htmlFor={loan.id} className="flex-1 cursor-pointer flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{formatLoanLabel(loan)}</p>
                    {formatMonthly(loan) && (
                      <p className="text-xs text-muted-foreground">{formatMonthly(loan)}</p>
                    )}
                  </div>
                  {match && (
                    <Badge variant="secondary" className="gap-1 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      <Star className="h-3 w-3" />
                      Match
                    </Badge>
                  )}
                </Label>
              </div>
            );
          })}
        </RadioGroup>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={assigning}>Skip</Button>
          <Button onClick={handleAssign} disabled={!selectedLoanId || assigning}>
            {assigning ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
