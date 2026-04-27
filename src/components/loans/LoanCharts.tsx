import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LOAN_TYPE_LABELS, LOAN_TYPE_COLORS, currentAccruedInterest, effectiveOutstandingBalance } from '@/types/loans';
import type { LoanType, LoanPayment, LoanDraw } from '@/types/loans';
import type { Loan } from '@/types/loans';
import { loanBalanceWithDraws } from './LoanStatsRow';
import { supabase } from '@/integrations/supabase/client';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const COLORS = [
  'hsl(270, 60%, 55%)',
  'hsl(142, 76%, 36%)',
  'hsl(200, 80%, 50%)',
  'hsl(32, 95%, 55%)',
  'hsl(0, 72%, 51%)',
  'hsl(45, 93%, 47%)',
  'hsl(180, 70%, 45%)',
  'hsl(320, 70%, 50%)',
];

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--popover-foreground))',
};

const TOOLTIP_TEXT_STYLE = {
  color: 'hsl(var(--popover-foreground))',
};

interface LoanChartsProps {
  loans: Loan[];
}

export function LoanCharts({ loans }: LoanChartsProps) {
  const active = useMemo(() => loans.filter(l => l.status === 'active'), [loans]);

  // Fetch payments for active loans so the capital stack reflects paydowns
  // immediately (both shrinking the principal segment and recalculating
  // accrued interest on the *remaining* balance).
  const activeIds = useMemo(() => active.map(l => l.id).sort(), [active]);
  const { data: payments = [] } = useQuery<LoanPayment[]>({
    queryKey: ['loan_payments_for_charts', activeIds],
    enabled: activeIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase.from('loan_payments' as any) as any)
        .select('loan_id, payment_date, amount, principal_portion, interest_portion, late_fee')
        .in('loan_id', activeIds);
      if (error) throw error;
      return (data ?? []) as LoanPayment[];
    },
  });
  const { data: draws = [] } = useQuery<LoanDraw[]>({
    queryKey: ['loan_draws_for_charts', activeIds],
    enabled: activeIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase.from('loan_draws' as any) as any)
        .select('id, loan_id, draw_amount, draw_number, status, date_funded, expected_date, interest_rate_override, fee_amount, fee_percentage, milestone_name')
        .in('loan_id', activeIds);
      if (error) throw error;
      return (data ?? []) as LoanDraw[];
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
  const drawsByLoan = useMemo(() => {
    const m: Record<string, LoanDraw[]> = {};
    for (const d of draws) {
      const key = (d as any).loan_id;
      if (!key) continue;
      (m[key] = m[key] ?? []).push(d);
    }
    return m;
  }, [draws]);

  const byType = useMemo(() => {
    const map: Record<string, { value: number; type: LoanType }> = {};
    active.forEach(l => {
      const key = LOAN_TYPE_LABELS[l.loan_type] ?? l.loan_type;
      if (!map[key]) map[key] = { value: 0, type: l.loan_type };
      // Use payment-aware balance so the donut shrinks after paydowns.
      const lp = paymentsByLoan[l.id] ?? [];
      const principal = lp.length
        ? effectiveOutstandingBalance(l, lp)
        : loanBalanceWithDraws(l);
      map[key].value += principal;
    });
    return Object.entries(map).map(([name, { value, type }]) => ({ name, value, type }));
  }, [active, paymentsByLoan]);

  // Distinct color reserved for accrued interest — not used by any LoanType.
  const INTEREST_COLOR = 'hsl(48, 100%, 70%)';

  // Stack each project's balance by loan type + accrued interest — true "capital stack" view.
  const { byProject, presentTypes } = useMemo(() => {
    const map: Record<string, Record<string, number> & { __total: number; __interest: number }> = {};
    const typesSet = new Set<LoanType>();
    active.forEach(l => {
      const key = l.project_name ?? 'No Project';
      if (!map[key]) map[key] = { __total: 0, __interest: 0 } as any;
      const lp = paymentsByLoan[l.id] ?? [];
      // Payment-aware principal so the bar shrinks after a payment.
      const bal = lp.length ? effectiveOutstandingBalance(l, lp) : loanBalanceWithDraws(l);
      map[key][l.loan_type] = (map[key][l.loan_type] ?? 0) + bal;
      map[key].__total += bal;
      typesSet.add(l.loan_type);

      // Total accrued interest mirrors the loan-detail summary card so the
      // capital-stack bar lines up with the per-loan figures.
      const accrued = currentAccruedInterest(l, lp, drawsByLoan[l.id] ?? []);
      if (accrued > 0) map[key].__interest += accrued;
    });
    const rows = Object.entries(map)
      .map(([name, vals]) => ({ name, ...vals }))
      .sort((a, b) => (b as any).__total - (a as any).__total)
      .slice(0, 8);
    return { byProject: rows, presentTypes: Array.from(typesSet) };
  }, [active, paymentsByLoan, drawsByLoan]);

  if (active.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <Card className="glass-card lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Debt by Loan Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={420}>
            <PieChart>
              <Pie
                data={byType}
                cx="50%"
                cy="50%"
                innerRadius={90}
                outerRadius={155}
                paddingAngle={3}
                dataKey="value"
              >
                {byType.map((entry, i) => (
                  <Cell key={i} fill={LOAN_TYPE_COLORS[entry.type]?.hsl ?? LOAN_TYPE_COLORS.other.hsl} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => [fmt(v), 'Balance']}
                contentStyle={TOOLTIP_STYLE}
                itemStyle={TOOLTIP_TEXT_STYLE}
                labelStyle={TOOLTIP_TEXT_STYLE}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-foreground" style={{ fontSize: 12, fontWeight: 600 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="glass-card lg:col-span-3">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Capital Stack by Project</CardTitle>
          <span className="text-xs text-muted-foreground">Debt + accrued interest, stacked by loan type</span>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={520}>
            <BarChart data={byProject} margin={{ top: 24, right: 8, bottom: 78, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                formatter={(v: number, name: string) => [fmt(v), LOAN_TYPE_LABELS[name as LoanType] ?? name]}
                contentStyle={TOOLTIP_STYLE}
                itemStyle={TOOLTIP_TEXT_STYLE}
                labelStyle={TOOLTIP_TEXT_STYLE}
                cursor={{ fill: 'hsl(var(--muted))' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 8 }}
                formatter={(value) => (
                  <span className="text-foreground" style={{ fontSize: 11, fontWeight: 600 }}>
                    {LOAN_TYPE_LABELS[value as LoanType] ?? value}
                  </span>
                )}
              />
              {presentTypes.map((t) => (
                <Bar
                  key={t}
                  dataKey={t}
                  stackId="capital"
                  fill={LOAN_TYPE_COLORS[t]?.hsl ?? LOAN_TYPE_COLORS.other.hsl}
                  radius={0}
                  name={t}
                />
              ))}
              <Bar
                dataKey="__interest"
                stackId="capital"
                fill={INTEREST_COLOR}
                radius={[4, 4, 0, 0]}
                name="Interest Accrued"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
