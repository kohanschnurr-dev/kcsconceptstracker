import { MapPin, Calendar, TrendingUp } from 'lucide-react';
import { Project, BUDGET_CATEGORIES } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const totalSpent = project.categories.reduce((sum, cat) => sum + cat.actualSpent, 0);
  const percentSpent = (totalSpent / project.totalBudget) * 100;
  const remaining = project.totalBudget - totalSpent;

  // Check for overbudget categories
  const overbudgetCategories = project.categories.filter(
    (cat) => cat.actualSpent > cat.estimatedBudget * 1.05
  );

  const getStatusColor = () => {
    if (percentSpent > 100) return 'destructive';
    if (percentSpent > 90) return 'warning';
    return 'success';
  };

  const getProgressColor = () => {
    if (percentSpent > 100) return 'bg-destructive';
    if (percentSpent > 90) return 'bg-warning';
    return 'bg-success';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      onClick={onClick}
      className="glass-card p-5 cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 animate-slide-up"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{project.name}</h3>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{project.address}</span>
          </div>
        </div>
        <Badge
          variant={project.status === 'complete' ? 'default' : 'secondary'}
          className={cn(
            project.status === 'active' && 'bg-success/20 text-success border-success/30',
            project.status === 'complete' && 'bg-primary/20 text-primary border-primary/30',
            project.status === 'on-hold' && 'bg-warning/20 text-warning border-warning/30'
          )}
        >
          {project.status}
        </Badge>
      </div>

      {/* Budget Progress */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Budget Progress</span>
          <span className="font-mono font-medium">{percentSpent.toFixed(1)}%</span>
        </div>
        <div className="progress-bar">
          <div
            className={cn('progress-fill', getProgressColor())}
            style={{ width: `${Math.min(percentSpent, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatCurrency(totalSpent)} spent</span>
          <span>{formatCurrency(project.totalBudget)} total</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">Remaining</p>
          <p className={cn(
            'font-mono font-semibold',
            remaining < 0 ? 'text-destructive' : 'text-success'
          )}>
            {formatCurrency(remaining)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Start Date</p>
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{formatDate(project.startDate)}</span>
          </div>
        </div>
      </div>

      {/* Overbudget Warning */}
      {overbudgetCategories.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 text-destructive text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            <span>{overbudgetCategories.length} categories over budget</span>
          </div>
          <div className="mt-1 text-xs text-destructive/80">
            {overbudgetCategories.map((cat) => {
              const label = BUDGET_CATEGORIES.find(b => b.value === cat.category)?.label;
              return label;
            }).join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}
