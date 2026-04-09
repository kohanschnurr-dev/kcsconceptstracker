import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, ArrowRight, CalendarIcon, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface LoanExtension {
  id: string;
  loan_id: string;
  extension_number: number;
  extended_from: string;
  extended_to: string;
  extension_fee: number;
  fee_percentage: number | null;
  notes: string | null;
  created_at: string;
}

interface Props {
  extensions: LoanExtension[];
  loanId: string;
  maturityDate: string;
  onAdd: (ext: { loan_id: string; extension_number: number; extended_from: string; extended_to: string; extension_fee?: number; fee_percentage?: number; notes?: string }) => void;
  onDelete: (id: string) => void;
}

const fmt = (v: number | null | undefined) =>
  v == null
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

export function LoanExtensions({ extensions, loanId, maturityDate, onAdd, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [fee, setFee] = useState('');
  const [feePercent, setFeePercent] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!fromDate || !toDate) return;
    onAdd({
      loan_id: loanId,
      extension_number: extensions.length + 1,
      extended_from: format(fromDate, 'yyyy-MM-dd'),
      extended_to: format(toDate, 'yyyy-MM-dd'),
      extension_fee: fee ? parseFloat(fee) : 0,
      fee_percentage: feePercent ? parseFloat(feePercent) : undefined,
      notes: notes || undefined,
    });
    setShowForm(false);
    setFromDate(undefined);
    setToDate(undefined);
    setFee('');
    setFeePercent('');
    setNotes('');
  };

  const totalFees = extensions.reduce((s, e) => s + (e.extension_fee ?? 0), 0);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Loan Extensions {extensions.length > 0 && <span className="text-primary">({extensions.length})</span>}
          </CardTitle>
          {!showForm && (
            <Button size="sm" variant="outline" onClick={() => {
              setFromDate(extensions.length > 0 ? new Date(extensions[extensions.length - 1].extended_to) : new Date(maturityDate));
              setShowForm(true);
            }}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Extension
            </Button>
          )}
        </div>
        {extensions.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Total extension fees: <span className="font-semibold text-warning">{fmt(totalFees)}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {extensions.length === 0 && !showForm && (
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">No extensions recorded</p>
            <Button size="sm" variant="outline" onClick={() => {
              setFromDate(new Date(maturityDate));
              setShowForm(true);
            }}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Record First Extension
            </Button>
          </div>
        )}

        {extensions.map((ext) => (
          <div key={ext.id} className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border-l-4 border-primary">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold">Extension #{ext.extension_number}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  {format(new Date(ext.extended_from), 'MMM d, yyyy')}
                  <ArrowRight className="h-3 w-3" />
                  {format(new Date(ext.extended_to), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm font-semibold text-warning flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  {fmt(ext.extension_fee)}
                  {ext.fee_percentage != null && <span className="text-xs text-muted-foreground">({ext.fee_percentage}%)</span>}
                </span>
              </div>
              {ext.notes && <p className="text-xs text-muted-foreground mt-1">{ext.notes}</p>}
            </div>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(ext.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}

        {showForm && (
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
            <p className="text-sm font-semibold">New Extension</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Extended From</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !fromDate && 'text-muted-foreground')}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {fromDate ? format(fromDate, 'PPP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Extended To</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !toDate && 'text-muted-foreground')}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {toDate ? format(toDate, 'PPP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Extension Fee ($)</label>
                <Input type="number" placeholder="0" value={fee} onChange={e => setFee(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Fee % (optional)</label>
                <Input type="number" step="0.1" placeholder="e.g. 1.0" value={feePercent} onChange={e => setFeePercent(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Notes (optional)</label>
              <Textarea rows={2} placeholder="Extension terms, conditions..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={!fromDate || !toDate}>Save Extension</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
