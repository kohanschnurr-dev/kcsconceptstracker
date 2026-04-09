import { useMemo } from 'react';
import { Download, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { buildAmortizationSchedule, buildDrawAmortizationSchedule, buildDrawInterestSchedule } from '@/types/loans';
import type { Loan, LoanDraw } from '@/types/loans';
import { cn } from '@/lib/utils';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);
const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

interface AmortizationTableProps {
  loan: Loan;
  extensionMonths?: number;
  draws?: LoanDraw[];
  hasDraws?: boolean;
}

export function AmortizationTable({ loan, extensionMonths = 0, draws, hasDraws }: AmortizationTableProps) {
  const hasFundedDraws = (draws ?? []).some(d => d.status === 'funded' && d.date_funded);
  const isDrawBased = !!(hasDraws && draws && draws.length > 0);

  const schedule = useMemo(() => {
    if (isDrawBased) return buildDrawAmortizationSchedule(loan, draws!, extensionMonths);
    return buildAmortizationSchedule(loan, extensionMonths);
  }, [loan, extensionMonths, draws, isDrawBased]);

  // Draw-period interest breakdown (only when funded draws exist)
  const drawInterest = useMemo(
    () => (hasFundedDraws && draws ? buildDrawInterestSchedule(loan, draws) : null),
    [loan, draws, hasFundedDraws],
  );

  const isSimple = loan.interest_calc_method === 'simple' || loan.payment_frequency === 'interest_only';

  const enrichedSchedule = useMemo(() => {
    let running = 0;
    return schedule.map(r => {
      running += r.interest;
      return { ...r, accrued_interest: running };
    });
  }, [schedule]);

  const totalInterest = useMemo(() => schedule.reduce((s, r) => s + r.interest, 0), [schedule]);
  const totalPrincipal = useMemo(() => schedule.reduce((s, r) => s + r.principal, 0), [schedule]);
  const totalDrawFees = useMemo(() => schedule.reduce((s, r) => s + (r.draw_fees ?? 0), 0), [schedule]);
  const totalCost = loan.original_amount +
    totalInterest +
    (loan.origination_fee_dollars ?? 0) +
    (loan.other_closing_costs ?? 0) +
    totalDrawFees;

  const hasDrawColumn = enrichedSchedule.some(r => r.draw_funded);

  const exportCSV = () => {
    const headers = [
      'Payment #', 'Date', 'Payment', 'Principal', 'Interest',
      ...(isSimple || isDrawBased ? ['Accrued Interest'] : []),
      ...(hasDrawColumn ? ['Draw Funded'] : []),
      ...(totalDrawFees > 0 ? ['Draw Fees'] : []),
      'Balance',
    ];
    const rows = enrichedSchedule.map(r => [
      r.payment_number, r.date, r.payment.toFixed(2), r.principal.toFixed(2), r.interest.toFixed(2),
      ...(isSimple || isDrawBased ? [r.accrued_interest!.toFixed(2)] : []),
      ...(hasDrawColumn ? [r.draw_funded ?? ''] : []),
      ...(totalDrawFees > 0 ? [(r.draw_fees ?? 0).toFixed(2)] : []),
      r.balance.toFixed(2),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amortization-${loan.nickname ?? loan.lender_name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Static Tailwind classes — dynamic interpolation gets purged in production
  const gridClass = totalDrawFees > 0
    ? (isSimple || isDrawBased ? 'grid-cols-5' : 'grid-cols-4')
    : (isSimple || isDrawBased ? 'grid-cols-4' : 'grid-cols-3');

  return (
    <div className="space-y-4">
      {/* Draw-interest period breakdown */}
      {drawInterest && drawInterest.periods.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-primary">Draw-based interest mode</span>
              <span className="text-muted-foreground ml-1">
                — interest accrues only on the funded draw balance between each draw date.
                Weighted avg balance: {fmt(drawInterest.weightedAvgBalance)}.
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Period</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  {drawInterest.totalFees > 0 && <TableHead className="text-right">Draw Fees</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {drawInterest.periods.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm font-medium">{p.label}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(p.startDate)} → {fmtDate(p.endDate)}</TableCell>
                    <TableCell className="text-right text-sm">{p.days}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(p.balance)}</TableCell>
                    <TableCell className="text-right text-sm">{p.effectiveRate.toFixed(2)}%</TableCell>
                    <TableCell className="text-right text-sm text-destructive">{fmt(p.interest)}</TableCell>
                    {drawInterest.totalFees > 0 && (
                      <TableCell className="text-right text-sm">
                        {p.fees > 0 ? <span className="text-warning">{fmt(p.fees)}</span> : '—'}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                <TableRow className="font-semibold bg-muted/30">
                  <TableCell colSpan={5} className="text-sm">Total</TableCell>
                  <TableCell className="text-right text-sm text-destructive">{fmt(drawInterest.totalInterest)}</TableCell>
                  {drawInterest.totalFees > 0 && (
                    <TableCell className="text-right text-sm text-warning">{fmt(drawInterest.totalFees)}</TableCell>
                  )}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className={cn('grid gap-3', gridClass)}>
        <div className="rounded-lg bg-muted p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Interest</p>
          <p className="text-base font-semibold text-destructive mt-0.5">{fmt(totalInterest)}</p>
        </div>
        <div className="rounded-lg bg-muted p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Principal</p>
          <p className="text-base font-semibold mt-0.5">{fmt(totalPrincipal)}</p>
        </div>
        {(isSimple || isDrawBased) && (
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-xs text-muted-foreground">Accrued at Payoff</p>
            <p className="text-base font-semibold text-warning mt-0.5">{fmt(totalInterest)}</p>
          </div>
        )}
        {totalDrawFees > 0 && (
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-xs text-muted-foreground">Draw Fees</p>
            <p className="text-base font-semibold text-warning mt-0.5">{fmt(totalDrawFees)}</p>
          </div>
        )}
        <div className="rounded-lg bg-muted p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Cost of Loan</p>
          <p className="text-base font-semibold text-warning mt-0.5">{fmt(totalCost)}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-x-auto max-h-96 overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">#</TableHead>
              <TableHead>Date</TableHead>
              {hasDrawColumn && <TableHead>Draw</TableHead>}
              <TableHead className="text-right">Payment</TableHead>
              <TableHead className="text-right">Principal</TableHead>
              <TableHead className="text-right">Interest</TableHead>
              {(isSimple || isDrawBased) && <TableHead className="text-right">Accrued Interest</TableHead>}
              {totalDrawFees > 0 && <TableHead className="text-right">Draw Fees</TableHead>}
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrichedSchedule.map(row => (
              <TableRow key={row.payment_number} className={cn(row.is_balloon && 'bg-destructive/10', row.draw_funded && 'bg-primary/5')}>
                <TableCell className="text-muted-foreground text-xs">{row.payment_number}</TableCell>
                <TableCell className="text-sm">{fmtDate(row.date)}</TableCell>
                {hasDrawColumn && (
                  <TableCell className="text-sm">
                    {row.draw_funded && (
                      <Badge variant="outline" className="text-xs bg-primary/20 text-primary border-primary/30">
                        {row.draw_funded}
                      </Badge>
                    )}
                  </TableCell>
                )}
                <TableCell className="text-right text-sm">
                  {fmt(row.payment)}
                  {row.is_balloon && <Badge variant="outline" className="ml-2 text-xs bg-destructive/20 text-destructive border-destructive/30">Balloon</Badge>}
                </TableCell>
                <TableCell className="text-right text-sm">{fmt(row.principal)}</TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">{fmt(row.interest)}</TableCell>
                {(isSimple || isDrawBased) && <TableCell className="text-right text-sm font-medium text-warning">{fmt(row.accrued_interest!)}</TableCell>}
                {totalDrawFees > 0 && (
                  <TableCell className="text-right text-sm">
                    {row.draw_fees ? <span className="text-warning">{fmt(row.draw_fees)}</span> : '—'}
                  </TableCell>
                )}
                <TableCell className="text-right text-sm font-medium">{fmt(row.balance)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
