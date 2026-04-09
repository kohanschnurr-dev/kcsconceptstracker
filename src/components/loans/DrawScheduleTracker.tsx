import { useState } from 'react';
import { Plus, Trash2, TrendingUp, Calculator, CalendarIcon, Pencil, Check, X } from 'lucide-react';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<LoanDraw>>({});
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

  const interestResult: DrawInterestResult | null = loan
    ? buildDrawInterestSchedule(loan, draws)
    : null;

  const handleStatusChange = (draw: LoanDraw, status: DrawStatus) => {
    // Auto-set funded date to today when marking as funded without an existing date
    let dateFunded = draw.date_funded;
    if (status === 'funded' && !draw.date_funded) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      dateFunded = `${yyyy}-${mm}-${dd}`;
    }
    onUpsert({ ...draw, status, date_funded: dateFunded }, loanId);
  };

  const handleDateFundedChange = (draw: LoanDraw, date: string) => {
    onUpsert({ ...draw, date_funded: date || null }, loanId);
  };

  const startEdit = (draw: LoanDraw) => {
    setEditingId(draw.id);
    setEditDraft({ milestone_name: draw.milestone_name, draw_amount: draw.draw_amount, expected_date: draw.expected_date });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({});
  };

  const saveEdit = (draw: LoanDraw) => {
    onUpsert({ ...draw, ...editDraft, draw_amount: editDraft.draw_amount || draw.draw_amount }, loanId);
    setEditingId(null);
    setEditDraft({});
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
    <div className="space-y-5">
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Draw Schedule</CardTitle>
            {!readOnly && (
              <Button size="sm" variant="outline" onClick={() => setAddingNew(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Add Draw
              </Button>
            )}
          </div>
          {totalDrawAmount != null && totalDrawAmount > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{fmt(totalFunded)} funded of {fmt(totalDrawAmount)}</span>
                <span className="font-medium">{pctFunded.toFixed(0)}%</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-success transition-all duration-500"
                  style={{ width: `${Math.min(pctFunded, 100)}%` }}
                />
              </div>
              {totalRequested > 0 && (
                <p className="text-sm text-warning">{fmt(totalRequested)} pending approval</p>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {draws.length === 0 && !addingNew && (
            <p className="text-sm text-muted-foreground py-6 text-center">No draws recorded yet.</p>
          )}
          {draws.map(draw => {
            const isEditing = editingId === draw.id;
            return (
              <div key={draw.id} className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {draw.draw_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Milestone Name</Label>
                            <Input
                              className="mt-1 h-9"
                              value={editDraft.milestone_name ?? ''}
                              onChange={e => setEditDraft(d => ({ ...d, milestone_name: e.target.value }))}
                              placeholder="e.g. Foundation Complete"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Amount ($)</Label>
                            <Input
                              className="mt-1 h-9"
                              type="number"
                              value={editDraft.draw_amount || ''}
                              onChange={e => setEditDraft(d => ({ ...d, draw_amount: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Expected Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="mt-1 h-9 w-full justify-start text-sm font-normal gap-2">
                                  <CalendarIcon className="h-3.5 w-3.5" />
                                  {editDraft.expected_date ? formatDisplayDate(editDraft.expected_date) : 'Pick date'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={editDraft.expected_date ? new Date(editDraft.expected_date + 'T00:00:00') : undefined}
                                  onSelect={date => {
                                    if (date) {
                                      const yyyy = date.getFullYear();
                                      const mm = String(date.getMonth() + 1).padStart(2, '0');
                                      const dd = String(date.getDate()).padStart(2, '0');
                                      setEditDraft(d => ({ ...d, expected_date: `${yyyy}-${mm}-${dd}` }));
                                    } else {
                                      setEditDraft(d => ({ ...d, expected_date: null }));
                                    }
                                  }}
                                  initialFocus
                                  className={cn('p-3 pointer-events-auto')}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEdit(draw)} className="gap-1.5">
                            <Check className="h-3.5 w-3.5" /> Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1.5">
                            <X className="h-3.5 w-3.5" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-base font-semibold truncate">
                            {draw.milestone_name || `Draw #${draw.draw_number}`}
                          </span>
                          <span className="text-base font-bold text-primary flex-shrink-0">{fmt(draw.draw_amount)}</span>
                        </div>
                        <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                          {(() => {
                            const displayDate = draw.date_funded || draw.expected_date;
                            if (!readOnly) {
                              return (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        'h-7 text-sm px-2.5 gap-1.5 font-normal',
                                        !displayDate && 'text-muted-foreground',
                                      )}
                                    >
                                      <CalendarIcon className="h-3.5 w-3.5" />
                                      {displayDate ? formatDisplayDate(displayDate) : 'Set date'}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={displayDate ? new Date(displayDate + 'T00:00:00') : undefined}
                                      onSelect={date => {
                                        if (date) {
                                          const yyyy = date.getFullYear();
                                          const mm = String(date.getMonth() + 1).padStart(2, '0');
                                          const dd = String(date.getDate()).padStart(2, '0');
                                          const dateStr = `${yyyy}-${mm}-${dd}`;
                                          handleDateFundedChange(draw, dateStr);
                                        } else {
                                          handleDateFundedChange(draw, '');
                                        }
                                      }}
                                      initialFocus
                                      className={cn('p-3 pointer-events-auto')}
                                    />
                                  </PopoverContent>
                                </Popover>
                              );
                            }
                            return displayDate ? (
                              <span className="text-sm text-muted-foreground">
                                {formatDisplayDate(displayDate)}
                              </span>
                            ) : null;
                          })()}
                          {readOnly ? (
                            <Badge variant="outline" className={cn('text-sm', DRAW_STATUS_CONFIG[draw.status].className)}>
                              {DRAW_STATUS_CONFIG[draw.status].label}
                            </Badge>
                          ) : (
                            <Select value={draw.status} onValueChange={v => handleStatusChange(draw, v as DrawStatus)}>
                              <SelectTrigger className="h-7 text-sm px-2.5 w-auto">
                                <Badge variant="outline" className={cn('text-sm cursor-pointer', DRAW_STATUS_CONFIG[draw.status].className)}>
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
                      </>
                    )}
                  </div>
                  {!readOnly && !isEditing && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(draw)} className="text-muted-foreground hover:text-primary p-1 rounded transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => onDelete(draw.id)} className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {addingNew && (
            <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-4">
              <p className="text-sm font-semibold text-primary">New Draw #{draws.length + 1}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Milestone Name</Label>
                  <Input className="mt-1 h-9" value={newDraw.milestone_name ?? ''} onChange={e => setNewDraw(d => ({ ...d, milestone_name: e.target.value }))} placeholder="e.g. Framing" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Amount ($)</Label>
                  <Input className="mt-1 h-9" type="number" value={newDraw.draw_amount || ''} onChange={e => setNewDraw(d => ({ ...d, draw_amount: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Expected Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="mt-1 h-9 w-full justify-start text-sm font-normal gap-2">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {newDraw.expected_date ? formatDisplayDate(newDraw.expected_date) : 'Pick date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newDraw.expected_date ? new Date(newDraw.expected_date + 'T00:00:00') : undefined}
                        onSelect={date => {
                          if (date) {
                            const yyyy = date.getFullYear();
                            const mm = String(date.getMonth() + 1).padStart(2, '0');
                            const dd = String(date.getDate()).padStart(2, '0');
                            setNewDraw(d => ({ ...d, expected_date: `${yyyy}-${mm}-${dd}` }));
                          } else {
                            setNewDraw(d => ({ ...d, expected_date: null }));
                          }
                        }}
                        initialFocus
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </PopoverContent>
                  </Popover>
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
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Interest Accrual by Draw</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Interest calculated on cumulative funded balance between draws
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-xl font-bold text-warning">{fmtExact(interestResult.totalInterest)}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Accrued Interest</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-xl font-bold text-primary">{fmt(interestResult.weightedAvgBalance)}</p>
                <p className="text-sm text-muted-foreground mt-1">Weighted Avg Balance</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-xl font-bold text-foreground">{interestResult.periods.reduce((s, p) => s + p.days, 0)}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Days</p>
              </div>
            </div>

            {/* Period breakdown table */}
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Period</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Dates</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Days</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Balance</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Interest</th>
                  </tr>
                </thead>
                <tbody>
                  {interestResult.periods.map((p, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="font-medium">{p.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {formatDisplayDate(p.startDate)} – {formatDisplayDate(p.endDate)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{p.days}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{fmt(p.balance)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-warning tabular-nums">{fmtExact(p.interest)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50">
                    <td className="px-4 py-3 font-semibold" colSpan={2}>Total</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {interestResult.periods.reduce((s, p) => s + p.days, 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{fmt(interestResult.weightedAvgBalance)}</td>
                    <td className="px-4 py-3 text-right font-bold text-warning tabular-nums">{fmtExact(interestResult.totalInterest)}</td>
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
