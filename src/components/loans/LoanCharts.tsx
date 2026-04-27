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

  const byProject = useMemo(() => {
    const map: Record<string, { balance: number; types: Record<string, number> }> = {};
    active.forEach(l => {
      const key = l.project_name ?? 'No Project';
      if (!map[key]) map[key] = { balance: 0, types: {} };
      const bal = loanBalanceWithDraws(l);
      map[key].balance += bal;
      map[key].types[l.loan_type] = (map[key].types[l.loan_type] ?? 0) + bal;
    });
    return Object.entries(map)
      .map(([name, { balance, types }]) => {
        const dominantType = Object.entries(types).sort((a, b) => b[1] - a[1])[0]?.[0] as LoanType;
        const color = LOAN_TYPE_COLORS[dominantType]?.hsl ?? LOAN_TYPE_COLORS.other.hsl;
        return { name, balance, color };
      })
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 8);
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
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Outstanding Balance by Project</CardTitle>
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
                formatter={(v: number) => [fmt(v), 'Balance']}
                contentStyle={TOOLTIP_STYLE}
                itemStyle={TOOLTIP_TEXT_STYLE}
                labelStyle={TOOLTIP_TEXT_STYLE}
                cursor={{ fill: 'hsl(var(--muted))' }}
              />
              <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
                {byProject.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
