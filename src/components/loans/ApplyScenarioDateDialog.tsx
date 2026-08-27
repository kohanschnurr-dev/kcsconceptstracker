import { useEffect, useState } from 'react';
import { CalendarClock, FileClock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatDisplayDate } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

export type ApplyMode = 'maturity' | 'extension';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payoffDate: string;
  currentMaturity: string;
  payoffTotal: number;
  defaultFee: number;
  submitting?: boolean;
  onConfirm: (choice: { mode: ApplyMode; fee: number }) => void;
}

export function ApplyScenarioDateDialog({
  open,
  onOpenChange,
  payoffDate,
  currentMaturity,
  payoffTotal,
  defaultFee,
  submitting,
  onConfirm,
}: Props) {
  const [mode, setMode] = useState<ApplyMode>('extension');
  const [fee, setFee] = useState(String(defaultFee || ''));

  useEffect(() => {
    if (open) setFee(defaultFee ? String(defaultFee) : '');
  }, [open, defaultFee]);

  const options: { value: ApplyMode; Icon: typeof CalendarClock; title: string; desc: string }[] = [
    {
      value: 'maturity',
      Icon: CalendarClock,
      title: 'Update maturity date',
      desc: `Changes the loan's maturity from ${formatDisplayDate(currentMaturity)} to ${formatDisplayDate(payoffDate)}.`,
    },
    {
      value: 'extension',
      Icon: FileClock,
      title: 'Record an extension',
      desc: 'Keeps the original maturity and logs an extension with an optional fee.',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply {formatDisplayDate(payoffDate)}</DialogTitle>
          <DialogDescription>
            Projected payoff at this date is <span className="font-semibold text-foreground">{fmt(payoffTotal)}</span>.
            Choose how to record it on the loan.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={mode} onValueChange={(v) => setMode(v as ApplyMode)} className="gap-2">
          {options.map(({ value, Icon, title, desc }) => (
            <label
              key={value}
              htmlFor={`apply-${value}`}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
                mode === value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40',
              )}
            >
              <RadioGroupItem value={value} id={`apply-${value}`} className="mt-0.5" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Icon className="h-4 w-4 text-primary" />
                  {title}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </label>
          ))}
        </RadioGroup>

        {mode === 'extension' && (
          <div className="space-y-1.5">
            <Label htmlFor="scenario-fee" className="text-xs">Extension fee ($)</Label>
            <Input
              id="scenario-fee"
              type="number"
              min={0}
              placeholder="0"
              className="font-mono"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm({ mode, fee: parseFloat(fee) || 0 })}
            disabled={submitting}
          >
            {submitting ? 'Applying…' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
