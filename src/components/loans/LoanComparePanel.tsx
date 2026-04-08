import { useMemo, useState } from 'react';
import { X, Trophy, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { buildAmortizationSchedule, calcMonthlyPayment, LOAN_TYPE_LABELS } from '@/types/loans';
import type { Loan } from '@/types/loans';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const fmtDec = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

interface LoanMetrics {
  loan: Loan;
  label: string;
  monthlyPayment: number;
  totalInterest: number;
  originationCost: number;
  closingCosts: number;
  totalCost: number;
  effectiveRate: number;
  paybackMonths: number;
}

function computeMetrics(loan: Loan, paybackMonths: number): LoanMetrics {
  const monthly = loan.monthly_payment ?? calcMonthlyPayment(
    loan.original_amount, loan.interest_rate, loan.loan_term_months,
    loan.amortization_period_months, loan.payment_frequency, loan.interest_calc_method,
  );
  const schedule = buildAmortizationSchedule(loan);
  // Only sum interest for the payback period (capped at actual schedule length)
  const cappedMonths = Math.min(paybackMonths, schedule.length);
  const totalInterest = schedule.slice(0, cappedMonths).reduce((s, r) => s + r.interest, 0);
  const origPts = (loan.origination_fee_points ?? 0) / 100 * loan.original_amount;
  const origDollars = loan.origination_fee_dollars ?? 0;
  const originationCost = origPts + origDollars;
  const closingCosts = loan.other_closing_costs ?? 0;
  const totalCost = totalInterest + originationCost + closingCosts;
  const termYears = paybackMonths / 12;
  const effectiveRate = termYears > 0 ? (totalCost / loan.original_amount / termYears) * 100 : 0;

  return {
    loan,
    label: loan.nickname || loan.lender_name,
    monthlyPayment: monthly,
    totalInterest,
    originationCost,
    closingCosts,
    totalCost,
    effectiveRate,
    paybackMonths: cappedMonths,
  };
}

interface ComparePanelProps {
  loans: Loan[];
  onClose: () => void;
}

type RowDef = {
  label: string;
  getValue: (m: LoanMetrics) => string;
  getNum: (m: LoanMetrics) => number;
  lowerIsBetter: boolean;
};

const rows: RowDef[] = [
  { label: 'Loan Amount', getValue: m => fmt(m.loan.original_amount), getNum: m => m.loan.original_amount, lowerIsBetter: true },
  { label: 'Interest Rate', getValue: m => `${m.loan.interest_rate.toFixed(2)}%`, getNum: m => m.loan.interest_rate, lowerIsBetter: true },
  { label: 'Rate Type', getValue: m => m.loan.rate_type === 'fixed' ? 'Fixed' : 'Variable', getNum: () => 0, lowerIsBetter: false },
  { label: 'Loan Term', getValue: m => `${m.loan.loan_term_months} mo`, getNum: m => m.loan.loan_term_months, lowerIsBetter: true },
  { label: 'Monthly Payment', getValue: m => fmtDec(m.monthlyPayment), getNum: m => m.monthlyPayment, lowerIsBetter: true },
  { label: 'Origination Fees', getValue: m => fmt(m.originationCost), getNum: m => m.originationCost, lowerIsBetter: true },
  { label: 'Closing Costs', getValue: m => fmt(m.closingCosts), getNum: m => m.closingCosts, lowerIsBetter: true },
  { label: 'Total Interest', getValue: m => fmt(m.totalInterest), getNum: m => m.totalInterest, lowerIsBetter: true },
  { label: 'Total Cost of Loan', getValue: m => fmt(m.totalCost), getNum: m => m.totalCost, lowerIsBetter: true },
  { label: 'Effective Cost Rate', getValue: m => `${m.effectiveRate.toFixed(2)}%`, getNum: m => m.effectiveRate, lowerIsBetter: true },
];

export function LoanComparePanel({ loans, onClose }: ComparePanelProps) {
  const maxTerm = useMemo(() => Math.max(...loans.map(l => l.loan_term_months)), [loans]);
  const [paybackMonths, setPaybackMonths] = useState(maxTerm);

  const metrics = useMemo(() => loans.map(l => computeMetrics(l, paybackMonths)), [loans, paybackMonths]);

  const lowestTotalIdx = useMemo(() => {
    let minIdx = 0;
    metrics.forEach((m, i) => { if (m.totalCost < metrics[minIdx].totalCost) minIdx = i; });
    return minIdx;
  }, [metrics]);

  const savings = useMemo(() => {
    if (metrics.length < 2) return 0;
    const costs = metrics.map(m => m.totalCost);
    const sorted = [...costs].sort((a, b) => a - b);
    return sorted[1] - sorted[0];
  }, [metrics]);

  const colors = ['text-primary', 'text-orange-500', 'text-violet-500'];

  return (
    <Card className="border-primary/30 bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Loan Comparison
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payback Duration Slider */}
        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Payback Duration</span>
            <span className="text-sm font-bold tabular-nums">
              {paybackMonths} month{paybackMonths !== 1 ? 's' : ''}
              {paybackMonths < maxTerm && (
                <span className="text-xs text-muted-foreground font-normal ml-1.5">
                  (early payoff — {maxTerm - paybackMonths} mo early)
                </span>
              )}
            </span>
          </div>
          <Slider
            min={1}
            max={maxTerm}
            step={1}
            value={[paybackMonths]}
            onValueChange={([v]) => setPaybackMonths(v)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 mo</span>
            <span>{maxTerm} mo (full term)</span>
          </div>
        </div>

        {/* Header */}
        <div className="grid gap-3" style={{ gridTemplateColumns: `160px repeat(${metrics.length}, 1fr)` }}>
          <div />
          {metrics.map((m, i) => (
            <div key={m.loan.id} className="text-center space-y-1">
              <p className={`font-semibold text-sm ${colors[i]}`}>{m.label}</p>
              <Badge variant="outline" className="text-xs">
                {LOAN_TYPE_LABELS[m.loan.loan_type] ?? m.loan.loan_type}
              </Badge>
              {i === lowestTotalIdx && (
                <div className="flex justify-center">
                  <Badge className="bg-success/20 text-success border-success/30 text-xs gap-1">
                    <TrendingDown className="h-3 w-3" /> Best Value
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="rounded-lg border border-border overflow-hidden">
          {rows.map((row, ri) => {
            const nums = metrics.map(m => row.getNum(m));
            const allSame = nums.every(n => n === nums[0]);
            const isRateType = row.label === 'Rate Type';
            let bestIdx = -1;
            if (!isRateType && !allSame && row.lowerIsBetter) {
              bestIdx = nums.indexOf(Math.min(...nums));
            }

            return (
              <div
                key={row.label}
                className={`grid gap-3 px-4 py-2.5 text-sm ${ri % 2 === 0 ? 'bg-muted/30' : ''}`}
                style={{ gridTemplateColumns: `160px repeat(${metrics.length}, 1fr)` }}
              >
                <span className="text-muted-foreground font-medium">{row.label}</span>
                {metrics.map((m, i) => (
                  <span
                    key={m.loan.id}
                    className={`text-center font-medium ${i === bestIdx ? 'text-success' : ''}`}
                  >
                    {row.getValue(m)}
                  </span>
                ))}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        {savings > 0 && (
          <div className="rounded-lg bg-success/10 border border-success/20 p-4 text-center">
            <p className="text-sm font-medium text-success">
              <strong>{metrics[lowestTotalIdx].label}</strong> saves you{' '}
              <strong>{fmt(savings)}</strong> over {paybackMonths} month{paybackMonths !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
