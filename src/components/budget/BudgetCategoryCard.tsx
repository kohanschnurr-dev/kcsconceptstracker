import { DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface BudgetCategoryCardProps {
  category: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  hasPreset?: boolean;
}

export function BudgetCategoryCard({ 
  category, 
  label, 
  value, 
  onChange,
  icon,
  hasPreset 
}: BudgetCategoryCardProps) {
  const numericValue = parseFloat(value) || 0;
  const hasValue = numericValue > 0;

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
      <div className="relative flex-shrink-0">
        <DollarSign className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          type="number"
          placeholder="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-5 pr-1.5 font-mono text-right h-7 w-20 text-xs bg-transparent border-0 focus-visible:ring-1"
        />
      </div>
    </div>
  );
}
