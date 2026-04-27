import { useMemo } from 'react';
import { Download, Check, ArrowUpCircle, ArrowDownCircle, Clock, Flag, Play, CircleDashed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { buildInterestSchedule, type Loan, type LoanDraw, type LoanPayment, type InterestLedgerKind } from '@/types/loans';
import { formatDisplayDate } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

const fmt = (v: number | undefined | null) =>
  v == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);

const fmtSigned = (v: number, sign: '+' | '-') => `${sign}${fmt(Math.abs(v)).replace('-', '')}`;

interface Props {
  loan: Loan;
  draws: LoanDraw[];
  payments: LoanPayment[];
  extensions?: { extended_to: string }[];
}

const KIND_META: Record<InterestLedgerKind, { Icon: typeof Play; iconClass: string; rowClass: string; badge?: string; badgeClass?: string }> = {
  start:         { Icon: Play,            iconClass: 'text-muted-foreground',   rowClass: '' },
  draw:          { Icon: ArrowUpCircle,   iconClass: 'text-blue-400',           rowClass: '' },
  payment:       { Icon: ArrowDownCircle, iconClass: 'text-success',            rowClass: '' },
  today:         { Icon: Clock,           iconClass: 'text-primary',            rowClass: 'bg-primary/10 hover:bg-primary/15 border-l-2 border-l-primary', badge: 'Today', badgeClass: 'bg-primary/20 text-primary border-primary/40' },
  pending_draw:  { Icon: CircleDashed,    iconClass: 'text-muted-foreground',   rowClass: 'opacity-70',  badge: 'Projected', badgeClass: 'bg-muted text-muted-foreground border-border' },
  maturity:      { Icon: Flag,            iconClass: 'text-destructive',        rowClass: 'opacity-70 border-l-2 border-l-destructive/60 border-dashed', badge: 'Projected', badgeClass: 'bg-destructive/20 text-destructive border-destructive/40' },
};

export function InterestScheduleTable({ loan, draws, payments, extensions = [] }: Props) {
  const result = useMemo(
    () => buildInterestSchedule({ loan, draws, payments, extensions }),
    [loan, draws, payments, extensions],
  );

  const exportCSV = () => {
    const headers = ['#', 'Date', 'Event', 'Days', 'Draw', 'Principal Paid', 'Interest Paid', 'Interest Accrued', 'Balance', 'Unpaid Interest', 'Status'];
    const rows = result.rows.map((r, i) => [
      i + 1,
      r.date,
      r.label.replace(/,/g, ''),
      r.daysSincePrior,
      (r.drawAmount ?? 0).toFixed(2),
      (r.principalPaid ?? 0).toFixed(2),
      (r.interestPaid ?? 0).toFixed(2),
      r.interestAccrued.toFixed(2),
      r.balance.toFixed(2),
      r.unpaidInterest.toFixed(2),
      r.kind === 'today' ? 'Live' : r.isFuture ? 'Projected' : 'Past',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interest-schedule-${loan.nickname ?? loan.lender_name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Currently Holding</p>
          <p className="text-base font-semibold mt-0.5">{fmt(result.currentBalance)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Outstanding principal today</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Interest Accrued (Unpaid)</p>
          <p className="text-base font-semibold text-destructive mt-0.5">{fmt(result.currentUnpaidInterest)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Live through today</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Total Disbursed</p>
          <p className="text-base font-semibold mt-0.5">{fmt(result.totalDisbursed)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Original + funded draws</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          Chronological ledger — every draw and payment recomputes the balance and interest.
        </p>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-x-auto max-h-[28rem] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">#</TableHead>
              <TableHead className="w-32">Date</TableHead>
              <TableHead>Event</TableHead>
              <TableHead className="text-right w-16">Days</TableHead>
              <TableHead className="text-right">Draw</TableHead>
              <TableHead className="text-right">Principal Paid</TableHead>
              <TableHead className="text-right">Interest Accrued</TableHead>
              <TableHead className="text-right">Interest Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Unpaid Int.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.map((row, idx) => {
              const meta = KIND_META[row.kind];
              const Icon = meta.Icon;
              const isPast = !row.isFuture && row.kind !== 'today';
              return (
                <TableRow key={`${row.date}-${idx}`} className={cn(meta.rowClass)}>
                  <TableCell className="text-muted-foreground text-xs">
                    <div className="flex items-center gap-1">
                      {isPast && row.kind !== 'start' && <Check className="h-3 w-3 text-success" />}
                      {idx + 1}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{formatDisplayDate(row.date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className={cn('h-4 w-4 shrink-0', meta.iconClass)} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate flex items-center gap-1.5">
                          {row.label}
                          {meta.badge && (
                            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4', meta.badgeClass)}>
                              {meta.badge}
                            </Badge>
                          )}
                          {row.lateFee ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-warning/20 text-warning border-warning/40">
                              Late fee {fmt(row.lateFee)}
                            </Badge>
                          ) : null}
                        </div>
                        {row.sublabel && (
                          <div className="text-[11px] text-muted-foreground truncate">{row.sublabel}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{row.daysSincePrior || '—'}</TableCell>
                  <TableCell className="text-right text-sm">
                    {row.drawAmount ? <span className="text-blue-400">{fmtSigned(row.drawAmount, '+')}</span> : '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {row.principalPaid ? <span className="text-success">{fmtSigned(row.principalPaid, '-')}</span> : '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {row.interestAccrued > 0.005 ? fmt(row.interestAccrued) : '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {row.interestPaid ? <span className="text-success">{fmtSigned(row.interestPaid, '-')}</span> : '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold">{fmt(row.balance)}</TableCell>
                  <TableCell className={cn('text-right text-sm', row.unpaidInterest > 0 ? 'text-destructive' : 'text-muted-foreground')}>
                    {fmt(row.unpaidInterest)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-1">
        <span className="flex items-center gap-1"><ArrowUpCircle className="h-3 w-3 text-blue-400" /> Draw funded</span>
        <span className="flex items-center gap-1"><ArrowDownCircle className="h-3 w-3 text-success" /> Payment</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-primary" /> Live position</span>
        <span className="flex items-center gap-1"><CircleDashed className="h-3 w-3" /> Pending draw</span>
        <span className="flex items-center gap-1"><Flag className="h-3 w-3 text-destructive" /> Maturity (balloon)</span>
      </div>
    </div>
  );
}
