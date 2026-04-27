import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LOAN_TYPE_LABELS, LOAN_TYPE_COLORS } from '@/types/loans';
import type { LoanType } from '@/types/loans';
import type { Loan } from '@/types/loans';
import { loanBalanceWithDraws } from './LoanStatsRow';

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

  const byType = useMemo(() => {
    const map: Record<string, { value: number; type: LoanType }> = {};
    active.forEach(l => {
      const key = LOAN_TYPE_LABELS[l.loan_type] ?? l.loan_type;
      if (!map[key]) map[key] = { value: 0, type: l.loan_type };
      map[key].value += loanBalanceWithDraws(l);
    });
    return Object.entries(map).map(([name, { value, type }]) => ({ name, value, type }));
  }, [active]);

  // Distinct color reserved for accrued interest — not used by any LoanType.
  const INTEREST_COLOR = 'hsl(48, 100%, 70%)';

  // Stack each project's balance by loan type + accrued interest — true "capital stack" view.
  const { byProject, presentTypes } = useMemo(() => {
    const map: Record<string, Record<string, number> & { __total: number; __interest: number }> = {};
    const typesSet = new Set<LoanType>();
    const today = Date.now();
    active.forEach(l => {
      const key = l.project_name ?? 'No Project';
      if (!map[key]) map[key] = { __total: 0, __interest: 0 } as any;
      const bal = loanBalanceWithDraws(l);
      map[key][l.loan_type] = (map[key][l.loan_type] ?? 0) + bal;
      map[key].__total += bal;
      typesSet.add(l.loan_type);

      // Simple-interest accrual from start_date → today on current balance.
      if (l.start_date) {
        const start = new Date(l.start_date).getTime();
        const days = Math.max(0, (today - start) / (1000 * 60 * 60 * 24));
        const accrued = bal * (l.interest_rate / 100) * (days / 365);
        if (accrued > 0) map[key].__interest += accrued;
      }
    });
    const rows = Object.entries(map)
      .map(([name, vals]) => ({ name, ...vals }))
      .sort((a, b) => (b as any).__total - (a as any).__total)
      .slice(0, 8);
    return { byProject: rows, presentTypes: Array.from(typesSet) };
  }, [active]);

  if (active.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <Card className="glass-card lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Debt by Loan Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={byType}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
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
          <span className="text-xs text-muted-foreground">Stacked by loan type</span>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={byProject} margin={{ top: 4, right: 8, bottom: 70, left: 0 }}>
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
              {presentTypes.map((t, i) => {
                const isLast = i === presentTypes.length - 1;
                return (
                  <Bar
                    key={t}
                    dataKey={t}
                    stackId="capital"
                    fill={LOAN_TYPE_COLORS[t]?.hsl ?? LOAN_TYPE_COLORS.other.hsl}
                    radius={isLast ? [4, 4, 0, 0] : 0}
                    name={t}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
