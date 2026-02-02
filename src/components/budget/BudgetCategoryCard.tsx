import { DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface BudgetCategoryCardProps {
  category: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}

export function BudgetCategoryCard({ 
  category, 
  label, 
  value, 
  onChange,
  icon 
}: BudgetCategoryCardProps) {
  const numericValue = parseFloat(value) || 0;
  const hasValue = numericValue > 0;

  return (
    <div 
      className={cn(
        "group relative rounded-lg border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-sm",
        hasValue && "border-primary/30 bg-primary/5"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <div className="flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
            {icon}
          </div>
        )}
        <span className="text-sm font-medium truncate" title={label}>
          {label}
        </span>
      </div>
      <div className="relative">
        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="number"
          placeholder="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-8 font-mono text-right h-9"
        />
      </div>
    </div>
  );
}
