import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  Download, Check, ArrowUpCircle, ArrowDownCircle, Clock, Flag, Play, CircleDashed,
  Target, CalendarIcon, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ApplyScenarioDateDialog, type ApplyMode } from '@/components/loans/ApplyScenarioDateDialog';
import { buildInterestSchedule, type Loan, type LoanDraw, type LoanPayment, type InterestLedgerKind } from '@/types/loans';
import { formatDisplayDate, parseDateString } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

const fmt = (v: number | undefined | null) =>
  v == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);

const fmtRound = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const fmtSigned = (v: number, sign: '+' | '-') => `${sign}${fmt(Math.abs(v)).replace('-', '')}`;

const toISO = (d: Date) => format(d, 'yyyy-MM-dd');

interface Props {
  loan: Loan;
  draws: LoanDraw[];
  payments: LoanPayment[];
  extensions?: { extended_to: string }[];
  onApplyScenario?: (args: { mode: ApplyMode; payoffDate: string; fee: number }) => Promise<void> | void;
}

const KIND_META: Record<InterestLedgerKind, { Icon: typeof Play; iconClass: string; rowClass: string; badge?: string; badgeClass?: string }> = {
  start:           { Icon: Play,            iconClass: 'text-muted-foreground',   rowClass: '' },
  draw:            { Icon: ArrowUpCircle,   iconClass: 'text-blue-400',           rowClass: '' },
  payment:         { Icon: ArrowDownCircle, iconClass: 'text-success',            rowClass: '' },
  today:           { Icon: Clock,           iconClass: 'text-primary',            rowClass: 'bg-primary/10 hover:bg-primary/15 border-l-2 border-l-primary', badge: 'Today', badgeClass: 'bg-primary/20 text-primary border-primary/40' },
  pending_draw:    { Icon: CircleDashed,    iconClass: 'text-muted-foreground',   rowClass: 'opacity-70',  badge: 'Projected', badgeClass: 'bg-muted text-muted-foreground border-border' },
  maturity:        { Icon: Flag,            iconClass: 'text-destructive',        rowClass: 'opacity-70 border-l-2 border-l-destructive/60 border-dashed', badge: 'Projected', badgeClass: 'bg-destructive/20 text-destructive border-destructive/40' },
  scenario_payoff: { Icon: Target,          iconClass: 'text-primary',            rowClass: 'bg-primary/5 border-l-2 border-l-primary border-dashed', badge: 'Scenario', badgeClass: 'bg-primary/20 text-primary border-primary/40' },
};

export function InterestScheduleTable({ loan, draws, payments, extensions = [], onApplyScenario }: Props) {
  const [scenarioOn, setScenarioOn] = useState(false);
  const [payoffDate, setPayoffDate] = useState<Date | undefined>();
  const [includePendingDraws, setIncludePendingDraws] = useState(true);
  const [feeMode, setFeeMode] = useState<'pct' | 'flat'>('pct');
  const [feeValue, setFeeValue] = useState('');
  const [applyOpen, setApplyOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  const todayISO = toISO(new Date());
  const payoffISO = payoffDate ? toISO(payoffDate) : undefined;
  const scenarioActive = scenarioOn && !!payoffISO && payoffISO > todayISO;

  const base = useMemo(
    () => buildInterestSchedule({ loan, draws, payments, extensions }),
    [loan, draws, payments, extensions],
  );

  const feeDollars = useMemo(() => {
    const n = parseFloat(feeValue);
    if (!n || n <= 0) return 0;
    return feeMode === 'pct' ? (loan.original_amount ?? 0) * (n / 100) : n;
  }, [feeValue, feeMode, loan.original_amount]);

  const result = useMemo(() => {
    if (!scenarioActive) return base;
    return buildInterestSchedule({
      loan,
      draws,
      payments,
      extensions,
      scenario: { payoffDate: payoffISO!, includePendingDraws, extensionFee: feeDollars },
    });
  }, [scenarioActive, base, loan, draws, payments, extensions, payoffISO, includePendingDraws, feeDollars]);

  const scenario = result.scenario;

  const resetScenario = () => {
    setScenarioOn(false);
    setPayoffDate(undefined);
    setFeeValue('');
    setIncludePendingDraws(true);
  };

  const handleApply = async ({ mode, fee }: { mode: ApplyMode; fee: number }) => {
    if (!onApplyScenario || !payoffISO) return;
    setApplying(true);
    try {
      await onApplyScenario({ mode, payoffDate: payoffISO, fee });
      setApplyOpen(false);
      resetScenario();
    } finally {
      setApplying(false);
    }
  };

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
      r.kind === 'today' ? 'Live' : r.kind === 'scenario_payoff' ? 'Scenario' : r.isFuture ? 'Projected' : 'Past',
    ]);
    if (scenario) {
      rows.push([]);
      rows.push(['Scenario payoff date', scenario.payoffDate]);
      rows.push(['Scenario payoff total', scenario.payoffTotal.toFixed(2)]);
      rows.push(['Scenario extension fee', scenario.extensionFee.toFixed(2)]);
      rows.push(['Scenario days held', scenario.daysHeld]);
    }
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interest-schedule-${loan.nickname ?? loan.lender_name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tiles = scenario
    ? [
        { label: 'Payoff Amount', value: fmt(scenario.payoffTotal), hint: `Principal + interest${scenario.extensionFee ? ' + fee' : ''} on ${formatDisplayDate(scenario.payoffDate)}`, accent: '' },
        { label: 'Interest at Payoff', value: fmt(scenario.unpaidInterest), hint: `${fmt(scenario.additionalInterest)} more than today`, accent: 'text-destructive' },
        { label: 'Days Held', value: `${scenario.daysHeld}`, hint: `${(scenario.daysHeld / 30.44).toFixed(1)} months from today`, accent: '' },
      ]
    : [
        { label: 'Currently Holding', value: fmt(result.currentBalance), hint: 'Outstanding principal today', accent: '' },
        { label: 'Interest Accrued (Unpaid)', value: fmt(result.currentUnpaidInterest), hint: 'Live through today', accent: 'text-destructive' },
        { label: 'Total Disbursed', value: fmt(result.totalDisbursed), hint: 'Original + funded draws', accent: '' },
      ];

  return (
    <div className="space-y-4">
      {/* Scenario bar */}
      <div className={cn(
        'rounded-lg border p-3 transition-colors',
        scenarioActive ? 'border-primary/50 bg-primary/5' : 'border-border bg-card',
      )}>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-2">
            <Switch id="scenario-toggle" checked={scenarioOn} onCheckedChange={setScenarioOn} />
            <Label htmlFor="scenario-toggle" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
              <Target className="h-4 w-4 text-primary" /> Payoff scenario
            </Label>
          </div>

          {scenarioOn && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Hold until</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn('justify-start font-normal', !payoffDate && 'text-muted-foreground')}>
                      <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                      {payoffDate ? format(payoffDate, 'MMM d, yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={payoffDate}
                      onSelect={setPayoffDate}
                      disabled={(d) => toISO(d) <= todayISO}
                      defaultMonth={payoffDate ?? parseDateString(result.effectiveMaturity) ?? undefined}
                      initialFocus
                      className={cn('p-3 pointer-events-auto')}
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground"
                  onClick={() => setPayoffDate(parseDateString(result.effectiveMaturity) ?? undefined)}
                >
                  Maturity
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Switch id="scenario-draws" checked={includePendingDraws} onCheckedChange={setIncludePendingDraws} />
                <Label htmlFor="scenario-draws" className="text-xs cursor-pointer">Assume pending draws fund</Label>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Ext. fee</span>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  className="h-8 w-24 font-mono text-xs"
                  value={feeValue}
                  onChange={(e) => setFeeValue(e.target.value)}
                />
                <div className="flex rounded border border-input overflow-hidden">
                  <button
                    type="button"
                    className={cn('text-[10px] font-mono font-medium px-2 py-1 transition-colors',
                      feeMode === 'pct' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent')}
                    onClick={() => setFeeMode('pct')}
                  >%</button>
                  <button
                    type="button"
                    className={cn('text-[10px] font-mono font-medium px-2 py-1 transition-colors',
                      feeMode === 'flat' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent')}
                    onClick={() => setFeeMode('flat')}
                  >$</button>
                </div>
                {feeMode === 'pct' && feeDollars > 0 && (
                  <span className="text-[11px] text-muted-foreground font-mono">= {fmtRound(feeDollars)}</span>
                )}
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={resetScenario} className="text-muted-foreground">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
                </Button>
                {onApplyScenario && (
                  <Button size="sm" disabled={!scenarioActive} onClick={() => setApplyOpen(true)}>
                    Apply this date…
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {scenarioOn && !scenarioActive && (
          <p className="text-[11px] text-muted-foreground mt-2">
            Pick a future date to project the payoff. Nothing is saved until you apply it.
          </p>
        )}

        {scenario && (
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border/60 pt-2 text-[11px]">
            <span className="text-muted-foreground">
              Extra interest vs. today <span className="font-semibold text-destructive">{fmt(scenario.additionalInterest)}</span>
            </span>
            <span className="text-muted-foreground">
              Effective annualized cost <span className="font-semibold text-foreground">{scenario.effectiveAnnualRate.toFixed(2)}%</span>
            </span>
            {scenario.extensionFee > 0 && (
              <span className="text-muted-foreground">
                Assumed extension fee <span className="font-semibold text-foreground">{fmtRound(scenario.extensionFee)}</span>
              </span>
            )}
            {scenario.pastMaturity && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-warning/20 text-warning border-warning/40">
                {formatDisplayDate(scenario.payoffDate)} is past maturity
              </Badge>
            )}
            <span className="text-muted-foreground italic ml-auto">View only — the loan is unchanged.</span>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tiles.map((t) => (
          <div
            key={t.label}
            className={cn('rounded-lg border p-3', scenario ? 'border-primary/40 bg-primary/5' : 'border-border bg-card')}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{t.label}</p>
              {scenario && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary border-primary/40">
                  Scenario
                </Badge>
              )}
            </div>
            <p className={cn('text-base font-semibold mt-0.5', t.accent)}>{t.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{t.hint}</p>
          </div>
        ))}
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
              const assumedFunded = scenario && row.kind === 'pending_draw';
              return (
                <TableRow key={`${row.date}-${idx}`} className={cn(meta.rowClass, assumedFunded && 'opacity-100')}>
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
                            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4', assumedFunded ? 'bg-primary/20 text-primary border-primary/40' : meta.badgeClass)}>
                              {assumedFunded ? 'Assumed' : meta.badge}
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
        <span className="flex items-center gap-1"><Target className="h-3 w-3 text-primary" /> Scenario payoff</span>
      </div>

      {payoffISO && scenario && (
        <ApplyScenarioDateDialog
          open={applyOpen}
          onOpenChange={setApplyOpen}
          payoffDate={payoffISO}
          currentMaturity={result.effectiveMaturity}
          payoffTotal={scenario.payoffTotal}
          defaultFee={Math.round(feeDollars)}
          submitting={applying}
          onConfirm={handleApply}
        />
      )}
    </div>
  );
}
