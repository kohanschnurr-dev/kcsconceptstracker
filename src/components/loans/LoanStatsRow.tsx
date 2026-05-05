import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Hammer, Building2, Percent, CreditCard, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { effectiveOutstandingBalance, ACCRUES_INTEREST_TYPES, LOAN_TYPE_LABELS } from '@/types/loans';
import { getEffectivePayments } from '@/lib/loanPayments';
import type { Loan, LoanPayment, LoanType } from '@/types/loans';
import { supabase } from '@/integrations/supabase/client';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const SHORT_TERM_SET = new Set<LoanType>(ACCRUES_INTEREST_TYPES);
const isShortTerm = (l: Loan) => SHORT_TERM_SET.has(l.loan_type);

/**
 * @deprecated Use {@link effectiveOutstandingBalance} from '@/types/loans'
 */
export function loanBalanceWithDraws(l: Loan, payments: LoanPayment[] = []): number {
  return effectiveOutstandingBalance(l, payments);
}

interface LoanStatsRowProps {
  loans: Loan[];
}

type DrillKey = 'project' | 'rental' | 'rate' | 'debt' | null;

export function LoanStatsRow({ loans }: LoanStatsRowProps) {
  const [drill, setDrill] = useState<DrillKey>(null);
  const active = useMemo(() => loans.filter(l => l.status === 'active'), [loans]);
  const shortTermLoans = useMemo(() => active.filter(isShortTerm), [active]);
  const longTermLoans = useMemo(() => active.filter(l => !isShortTerm(l)), [active]);

  const activeIds = useMemo(() => active.map(l => l.id).sort(), [active]);
  const { data: payments = [] } = useQuery<LoanPayment[]>({
    queryKey: ['loan_payments_for_stats', activeIds],
    enabled: activeIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase.from('loan_payments' as any) as any)
        .select('loan_id, date, amount, principal_portion, interest_portion, late_fee')
        .in('loan_id', activeIds);
      if (error) throw error;
      return (data ?? []) as LoanPayment[];
    },
  });
  const paymentsByLoan = useMemo(() => {
    const m: Record<string, LoanPayment[]> = {};
    for (const p of payments) {
      const key = (p as any).loan_id;
      if (!key) continue;
      (m[key] = m[key] ?? []).push(p);
    }
    return m;
  }, [payments]);

  const balanceFor = (l: Loan) => effectiveOutstandingBalance(l, getEffectivePayments(l, paymentsByLoan[l.id] ?? []));

  const shortTermBalance = useMemo(
    () => shortTermLoans.reduce((s, l) => s + balanceFor(l), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shortTermLoans, paymentsByLoan],
  );
  const longTermBalance = useMemo(
    () => longTermLoans.reduce((s, l) => s + balanceFor(l), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [longTermLoans, paymentsByLoan],
  );
  const totalBalance = shortTermBalance + longTermBalance;

  const weightedRate = useMemo(() => {
    if (totalBalance === 0) return 0;
    return active.reduce((s, l) => s + l.interest_rate * balanceFor(l), 0) / totalBalance;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, totalBalance, paymentsByLoan]);

  const totalMonthlyDebt = useMemo(
    () => active.reduce((s, l) => s + (l.monthly_payment ?? 0), 0),
    [active],
  );

  const stats: Array<{
    key: Exclude<DrillKey, null>;
    title: string;
    value: string;
    subtitle: string;
    tooltip?: string;
    icon: typeof Hammer;
    color: string;
    bg: string;
  }> = [
    {
      key: 'project',
      title: 'Active Project Debt',
      value: fmt(shortTermBalance),
      subtitle: shortTermLoans.length === 0
        ? 'No active short-term loans'
        : `${shortTermLoans.length} short-term loan${shortTermLoans.length !== 1 ? 's' : ''}`,
      tooltip: 'Hard money, private money, bridge, and construction loans — the debt actively in play on live projects.',
      icon: Hammer,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      key: 'rental',
      title: 'Long-Term Rental Debt',
      value: fmt(longTermBalance),
      subtitle: longTermLoans.length === 0
        ? 'No active long-term loans'
        : `${longTermLoans.length} long-term loan${longTermLoans.length !== 1 ? 's' : ''}`,
      tooltip: 'DSCR, conventional, HELOC, portfolio, and seller-financed loans on stabilized rentals.',
      icon: Building2,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      key: 'rate',
      title: 'Weighted Avg. Rate',
      value: `${weightedRate.toFixed(2)}%`,
      subtitle: 'Across active loans',
      icon: Percent,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      key: 'debt',
      title: 'Total Monthly Debt Service',
      value: fmt(totalMonthlyDebt),
      subtitle: 'All active monthly payments',
      icon: CreditCard,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
  ];

  const drillConfig: Record<Exclude<DrillKey, null>, { title: string; total: string; loans: Loan[] }> = {
    project: { title: 'Active Project Debt', total: fmt(shortTermBalance), loans: shortTermLoans },
    rental: { title: 'Long-Term Rental Debt', total: fmt(longTermBalance), loans: longTermLoans },
    rate: { title: 'Weighted Avg. Rate', total: `${weightedRate.toFixed(2)}%`, loans: active },
    debt: { title: 'Total Monthly Debt Service', total: fmt(totalMonthlyDebt), loans: active },
  };
  const current = drill ? drillConfig[drill] : null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const card = (
            <Card
              key={stat.title}
              role="button"
              tabIndex={0}
              onClick={() => setDrill(stat.key)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDrill(stat.key); } }}
              className="glass-card cursor-pointer transition-all hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40 h-full"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{stat.title}</p>
                    <p className="mt-1 text-xl font-semibold truncate">{stat.value}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{stat.subtitle}</p>
                  </div>
                  <div className={cn('rounded-lg p-2.5 ml-3 flex-shrink-0', stat.bg)}>
                    <stat.icon className={cn('h-5 w-5', stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
          return stat.tooltip ? (
            <Tooltip key={stat.title}>
              <TooltipTrigger asChild>{card}</TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">{stat.tooltip}</TooltipContent>
            </Tooltip>
          ) : card;
        })}
      </div>

      <Dialog open={drill !== null} onOpenChange={(o) => !o && setDrill(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{current?.title}</DialogTitle>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{current?.total}</p>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-2">
              {current && current.loans.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">No loans in this bucket.</p>
              )}
              {current?.loans.map(loan => {
                const balance = balanceFor(loan);
                const drawn = loan.has_draws
                  ? Math.max(loan.total_draw_amount ?? 0, loan.funded_draws_total ?? 0)
                  : 0;
                let primary = '';
                let secondary = '';
                if (drill === 'project' || drill === 'rental') {
                  primary = fmt(balance);
                  secondary = drawn > 0
                    ? `Principal ${fmt(loan.outstanding_balance)} + Draws ${fmt(drawn)}`
                    : LOAN_TYPE_LABELS[loan.loan_type];
                } else if (drill === 'rate') {
                  const weight = totalBalance > 0 ? (balance / totalBalance) * 100 : 0;
                  primary = `${loan.interest_rate.toFixed(2)}%`;
                  secondary = `${weight.toFixed(1)}% of total balance · ${fmt(balance)}`;
                } else if (drill === 'debt') {
                  primary = fmt(loan.monthly_payment ?? 0);
                  secondary = `${loan.interest_rate.toFixed(2)}% · ${fmt(balance)} balance`;
                }
                return (
                  <Link
                    key={loan.id}
                    to={`/loans/${loan.id}`}
                    onClick={() => setDrill(null)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/50 p-3 hover:bg-accent hover:border-primary/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {loan.nickname || loan.lender_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {loan.project_name ?? 'No project'} · {loan.lender_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{secondary}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold tabular-nums">{primary}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </ScrollArea>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setDrill(null)}>
              <X className="h-4 w-4 mr-1.5" /> Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
