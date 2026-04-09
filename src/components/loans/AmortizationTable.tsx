import { useMemo } from 'react';
import { Download, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  buildAmortizationSchedule,
  buildDrawWeightedSchedule,
  calcDrawAccruedInterest,
} from '@/types/loans';
import type { Loan, LoanDraw } from '@/types/loans';
import { cn } from '@/lib/utils';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);
const fmtDate = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

interface AmortizationTableProps {
  loan: Loan;
  draws?: LoanDraw[];
}

export function AmortizationTable({ loan, draws }: AmortizationTableProps) {
  // Use draw-weighted schedule when loan has draws with any funded entries
  const hasFundedDraws = (draws ?? []).some(d => d.status === 'funded' && d.date_funded);
  const useDrawMode = loan.has_draws && hasFundedDraws && draws && draws.length > 0;

  const schedule = useMemo(
    () =>
      useDrawMode
        ? buildDrawWeightedSchedule(loan, draws!)
        : buildAmortizationSchedule(loan),
    [loan, draws, useDrawMode],
  );

  const totalInterest = useMemo(() => schedule.reduce((s, r) => s + r.interest, 0), [schedule]);
  const totalPrincipal = useMemo(() => schedule.reduce((s, r) => s + r.principal, 0), [schedule]);

  // For draw-mode, project total interest is draw-accrued + projected remaining periods
  const accrued = useDrawMode ? calcDrawAccruedInterest(loan, draws!) : null;

  const totalCost =
    (useDrawMode
      ? (draws ?? []).filter(d => d.status === 'funded').reduce((s, d) => s + d.draw_amount, 0)
      : loan.original_amount) +
    totalInterest +
    (loan.origination_fee_dollars ?? 0) +
    (loan.other_closing_costs ?? 0);

  const exportCSV = () => {
    const headers = useDrawMode
      ? ['Payment #', 'Date', 'Drawn Balance', 'Interest', 'Payment', 'Draw Events']
      : ['Payment #', 'Date', 'Payment', 'Principal', 'Interest', 'Balance'];
    const rows = schedule.map(r =>
      useDrawMode
        ? [r.payment_number, r.date, (r.drawn_balance ?? 0).toFixed(2), r.interest.toFixed(2), r.payment.toFixed(2), (r.draw_events ?? []).join('; ')]
        : [r.payment_number, r.date, r.payment.toFixed(2), r.principal.toFixed(2), r.interest.toFixed(2), r.balance.toFixed(2)],
    );
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amortization-${loan.nickname ?? loan.lender_name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Draw-weighted mode callout */}
      {useDrawMode && (
        <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm">
          <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-medium text-primary">Draw-weighted interest mode</span>
            <span className="text-muted-foreground ml-1">
              — interest is calculated only on the cumulative funded draw balance, not the full loan amount. Each row reflects what has actually been drawn as of that payment date.
            </span>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className={cn('grid gap-3', useDrawMode ? 'grid-cols-4' : 'grid-cols-3')}>
        {useDrawMode && accrued != null && (
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-xs text-muted-foreground">Interest Accrued (Actual)</p>
            <p className="text-base font-semibold text-destructive mt-0.5">{fmt(accrued)}</p>
          </div>
        )}
        <div className="rounded-lg bg-muted p-3 text-center">
          <p className="text-xs text-muted-foreground">{useDrawMode ? 'Projected Total Interest' : 'Total Interest'}</p>
          <p className="text-base font-semibold text-destructive mt-0.5">{fmt(totalInterest)}</p>
        </div>
        <div className="rounded-lg bg-muted p-3 text-center">
          <p className="text-xs text-muted-foreground">{useDrawMode ? 'Total Drawn (Principal)' : 'Total Principal'}</p>
          <p className="text-base font-semibold mt-0.5">{fmt(totalPrincipal)}</p>
        </div>
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

      {/* Table */}
      <div className="rounded-lg border border-border overflow-x-auto max-h-[480px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">#</TableHead>
              <TableHead>Date</TableHead>
              {useDrawMode ? (
                <>
                  <TableHead className="text-right">Drawn Balance</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="text-right">Payment</TableHead>
                  <TableHead>Draw Events</TableHead>
                </>
              ) : (
                <>
                  <TableHead className="text-right">Payment</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule.map(row => (
              <TableRow
                key={row.payment_number}
                className={cn(
                  row.is_balloon && 'bg-destructive/10',
                  useDrawMode && row.draw_events && row.draw_events.length > 0 && 'bg-success/5',
                )}
              >
                <TableCell className="text-muted-foreground text-xs">{row.payment_number}</TableCell>
                <TableCell className="text-sm">{fmtDate(row.date)}</TableCell>
                {useDrawMode ? (
                  <>
                    <TableCell className="text-right text-sm font-medium">
                      {fmt(row.drawn_balance ?? 0)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {fmt(row.interest)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      {fmt(row.payment)}
                      {row.is_balloon && (
                        <Badge variant="outline" className="ml-2 text-xs bg-destructive/20 text-destructive border-destructive/30">
                          Balloon
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.draw_events && row.draw_events.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {row.draw_events.map((e, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] h-4 px-1.5 bg-success/15 text-success border-success/30">
                              {e}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="text-right text-sm">
                      {fmt(row.payment)}
                      {row.is_balloon && (
                        <Badge variant="outline" className="ml-2 text-xs bg-destructive/20 text-destructive border-destructive/30">
                          Balloon
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">{fmt(row.principal)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{fmt(row.interest)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{fmt(row.balance)}</TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
