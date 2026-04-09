import { useMemo } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { buildAmortizationSchedule } from '@/types/loans';
import type { Loan } from '@/types/loans';
import { cn } from '@/lib/utils';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);
const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

interface AmortizationTableProps {
  loan: Loan;
  extensionMonths?: number;
}

export function AmortizationTable({ loan, extensionMonths = 0 }: AmortizationTableProps) {
  const schedule = useMemo(() => buildAmortizationSchedule(loan, extensionMonths), [loan, extensionMonths]);
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
  const totalCost = loan.original_amount +
    totalInterest +
    (loan.origination_fee_dollars ?? 0) +
    (loan.other_closing_costs ?? 0);

  const exportCSV = () => {
    const headers = ['Payment #', 'Date', 'Payment', 'Principal', 'Interest', ...(isSimple ? ['Accrued Interest'] : []), 'Balance'];
    const rows = enrichedSchedule.map(r => [r.payment_number, r.date, r.payment.toFixed(2), r.principal.toFixed(2), r.interest.toFixed(2), ...(isSimple ? [r.accrued_interest!.toFixed(2)] : []), r.balance.toFixed(2)]);
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
      {/* Summary */}
      {loan.loan_type !== 'dscr' && <div className={cn("grid gap-3", isSimple ? "grid-cols-4" : "grid-cols-3")}>
        <div className="rounded-lg bg-muted p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Interest</p>
          <p className="text-base font-semibold text-destructive mt-0.5">{fmt(totalInterest)}</p>
        </div>
        <div className="rounded-lg bg-muted p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Principal</p>
          <p className="text-base font-semibold mt-0.5">{fmt(totalPrincipal)}</p>
        </div>
        {isSimple && (
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-xs text-muted-foreground">Accrued at Payoff</p>
            <p className="text-base font-semibold text-warning mt-0.5">{fmt(totalInterest)}</p>
          </div>
        )}
        <div className="rounded-lg bg-muted p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Cost of Loan</p>
          <p className="text-base font-semibold text-warning mt-0.5">{fmt(totalCost)}</p>
        </div>
      </div>}

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
              <TableHead className="text-right">Payment</TableHead>
              <TableHead className="text-right">Principal</TableHead>
              <TableHead className="text-right">Interest</TableHead>
              {isSimple && <TableHead className="text-right">Accrued Interest</TableHead>}
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrichedSchedule.map(row => (
              <TableRow key={row.payment_number} className={cn(row.is_balloon && 'bg-destructive/10')}>
                <TableCell className="text-muted-foreground text-xs">{row.payment_number}</TableCell>
                <TableCell className="text-sm">{fmtDate(row.date)}</TableCell>
                <TableCell className="text-right text-sm">
                  {fmt(row.payment)}
                  {row.is_balloon && <Badge variant="outline" className="ml-2 text-xs bg-destructive/20 text-destructive border-destructive/30">Balloon</Badge>}
                </TableCell>
                <TableCell className="text-right text-sm">{fmt(row.principal)}</TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">{fmt(row.interest)}</TableCell>
                {isSimple && <TableCell className="text-right text-sm font-medium text-warning">{fmt(row.accrued_interest!)}</TableCell>}
                <TableCell className="text-right text-sm font-medium">{fmt(row.balance)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
