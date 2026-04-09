import { useMemo } from 'react';
import { DollarSign, Percent, CreditCard, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Loan } from '@/types/loans';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

interface LoanStatsRowProps {
  loans: Loan[];
}

export function LoanStatsRow({ loans }: LoanStatsRowProps) {
  const active = useMemo(() => loans.filter(l => l.status === 'active'), [loans]);

  const totalBalance = useMemo(() => active.reduce((s, l) => s + l.outstanding_balance + (l.has_draws ? (l.total_draw_amount ?? 0) : 0), 0), [active]);

  const weightedRate = useMemo(() => {
    if (totalBalance === 0) return 0;
    return active.reduce((s, l) => s + l.interest_rate * l.outstanding_balance, 0) / totalBalance;
  }, [active, totalBalance]);

  const totalMonthlyDebt = useMemo(
    () => active.reduce((s, l) => s + (l.monthly_payment ?? 0), 0),
    [active],
  );

  const stats = [
    {
      title: 'Total Outstanding Balance',
      value: fmt(totalBalance),
      subtitle: `${active.length} active loan${active.length !== 1 ? 's' : ''}`,
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Weighted Avg. Rate',
      value: `${weightedRate.toFixed(2)}%`,
      subtitle: 'Across active loans',
      icon: Percent,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Total Monthly Debt Service',
      value: fmt(totalMonthlyDebt),
      subtitle: 'All active monthly payments',
      icon: CreditCard,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map(stat => (
        <Card key={stat.title} className="glass-card">
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
  );
}
