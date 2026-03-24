import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface LoanCostCalculatorProps {
  onApply: (value: string) => void;
}

export function LoanCostCalculator({ onApply }: LoanCostCalculatorProps) {
  const [open, setOpen] = useState(false);
  const [loanAmount, setLoanAmount] = useState(200000);
  const [interestRate, setInterestRate] = useState(10);
  const [termMonths, setTermMonths] = useState(6);
  const [points, setPoints] = useState(2);

  const monthlyInterest = loanAmount * (interestRate / 100 / 12);
  const totalInterest = monthlyInterest * termMonths;
  const pointsCost = loanAmount * (points / 100);
  const totalLoanCosts = totalInterest + pointsCost;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const handleApply = () => {
    onApply(Math.round(totalLoanCosts).toString());
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
          title="Quick loan cost calculator"
        >
          <Calculator className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end" side="top">
        <div className="p-3 border-b border-border bg-muted/30 rounded-t-md">
          <p className="text-xs font-semibold text-foreground">Loan Cost Estimator</p>
          <p className="text-[10px] text-muted-foreground">Quick guesstimate for loan expenses</p>
        </div>

        <div className="p-3 space-y-3">
          {/* Loan Amount */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Loan Amount</Label>
              <span className="text-xs font-mono text-muted-foreground">{fmt(loanAmount)}</span>
            </div>
            <Input
              type="number"
              value={loanAmount || ''}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="h-7 text-xs font-mono"
              placeholder="200000"
            />
          </div>

          {/* Interest Rate */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Interest Rate</Label>
              <span className="text-xs font-mono text-primary font-semibold">{interestRate}%</span>
            </div>
            <Slider
              value={[interestRate]}
              onValueChange={([v]) => setInterestRate(v)}
              min={1}
              max={20}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Term */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Term</Label>
              <span className="text-xs font-mono text-muted-foreground">{termMonths} mo</span>
            </div>
            <Slider
              value={[termMonths]}
              onValueChange={([v]) => setTermMonths(v)}
              min={1}
              max={36}
              step={1}
              className="w-full"
            />
          </div>

          {/* Points */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Points</Label>
              <span className="text-xs font-mono text-muted-foreground">{points}%</span>
            </div>
            <Slider
              value={[points]}
              onValueChange={([v]) => setPoints(v)}
              min={0}
              max={5}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Results */}
          <div className="rounded-md bg-secondary/50 border border-border/50 p-2 space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Monthly Interest</span>
              <span className="font-mono">{fmt(monthlyInterest)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Total Interest ({termMonths}mo)</span>
              <span className="font-mono">{fmt(totalInterest)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Points Cost ({points}%)</span>
              <span className="font-mono">{fmt(pointsCost)}</span>
            </div>
            <div className="border-t border-border/50 pt-1 flex justify-between text-xs font-semibold">
              <span className="text-foreground">Total Loan Costs</span>
              <span className="text-primary font-mono">{fmt(totalLoanCosts)}</span>
            </div>
          </div>

          <Button size="sm" className="w-full h-7 text-xs" onClick={handleApply}>
            Apply {fmt(totalLoanCosts)}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
