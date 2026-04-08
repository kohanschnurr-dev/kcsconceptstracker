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
      return (data ?? []).map((l: any) => ({
        ...l,
        project_name: l.projects?.name ?? null,
        projects: undefined,
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
      const row = { ...rest, date: payment_date ?? rest.date };
      const { error } = await paymentsTable().insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan_payments', loanId] });
      toast({ title: 'Payment logged' });
    },
    onError: (e: Error) => toast({ title: 'Error logging payment', description: e.message, variant: 'destructive' }),
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await paymentsTable().delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loan_payments', loanId] }),
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
    isLoading: loanLoading || drawsLoading || paymentsLoading,
    upsertDraw,
    deleteDraw,
    addPayment,
    deletePayment,
    updateLoan,
  };
}
