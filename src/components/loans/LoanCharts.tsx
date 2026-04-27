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

  // Lighten an `hsl(h, s%, l%)` string by `delta` lightness points (clamped <=92).
  // Used to derive the secondary "interest" color from each loan type's base color.
  const lightenHsl = (hsl: string, delta: number): string => {
    const m = hsl.match(/hsl\(\s*([\d.]+)[ ,]+([\d.]+)%[ ,]+([\d.]+)%\s*\)/i);
    if (!m) return hsl;
    const h = parseFloat(m[1]);
    const s = parseFloat(m[2]);
    const l = Math.min(92, parseFloat(m[3]) + delta);
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  type TypeAgg = { type: LoanType; label: string; principal: number; interest: number; color: string };
  type PieRow = { key: string; label: string; kind: 'principal' | 'interest'; value: number; color: string; agg: TypeAgg };

  const { pieRows, legendPayload } = useMemo(() => {
    const aggByType: Record<string, TypeAgg> = {};
    active.forEach(l => {
      const label = LOAN_TYPE_LABELS[l.loan_type] ?? l.loan_type;
      const lp = paymentsByLoan[l.id] ?? [];
      const ld = drawsByLoan[l.id] ?? [];
      const principal = lp.length ? effectiveOutstandingBalance(l, lp) : loanBalanceWithDraws(l);
      const interest = currentAccruedInterest(l, lp, ld);
      const color = LOAN_TYPE_COLORS[l.loan_type]?.hsl ?? LOAN_TYPE_COLORS.other.hsl;
      const agg = aggByType[label] ??= { type: l.loan_type, label, principal: 0, interest: 0, color };
      agg.principal += principal;
      agg.interest += Math.max(0, interest);
    });

    const rows: PieRow[] = [];
    Object.values(aggByType).forEach(a => {
      if (a.principal > 0) {
        rows.push({ key: `${a.label}|principal`, label: a.label, kind: 'principal', value: a.principal, color: a.color, agg: a });
      }
      if (a.interest > 0) {
        rows.push({ key: `${a.label}|interest`, label: a.label, kind: 'interest', value: a.interest, color: lightenHsl(a.color, 22), agg: a });
      }
    });

    const legend = Object.values(aggByType).map(a => ({
      value: a.label,
      type: 'square' as const,
      id: a.label,
      color: a.color,
    }));

    return { pieRows: rows, legendPayload: legend };
  }, [active, paymentsByLoan, drawsByLoan]);

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
                data={pieRows}
                cx="50%"
                cy="50%"
                innerRadius={90}
                outerRadius={155}
                paddingAngle={2}
                dataKey="value"
                stroke="hsl(var(--card))"
                strokeWidth={2}
              >
                {pieRows.map((row) => (
                  <Cell key={row.key} fill={row.color} />
                ))}
              </Pie>
              <Tooltip
                cursor={{ fill: 'transparent' }}
                content={({ active: hovered, payload }) => {
                  if (!hovered || !payload || payload.length === 0) return null;
                  const row = payload[0].payload as PieRow;
                  if (!row?.agg) return null;
                  const { agg } = row;
                  const total = agg.principal + agg.interest;
                  return (
                    <div
                      style={{
                        ...TOOLTIP_STYLE,
                        padding: '10px 12px',
                        minWidth: 200,
                        boxShadow: '0 8px 24px hsl(0 0% 0% / 0.35)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: 0.3,
                          textTransform: 'uppercase',
                          color: 'hsl(var(--popover-foreground))',
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            width: 10,
                            height: 10,
                            background: agg.color,
                          }}
                        />
                        {agg.label}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 4, columnGap: 16, fontSize: 12, color: 'hsl(var(--popover-foreground))' }}>
                        <span style={{ opacity: 0.75 }}>Principal</span>
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmt(agg.principal)}</span>
                        <span style={{ opacity: 0.75 }}>Interest Accrued</span>
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmt(agg.interest)}</span>
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          paddingTop: 8,
                          borderTop: '1px solid hsl(var(--border))',
                          display: 'grid',
                          gridTemplateColumns: '1fr auto',
                          fontSize: 12,
                          color: 'hsl(var(--popover-foreground))',
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>Total Owed</span>
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{fmt(total)}</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                payload={legendPayload}
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
