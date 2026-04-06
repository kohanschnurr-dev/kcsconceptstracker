import { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { FormulaInput } from '@/components/ui/formula-input';
import { cn } from '@/lib/utils';
import { LoanCostCalculator } from './LoanCostCalculator';

const LOAN_CATEGORIES = new Set([
  'loan_costs', 'lending_fees', 'financing', 'loan_points',
  'hard_money', 'interest', 'loan_origination',
]);

const PSF_MODES_KEY = 'budget-psf-modes';

function loadPsfModes(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(PSF_MODES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function savePsfMode(category: string, isPsf: boolean) {
  const modes = loadPsfModes();
  modes[category] = isPsf;
  localStorage.setItem(PSF_MODES_KEY, JSON.stringify(modes));
}

interface BudgetCategoryCardProps {
  category: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  hasPreset?: boolean;
  sqft?: string;
}

export function BudgetCategoryCard({ 
  category, 
  label, 
  value, 
  onChange,
  icon,
  hasPreset,
  sqft,
}: BudgetCategoryCardProps) {
  const sqftNum = parseFloat(sqft || '') || 0;
  const hasSqft = sqftNum > 0;

  const [isPsf, setIsPsf] = useState(() => {
    if (!hasSqft) return false;
    return loadPsfModes()[category] ?? false;
  });

  const [psfRate, setPsfRate] = useState(() => {
    if (!hasSqft) return '';
    const val = parseFloat(value) || 0;
    if (val > 0 && loadPsfModes()[category]) {
      return String(Math.round((val / sqftNum) * 100) / 100);
    }
    return '';
  });

  // Sync psfRate when value changes externally and we're in psf mode
  useEffect(() => {
    if (isPsf && hasSqft) {
      const val = parseFloat(value) || 0;
      if (val > 0) {
        const rate = Math.round((val / sqftNum) * 100) / 100;
        setPsfRate(String(rate));
      } else {
        setPsfRate('');
      }
    }
  }, [value, isPsf, hasSqft, sqftNum]);

  const toggleMode = () => {
    const next = !isPsf;
    setIsPsf(next);
    savePsfMode(category, next);
    if (next && hasSqft) {
      const val = parseFloat(value) || 0;
      setPsfRate(val > 0 ? String(Math.round((val / sqftNum) * 100) / 100) : '');
    }
  };

  const handlePsfChange = (rawRate: string) => {
    setPsfRate(rawRate);
    const rate = parseFloat(rawRate) || 0;
    const total = Math.round(rate * sqftNum);
    onChange(total > 0 ? String(total) : '');
  };

  const numericValue = parseFloat(value) || 0;
  const hasValue = numericValue > 0;
  const isLoanCategory = LOAN_CATEGORIES.has(category) || 
    label.toLowerCase().includes('loan') || 
    label.toLowerCase().includes('financing') ||
    label.toLowerCase().includes('interest');

  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 rounded-md border border-border/30 bg-background/50 p-1.5 transition-all hover:border-primary/50",
        hasValue && "border-primary/40 bg-primary/5"
      )}
    >
      {icon && (
        <div className="flex-shrink-0 text-muted-foreground">
          {icon}
        </div>
      )}
      <span className="text-xs truncate flex-1 min-w-0" title={label}>
        {label}
        {hasPreset && (
          <span className="ml-1 text-primary/60 text-[8px]">●</span>
        )}
      </span>
      {hasSqft && (
        <button
          type="button"
          onClick={toggleMode}
          className={cn(
            "flex-shrink-0 rounded px-1 h-5 text-[9px] font-medium cursor-pointer transition-colors select-none",
            isPsf
              ? "bg-primary/20 text-primary"
              : "bg-muted hover:bg-muted-foreground/20 text-muted-foreground"
          )}
          title={isPsf ? 'Per square foot mode — click for flat $' : 'Flat dollar mode — click for $/sqft'}
        >
          {isPsf ? '$/sf' : '$'}
        </button>
      )}
      {isLoanCategory && (
        <LoanCostCalculator onApply={onChange} />
      )}
      <div className="relative flex-shrink-0">
        {isPsf ? (
          <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground font-medium pointer-events-none">$/sf</span>
        ) : (
          <DollarSign className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        )}
        {isPsf ? (
          <FormulaInput
            type="number"
            placeholder="0"
            value={psfRate}
            onChange={(e) => handlePsfChange(e.target.value)}
            className="pl-6 pr-1.5 font-mono text-right h-7 w-20 text-xs bg-transparent border-0 focus-visible:ring-1"
            showHint={false}
          />
        ) : (
          <FormulaInput
            type="number"
            placeholder="0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-5 pr-1.5 font-mono text-right h-7 w-20 text-xs bg-transparent border-0 focus-visible:ring-1"
            showHint={false}
          />
        )}
      </div>
    </div>
  );
}
