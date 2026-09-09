import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Receipt, StickyNote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatDisplayDate } from '@/lib/dateUtils';
import type { Loan } from '@/types/loans';

interface PaymentRow {
  id: string;
  loan_id: string;
  date: string | null;
  amount: number;
  principal_portion: number | null;
  interest_portion: number | null;
  late_fee: number | null;
  notes: string | null;
  payment_type: string | null;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

interface Props {
  loans: Loan[];
  limit?: number;
}

export function RecentLoanActivity({ loans, limit = 8 }: Props) {
  const loanIds = useMemo(() => loans.map(l => l.id).sort(), [loans]);

  const { data: payments = [], isLoading } = useQuery<PaymentRow[]>({
    queryKey: ['recent_loan_payments', loanIds],
    enabled: loanIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase.from('loan_payments' as any) as any)
        .select('id, loan_id, date, amount, principal_portion, interest_portion, late_fee, notes, payment_type')
        .in('loan_id', loanIds)
        .order('date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as PaymentRow[];
    },
  });

  const loanById = useMemo(() => new Map(loans.map(l => [l.id, l])), [loans]);

  const rows = useMemo(() => payments.slice(0, limit), [payments, limit]);

  if (loanIds.length === 0) return null;

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          Recent Payments &amp; Payoffs
        </CardTitle>
        <span className="text-[11px] text-muted-foreground">
          Latest {rows.length} across the loans shown
        </span>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No payments recorded yet for these loans.
          </p>
        ) : (
          <div className="divide-y divide-border/60">
            {rows.map(p => {
              const loan = loanById.get(p.loan_id);
              const label = [loan?.project_name, loan?.nickname || loan?.lender_name]
                .filter(Boolean)
                .join(' — ');
              const isPayoff =
                (p.payment_type ?? '').toLowerCase() === 'payoff' ||
                (p.notes ?? '').toLowerCase().includes('payoff') ||
                (loan?.status === 'paid_off' && p.id === payments.find(x => x.loan_id === p.loan_id)?.id);
              const interest = Number(p.interest_portion ?? 0);
              const principal =
                p.principal_portion != null
                  ? Number(p.principal_portion)
                  : Math.max(0, Number(p.amount ?? 0) - interest - Number(p.late_fee ?? 0));

              return (
                <div key={p.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {loan ? (
                        <Link
                          to={`/loans/${loan.id}`}
                          className="text-sm font-medium truncate hover:text-primary transition-colors"
                        >
                          {label || 'Loan'}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium truncate">{label || 'Loan'}</span>
                      )}
                      {isPayoff && (
                        <Badge className="h-4 px-1.5 text-[10px] bg-primary/15 text-primary border-primary/40">
                          Payoff
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {p.date ? formatDisplayDate(p.date) : '—'}
                      {(principal > 0 || interest > 0) && (
                        <>
                          {' · '}
                          {fmt(principal)} principal
                          {interest > 0 && ` · ${fmt(interest)} interest`}
                        </>
                      )}
                    </div>
                    {p.notes && (
                      <div className="flex items-start gap-1 text-[11px] text-muted-foreground mt-1">
                        <StickyNote className="h-3 w-3 mt-[1px] shrink-0" />
                        <span className="line-clamp-2">{p.notes}</span>
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-sm font-semibold shrink-0">
                    {fmt(Number(p.amount ?? 0))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
