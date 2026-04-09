import { useState } from 'react';
import { Plus, Trash2, TrendingUp, Calculator, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DRAW_STATUS_CONFIG, buildDrawInterestSchedule } from '@/types/loans';
import type { LoanDraw, DrawStatus, Loan, DrawInterestResult } from '@/types/loans';
import { formatDisplayDate } from '@/lib/dateUtils';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const fmtExact = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

interface DrawScheduleTrackerProps {
  draws: LoanDraw[];
  totalDrawAmount: number | null;
  onUpsert: (draw: Partial<LoanDraw> & { draw_number: number; draw_amount: number; loan_id: string }, loanId: string) => void;
  onDelete: (id: string) => void;
  loanId: string;
  loan?: Pick<Loan, 'interest_rate' | 'interest_calc_method' | 'maturity_date' | 'start_date'>;
  readOnly?: boolean;
}

export function DrawScheduleTracker({
  draws, totalDrawAmount, onUpsert, onDelete, loanId, loan, readOnly = false,
}: DrawScheduleTrackerProps) {
  const [addingNew, setAddingNew] = useState(false);
  const [newDraw, setNewDraw] = useState<Partial<LoanDraw>>({
    draw_number: draws.length + 1,
    milestone_name: '',
    draw_amount: 0,
    status: 'pending',
  });

  const totalFunded = draws
    .filter(d => d.status === 'funded')
    .reduce((s, d) => s + d.draw_amount, 0);

  const totalRequested = draws
    .filter(d => d.status === 'requested' || d.status === 'approved')
    .reduce((s, d) => s + d.draw_amount, 0);

  const pctFunded = totalDrawAmount ? (totalFunded / totalDrawAmount) * 100 : 0;

  // Draw-based interest calculation
  const interestResult: DrawInterestResult | null = loan
    ? buildDrawInterestSchedule(loan, draws)
    : null;

  const handleStatusChange = (draw: LoanDraw, status: DrawStatus) => {
    onUpsert({ ...draw, status }, loanId);
  };

  const handleDateFundedChange = (draw: LoanDraw, date: string) => {
    onUpsert({ ...draw, date_funded: date || null }, loanId);
  };

  const handleSaveNew = () => {
    if (!newDraw.draw_amount) return;
    onUpsert(
      { ...newDraw, draw_number: draws.length + 1, draw_amount: newDraw.draw_amount!, loan_id: loanId } as any,
      loanId,
    );
    setAddingNew(false);
    setNewDraw({ draw_number: draws.length + 2, milestone_name: '', draw_amount: 0, status: 'pending' });
  };

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Draw Schedule</CardTitle>
            {!readOnly && (
              <Button size="sm" variant="outline" onClick={() => setAddingNew(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Draw
              </Button>
            )}
          </div>
          {totalDrawAmount != null && totalDrawAmount > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{fmt(totalFunded)} funded of {fmt(totalDrawAmount)}</span>
                <span>{pctFunded.toFixed(0)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-success transition-all duration-500"
                  style={{ width: `${Math.min(pctFunded, 100)}%` }}
                />
              </div>
              {totalRequested > 0 && (
                <p className="text-xs text-warning">{fmt(totalRequested)} pending approval</p>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {draws.length === 0 && !addingNew && (
            <p className="text-sm text-muted-foreground py-4 text-center">No draws recorded yet.</p>
          )}
          {draws.map(draw => (
            <div key={draw.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0">
                {draw.draw_number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">
                    {draw.milestone_name || `Draw #${draw.draw_number}`}
                  </span>
                  <span className="text-sm font-semibold text-primary flex-shrink-0">{fmt(draw.draw_amount)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {draw.expected_date && (
                    <span className="text-xs text-muted-foreground">
                      Expected {formatDisplayDate(draw.expected_date)}
                    </span>
                  )}
                  {/* Editable date funded */}
                  {!readOnly ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Funded:</span>
                      <Input
                        type="date"
                        className="h-6 text-xs px-1.5 w-[120px] bg-transparent"
                        value={draw.date_funded ?? ''}
                        onChange={e => handleDateFundedChange(draw, e.target.value)}
                      />
                    </div>
                  ) : (
                    draw.date_funded && (
                      <span className="text-xs text-success">
                        Funded {formatDisplayDate(draw.date_funded)}
                      </span>
                    )
                  )}
                  {readOnly ? (
                    <Badge variant="outline" className={cn('text-xs', DRAW_STATUS_CONFIG[draw.status].className)}>
                      {DRAW_STATUS_CONFIG[draw.status].label}
                    </Badge>
                  ) : (
                    <Select value={draw.status} onValueChange={v => handleStatusChange(draw, v as DrawStatus)}>
                      <SelectTrigger className="h-6 text-xs px-2 w-auto">
                        <Badge variant="outline" className={cn('text-xs cursor-pointer', DRAW_STATUS_CONFIG[draw.status].className)}>
                          {DRAW_STATUS_CONFIG[draw.status].label}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DRAW_STATUS_CONFIG).map(([v, cfg]) => (
                          <SelectItem key={v} value={v}>{cfg.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              {!readOnly && (
                <button onClick={() => onDelete(draw.id)} className="text-muted-foreground hover:text-destructive flex-shrink-0 mt-0.5">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}

          {addingNew && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
              <p className="text-xs font-medium text-primary">New Draw #{draws.length + 1}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Milestone Name</Label>
                  <Input className="mt-0.5 h-8 text-sm" value={newDraw.milestone_name ?? ''} onChange={e => setNewDraw(d => ({ ...d, milestone_name: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Amount ($)</Label>
                  <Input className="mt-0.5 h-8 text-sm" type="number" value={newDraw.draw_amount || ''} onChange={e => setNewDraw(d => ({ ...d, draw_amount: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                  <Label className="text-xs">Expected Date</Label>
                  <Input className="mt-0.5 h-8 text-sm" type="date" value={newDraw.expected_date ?? ''} onChange={e => setNewDraw(d => ({ ...d, expected_date: e.target.value || null }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveNew}>Save Draw</Button>
                <Button size="sm" variant="outline" onClick={() => setAddingNew(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Draw-Based Interest Accrual Summary */}
      {interestResult && interestResult.periods.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Interest Accrual by Draw</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Interest calculated on cumulative funded balance between draws
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <p className="text-lg font-bold text-warning">{fmtExact(interestResult.totalInterest)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total Accrued Interest</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <p className="text-lg font-bold text-primary">{fmt(interestResult.weightedAvgBalance)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Weighted Avg Balance</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <p className="text-lg font-bold text-foreground">{interestResult.periods.reduce((s, p) => s + p.days, 0)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total Days</p>
              </div>
            </div>

            {/* Period breakdown table */}
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Period</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Dates</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Days</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Balance</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Interest</th>
                  </tr>
                </thead>
                <tbody>
                  {interestResult.periods.map((p, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          <span className="font-medium text-sm">{p.label}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs text-muted-foreground">
                        {formatDisplayDate(p.startDate)} – {formatDisplayDate(p.endDate)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{p.days}</td>
                      <td className="px-3 py-2.5 text-right font-medium tabular-nums">{fmt(p.balance)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-warning tabular-nums">{fmtExact(p.interest)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50">
                    <td className="px-3 py-2.5 font-semibold text-sm" colSpan={2}>Total</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                      {interestResult.periods.reduce((s, p) => s + p.days, 0)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{fmt(interestResult.weightedAvgBalance)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-warning tabular-nums">{fmtExact(interestResult.totalInterest)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
