import { useMemo, useState } from 'react';
import { DollarSign, Percent, CreditCard, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import type { Loan } from '@/types/loans';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

/**
 * Returns the loan balance including any actually-disbursed draws.
 * Only counts `funded_draws_total` (sum of draw rows with status='funded').
 * The planned `total_draw_amount` is NOT included — it represents future
 * available credit, not money already drawn.
 */
export function loanBalanceWithDraws(l: Loan): number {
  if (!l.has_draws) return l.outstanding_balance;
  return l.outstanding_balance + (l.funded_draws_total ?? 0);
}

interface LoanStatsRowProps {
  loans: Loan[];
}

type DrillKey = 'balance' | 'rate' | 'debt' | null;

export function LoanStatsRow({ loans }: LoanStatsRowProps) {
  const [drill, setDrill] = useState<DrillKey>(null);
  const active = useMemo(() => loans.filter(l => l.status === 'active'), [loans]);

  const totalBalance = useMemo(
    () => active.reduce((s, l) => s + loanBalanceWithDraws(l), 0),
    [active],
  );

  const weightedRate = useMemo(() => {
    if (totalBalance === 0) return 0;
    return active.reduce((s, l) => s + l.interest_rate * loanBalanceWithDraws(l), 0) / totalBalance;
  }, [active, totalBalance]);

  const totalMonthlyDebt = useMemo(
    () => active.reduce((s, l) => s + (l.monthly_payment ?? 0), 0),
    [active],
  );

  const stats: Array<{
    key: Exclude<DrillKey, null>;
    title: string;
    value: string;
    subtitle: string;
    icon: typeof DollarSign;
    color: string;
    bg: string;
  }> = [
    {
      key: 'balance',
      title: 'Total Outstanding Balance',
      value: fmt(totalBalance),
      subtitle: `${active.length} active loan${active.length !== 1 ? 's' : ''}`,
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      key: 'rate',
      title: 'Weighted Avg. Rate',
      value: `${weightedRate.toFixed(2)}%`,
      subtitle: 'Across active loans',
      icon: Percent,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
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

  const drillTitle = drill === 'balance'
    ? 'Total Outstanding Balance'
    : drill === 'rate'
    ? 'Weighted Avg. Rate'
    : drill === 'debt'
    ? 'Total Monthly Debt Service'
    : '';

  const drillTotal = drill === 'balance'
    ? fmt(totalBalance)
    : drill === 'rate'
    ? `${weightedRate.toFixed(2)}%`
    : drill === 'debt'
    ? fmt(totalMonthlyDebt)
    : '';

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(stat => (
          <Card
            key={stat.title}
            role="button"
            tabIndex={0}
            onClick={() => setDrill(stat.key)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDrill(stat.key); } }}
            className="glass-card cursor-pointer transition-all hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
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
        ))}
      </div>

      <Dialog open={drill !== null} onOpenChange={(o) => !o && setDrill(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-baseline justify-between gap-3">
              <span>{drillTitle}</span>
              <span className="text-base font-semibold text-muted-foreground">{drillTotal}</span>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-2">
              {active.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">No active loans.</p>
              )}
              {active.map(loan => {
                const balance = loanBalanceWithDraws(loan);
                const drawn = loan.has_draws
                  ? Math.max(loan.total_draw_amount ?? 0, loan.funded_draws_total ?? 0)
                  : 0;
                let primary = '';
                let secondary = '';
                if (drill === 'balance') {
                  primary = fmt(balance);
                  secondary = drawn > 0
                    ? `Principal ${fmt(loan.outstanding_balance)} + Draws ${fmt(drawn)}`
                    : `Principal balance`;
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
    </>
  );
}
