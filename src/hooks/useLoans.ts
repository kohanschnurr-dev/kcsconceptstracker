import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Loan, LoanDraw, LoanPayment } from '@/types/loans';
import { useToast } from '@/hooks/use-toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loansTable = () => supabase.from('loans' as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const drawsTable = () => supabase.from('loan_draws' as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const paymentsTable = () => supabase.from('loan_payments' as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extensionsTable = () => supabase.from('loan_extensions' as any);

export function useLoans() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: loans = [], isLoading } = useQuery<Loan[]>({
    queryKey: ['loans', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await loansTable()
        .select('*, projects(name)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const loanRows = (data ?? []) as any[];

      // Fetch funded draws aggregated per loan (so balance reflects actual disbursed funds
      // instead of relying on a manually-entered total_draw_amount).
      const loanIds = loanRows.map(l => l.id);
      const fundedMap: Record<string, number> = {};
      // Aggregate principal paid per loan so the list view always reflects
      // payments — even legacy ones that never wrote outstanding_balance.
      const principalPaidMap: Record<string, number> = {};
      if (loanIds.length > 0) {
        const [{ data: drawRows }, { data: payRows }] = await Promise.all([
          drawsTable().select('loan_id, draw_amount, status').in('loan_id', loanIds),
          paymentsTable()
            .select('loan_id, amount, principal_portion, interest_portion, late_fee')
            .in('loan_id', loanIds),
        ]);
        ((drawRows ?? []) as any[]).forEach(d => {
          if (d.status === 'funded') {
            fundedMap[d.loan_id] = (fundedMap[d.loan_id] ?? 0) + Number(d.draw_amount ?? 0);
          }
        });
        ((payRows ?? []) as any[]).forEach(p => {
          const principal =
            p.principal_portion != null
              ? Number(p.principal_portion)
              : Math.max(
                  0,
                  Number(p.amount ?? 0) - Number(p.interest_portion ?? 0) - Number(p.late_fee ?? 0),
                );
          principalPaidMap[p.loan_id] = (principalPaidMap[p.loan_id] ?? 0) + principal;
        });
      }

      return loanRows.map(l => {
        const storedBalance = Number(l.outstanding_balance ?? 0);
        const principalPaid = principalPaidMap[l.id] ?? 0;
        // Effective balance: lesser of stored value and (original - principal paid).
        // This corrects legacy rows where outstanding_balance wasn't decremented.
        const computed = Math.max(0, Number(l.original_amount ?? 0) - principalPaid);
        const effectiveBalance = Math.min(storedBalance, computed);
        return {
          ...l,
          project_name: l.projects?.name ?? null,
          projects: undefined,
          outstanding_balance: effectiveBalance,
          funded_draws_total: fundedMap[l.id] ?? 0,
        };
      }) as Loan[];
    },
  });

  const createLoan = useMutation({
    mutationFn: async (payload: Omit<Loan, 'id' | 'created_at' | 'updated_at' | 'project_name'>) => {
      const { data, error } = await loansTable().insert(payload).select().single();
      if (error) throw error;
      return data as unknown as Loan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans', user?.id] });
      toast({ title: 'Loan added successfully' });
    },
    onError: (e: Error) => toast({ title: 'Error adding loan', description: e.message, variant: 'destructive' }),
  });

  const updateLoan = useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Loan> & { id: string }) => {
      const { data, error } = await loansTable().update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data as unknown as Loan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans', user?.id] });
      toast({ title: 'Loan updated' });
    },
    onError: (e: Error) => toast({ title: 'Error updating loan', description: e.message, variant: 'destructive' }),
  });

  const deleteLoan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await loansTable().delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans', user?.id] });
      toast({ title: 'Loan deleted' });
    },
  });

  return { loans, isLoading, createLoan, updateLoan, deleteLoan };
}

export function useLoanDetail(loanId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: loan, isLoading: loanLoading } = useQuery<Loan | null>({
    queryKey: ['loan', loanId],
    enabled: !!loanId && !!user,
    queryFn: async () => {
      const { data, error } = await loansTable()
        .select('*, projects(name)')
        .eq('id', loanId)
        .single();
      if (error) throw error;
      return { ...(data as any), project_name: (data as any).projects?.name ?? null } as Loan;
    },
  });

  const { data: draws = [], isLoading: drawsLoading } = useQuery<LoanDraw[]>({
    queryKey: ['loan_draws', loanId],
    enabled: !!loanId,
    queryFn: async () => {
      const { data, error } = await drawsTable()
        .select('*')
        .eq('loan_id', loanId)
        .order('draw_number', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as LoanDraw[];
    },
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<LoanPayment[]>({
    queryKey: ['loan_payments', loanId],
    enabled: !!loanId,
    queryFn: async () => {
      const { data, error } = await paymentsTable()
        .select('*')
        .eq('loan_id', loanId)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        ...p,
        payment_date: p.date ?? p.payment_date,
      })) as unknown as LoanPayment[];
    },
  });

  const upsertDraw = useMutation({
    mutationFn: async (draw: Partial<LoanDraw> & { loan_id: string; draw_number: number; draw_amount: number }) => {
      if (draw.id) {
        const { id, ...rest } = draw;
        const { error } = await drawsTable().update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await drawsTable().insert(draw);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loan_draws', loanId] }),
    onError: (e: Error) => toast({ title: 'Error saving draw', description: e.message, variant: 'destructive' }),
  });

  const deleteDraw = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await drawsTable().delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loan_draws', loanId] }),
  });

  const addPayment = useMutation({
    mutationFn: async (payment: Omit<LoanPayment, 'id' | 'created_at'>) => {
      const { payment_date, ...rest } = payment as any;

      // Look up the loan to inherit project_id (loan_payments shares the table
      // used by project expenses, which has additional NOT NULL columns).
      let projectId: string | null = null;
      if (payment.loan_id) {
        const { data: loanRow } = await loansTable()
          .select('project_id')
          .eq('id', payment.loan_id)
          .single();
        projectId = (loanRow as any)?.project_id ?? null;
      }

      const row = {
        ...rest,
        date: payment_date ?? rest.date,
        user_id: user?.id,
        project_id: projectId,
        payment_type: 'loan',
        source: 'manual',
      };
      const { error } = await paymentsTable().insert(row);
      if (error) throw error;

      // Update outstanding_balance in the loans table.
      // Fallback: if the user didn't split the payment, treat the whole amount
      // (less interest portion & late fee) as principal so the balance always
      // moves. Clamp at 0 and auto-flip status to paid_off when fully repaid.
      const lateFee = (payment as any).late_fee ?? 0;
      const interestPortion = payment.interest_portion ?? 0;
      const principalPaid =
        payment.principal_portion != null
          ? payment.principal_portion
          : Math.max(0, (payment.amount ?? 0) - interestPortion - lateFee);

      if (principalPaid > 0 && payment.loan_id) {
        const { data: currentLoan } = await loansTable()
          .select('outstanding_balance, status')
          .eq('id', payment.loan_id)
          .single();
        if (currentLoan) {
          const prev = (currentLoan as any).outstanding_balance ?? 0;
          const newBalance = Math.max(0, prev - principalPaid);
          const update: Record<string, any> = { outstanding_balance: newBalance };
          if (newBalance === 0 && (currentLoan as any).status !== 'paid_off') {
            update.status = 'paid_off';
          }
          await loansTable().update(update).eq('id', payment.loan_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan_payments', loanId] });
      queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({ title: 'Payment logged' });
    },
    onError: (e: Error) => toast({ title: 'Error logging payment', description: e.message, variant: 'destructive' }),
  });

  const deletePayment = useMutation({
    mutationFn: async (paymentId: string) => {
      // Fetch the payment first to restore the balance
      const { data: paymentData } = await paymentsTable()
        .select('principal_portion, interest_portion, amount, late_fee, loan_id')
        .eq('id', paymentId)
        .single();
      const { error } = await paymentsTable().delete().eq('id', paymentId);
      if (error) throw error;

      // Restore outstanding_balance using the same fallback as addPayment so
      // legacy/unsplit payments are handled symmetrically. If the loan was
      // auto-marked paid_off and we're undoing principal, flip it back to active.
      const p = (paymentData as any) ?? {};
      const restored =
        p.principal_portion != null
          ? p.principal_portion
          : Math.max(0, (p.amount ?? 0) - (p.interest_portion ?? 0) - (p.late_fee ?? 0));
      const paymentLoanId = p.loan_id;
      if (restored > 0 && paymentLoanId) {
        const { data: currentLoan } = await loansTable()
          .select('outstanding_balance, status, original_amount')
          .eq('id', paymentLoanId)
          .single();
        if (currentLoan) {
          const cap = (currentLoan as any).original_amount ?? Infinity;
          const newBalance = Math.min(cap, ((currentLoan as any).outstanding_balance ?? 0) + restored);
          const update: Record<string, any> = { outstanding_balance: newBalance };
          if (newBalance > 0 && (currentLoan as any).status === 'paid_off') {
            update.status = 'active';
          }
          await loansTable().update(update).eq('id', paymentLoanId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan_payments', loanId] });
      queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
  });

  const updatePayment = useMutation({
    mutationFn: async ({ id, ...payment }: Omit<LoanPayment, 'created_at'>) => {
      // Fetch existing row to compute principal delta
      const { data: existing } = await paymentsTable()
        .select('principal_portion, interest_portion, amount, late_fee, loan_id')
        .eq('id', id)
        .single();
      const e = (existing as any) ?? {};
      const oldPrincipal =
        e.principal_portion != null
          ? e.principal_portion
          : Math.max(0, (e.amount ?? 0) - (e.interest_portion ?? 0) - (e.late_fee ?? 0));

      const { payment_date, loan_id, ...rest } = payment as any;
      const updateRow: Record<string, any> = {
        ...rest,
        date: payment_date,
      };
      const { error } = await paymentsTable().update(updateRow).eq('id', id);
      if (error) throw error;

      const newLateFee = (payment as any).late_fee ?? 0;
      const newInterest = payment.interest_portion ?? 0;
      const newPrincipal =
        payment.principal_portion != null
          ? payment.principal_portion
          : Math.max(0, (payment.amount ?? 0) - newInterest - newLateFee);

      const delta = newPrincipal - oldPrincipal; // positive = more principal paid
      const targetLoanId = loan_id ?? e.loan_id;
      if (delta !== 0 && targetLoanId) {
        const { data: currentLoan } = await loansTable()
          .select('outstanding_balance, status, original_amount')
          .eq('id', targetLoanId)
          .single();
        if (currentLoan) {
          const cap = (currentLoan as any).original_amount ?? Infinity;
          const prev = (currentLoan as any).outstanding_balance ?? 0;
          const newBalance = Math.min(cap, Math.max(0, prev - delta));
          const update: Record<string, any> = { outstanding_balance: newBalance };
          if (newBalance === 0 && (currentLoan as any).status !== 'paid_off') {
            update.status = 'paid_off';
          } else if (newBalance > 0 && (currentLoan as any).status === 'paid_off') {
            update.status = 'active';
          }
          await loansTable().update(update).eq('id', targetLoanId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan_payments', loanId] });
      queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({ title: 'Payment updated' });
    },
    onError: (e: Error) => toast({ title: 'Error updating payment', description: e.message, variant: 'destructive' }),
  });

  // Extensions
  const { data: extensions = [], isLoading: extensionsLoading } = useQuery<any[]>({
    queryKey: ['loan_extensions', loanId],
    enabled: !!loanId,
    queryFn: async () => {
      const { data, error } = await extensionsTable()
        .select('*')
        .eq('loan_id', loanId)
        .order('extension_number', { ascending: true });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const addExtension = useMutation({
    mutationFn: async (ext: { loan_id: string; extension_number: number; extended_from: string; extended_to: string; extension_fee?: number; fee_percentage?: number; notes?: string }) => {
      const { error } = await extensionsTable().insert(ext);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan_extensions', loanId] });
      toast({ title: 'Extension recorded' });
    },
    onError: (e: Error) => toast({ title: 'Error adding extension', description: e.message, variant: 'destructive' }),
  });

  const deleteExtension = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await extensionsTable().delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan_extensions', loanId] });
      toast({ title: 'Extension removed' });
    },
  });

  const updateLoan = useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Loan> & { id: string }) => {
      const { project_name, projects, created_at, updated_at, ...dbPayload } = payload as any;
      const { data, error } = await loansTable().update(dbPayload).eq('id', id).select().single();
      if (error) throw error;
      return data as unknown as Loan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({ title: 'Loan updated' });
    },
    onError: (e: Error) => toast({ title: 'Error updating loan', description: e.message, variant: 'destructive' }),
  });

  return {
    loan,
    draws,
    payments,
    extensions,
    isLoading: loanLoading || drawsLoading || paymentsLoading || extensionsLoading,
    upsertDraw,
    deleteDraw,
    addPayment,
    updatePayment,
    deletePayment,
    addExtension,
    deleteExtension,
    updateLoan,
  };
}
