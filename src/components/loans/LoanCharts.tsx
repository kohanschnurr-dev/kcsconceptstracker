import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LOAN_TYPE_LABELS } from '@/types/loans';
import type { Loan } from '@/types/loans';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const COLORS = [
  'hsl(32, 95%, 55%)',
  'hsl(142, 76%, 36%)',
  'hsl(200, 80%, 50%)',
  'hsl(270, 60%, 55%)',
  'hsl(0, 72%, 51%)',
  'hsl(45, 93%, 47%)',
  'hsl(180, 70%, 45%)',
  'hsl(320, 70%, 50%)',
];

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(220, 18%, 13%)',
  border: '1px solid hsl(220, 15%, 22%)',
  borderRadius: '8px',
  color: 'hsl(210, 20%, 95%)',
};

const TOOLTIP_TEXT_STYLE = {
  color: 'hsl(210, 20%, 95%)',
};

interface LoanChartsProps {
  loans: Loan[];
}

export function LoanCharts({ loans }: LoanChartsProps) {
  const active = useMemo(() => loans.filter(l => l.status === 'active'), [loans]);

  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    active.forEach(l => {
      const key = LOAN_TYPE_LABELS[l.loan_type] ?? l.loan_type;
      map[key] = (map[key] ?? 0) + l.outstanding_balance;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [active]);

  const byProject = useMemo(() => {
    const map: Record<string, number> = {};
    active.forEach(l => {
      const key = l.project_name ?? 'No Project';
      map[key] = (map[key] ?? 0) + l.outstanding_balance;
    });
    return Object.entries(map)
      .map(([name, balance]) => ({ name: name.length > 18 ? name.slice(0, 16) + '…' : name, balance }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 8);
  }, [active]);

  if (active.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="glass-card">
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
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {byType.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
                  <span className="text-foreground" style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Outstanding Balance by Project</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byProject} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 22%)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(210, 15%, 65%)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: 'hsl(210, 15%, 65%)' }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                formatter={(v: number) => [fmt(v), 'Balance']}
                contentStyle={TOOLTIP_STYLE}
                itemStyle={TOOLTIP_TEXT_STYLE}
                labelStyle={TOOLTIP_TEXT_STYLE}
                cursor={{ fill: 'hsl(220, 15%, 20%)' }}
              />
              <Bar dataKey="balance" fill="hsl(32, 95%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
