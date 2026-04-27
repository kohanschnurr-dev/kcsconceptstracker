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
      if (loanIds.length > 0) {
        const { data: drawRows } = await drawsTable()
          .select('loan_id, draw_amount, status')
          .in('loan_id', loanIds);
        ((drawRows ?? []) as any[]).forEach(d => {
          if (d.status === 'funded') {
            fundedMap[d.loan_id] = (fundedMap[d.loan_id] ?? 0) + Number(d.draw_amount ?? 0);
          }
        });
      }

      return loanRows.map(l => ({
        ...l,
        project_name: l.projects?.name ?? null,
        projects: undefined,
        funded_draws_total: fundedMap[l.id] ?? 0,
      })) as Loan[];
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
      const { data: paymentData } = await paymentsTable().select('principal_portion, loan_id').eq('id', paymentId).single();
      const { error } = await paymentsTable().delete().eq('id', paymentId);
      if (error) throw error;

      // Restore outstanding_balance in the loans table
      const principalPaid = (paymentData as any)?.principal_portion ?? 0;
      const paymentLoanId = (paymentData as any)?.loan_id;
      if (principalPaid > 0 && paymentLoanId) {
        const { data: currentLoan } = await loansTable().select('outstanding_balance').eq('id', paymentLoanId).single();
        if (currentLoan) {
          const newBalance = ((currentLoan as any).outstanding_balance ?? 0) + principalPaid;
          await loansTable().update({ outstanding_balance: newBalance }).eq('id', paymentLoanId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan_payments', loanId] });
      queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
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
    deletePayment,
    addExtension,
    deleteExtension,
    updateLoan,
  };
}
