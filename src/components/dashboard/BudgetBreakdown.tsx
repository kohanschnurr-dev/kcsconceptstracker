import { Project, getBudgetCategories } from '@/types';
import { cn } from '@/lib/utils';

interface BudgetBreakdownProps {
  project: Project;
}

export function BudgetBreakdown({ project }: BudgetBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getVarianceStatus = (estimated: number, actual: number) => {
    if (actual === 0) return 'neutral';
    const variance = (actual - estimated) / estimated;
    if (variance > 0.05) return 'over';
    if (variance < -0.05) return 'under';
    return 'on-track';
  };

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      <div className="p-5 border-b border-border">
        <h3 className="font-semibold">Budget by Category</h3>
        <p className="text-sm text-muted-foreground mt-1">{project.name}</p>
      </div>
      
      <div className="divide-y divide-border">
        {project.categories.map((cat) => {
          const label = getBudgetCategories().find(b => b.value === cat.category)?.label || cat.category;
          const remaining = cat.estimatedBudget - cat.actualSpent;
          const percentUsed = cat.estimatedBudget > 0 ? (cat.actualSpent / cat.estimatedBudget) * 100 : 0;
          const status = getVarianceStatus(cat.estimatedBudget, cat.actualSpent);

          return (
            <div key={cat.id} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{label}</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    status === 'over' && 'bg-destructive/20 text-destructive',
                    status === 'under' && 'bg-success/20 text-success',
                    status === 'on-track' && 'bg-warning/20 text-warning',
                    status === 'neutral' && 'bg-muted text-muted-foreground'
                  )}>
                    {status === 'over' && 'Over'}
                    {status === 'under' && 'Under'}
                    {status === 'on-track' && 'On Track'}
                    {status === 'neutral' && 'Not Started'}
                  </span>
                </div>
              </div>

              <div className="progress-bar mb-2">
                <div
                  className={cn(
                    'progress-fill',
                    status === 'over' && 'bg-destructive',
                    status === 'under' && 'bg-success',
                    status === 'on-track' && 'bg-warning',
                    status === 'neutral' && 'bg-muted-foreground/30'
                  )}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  <span className="font-mono text-foreground">{formatCurrency(cat.actualSpent)}</span>
                  {' / '}
                  {formatCurrency(cat.estimatedBudget)}
                </span>
                <span className={cn(
                  'font-mono',
                  remaining < 0 ? 'text-destructive' : 'text-success'
                )}>
                  {formatCurrency(remaining)} left
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
