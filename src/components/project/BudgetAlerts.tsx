import { AlertTriangle, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getBudgetCategories } from '@/types';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  category: string;
  estimated_budget: number;
  actualSpent: number;
}

interface BudgetAlertsProps {
  categories: Category[];
  totalBudget: number;
  totalSpent: number;
}

interface Alert {
  type: 'danger' | 'warning' | 'success';
  icon: typeof AlertTriangle;
  title: string;
  message: string;
}

export function BudgetAlerts({ categories, totalBudget, totalSpent }: BudgetAlertsProps) {
  const alerts: Alert[] = [];

  // Overall budget check
  const overallPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  
  if (overallPercent > 100) {
    alerts.push({
      type: 'danger',
      icon: AlertTriangle,
      title: 'Over Budget!',
      message: `You've exceeded your total budget by $${Math.round(totalSpent - totalBudget).toLocaleString()}`,
    });
  } else if (overallPercent >= 90) {
    alerts.push({
      type: 'warning',
      icon: AlertCircle,
      title: 'Approaching Budget Limit',
      message: `You've used ${overallPercent.toFixed(0)}% of your total budget`,
    });
  }

  // Category-specific alerts
  categories.forEach(cat => {
    const label = getBudgetCategories().find(b => b.value === cat.category)?.label || cat.category;
    const percent = cat.estimated_budget > 0 ? (cat.actualSpent / cat.estimated_budget) * 100 : 0;
    
    if (percent > 100) {
      alerts.push({
        type: 'danger',
        icon: TrendingUp,
        title: `${label} Over Budget`,
        message: `Exceeded by $${Math.round(cat.actualSpent - cat.estimated_budget).toLocaleString()} (${(percent - 100).toFixed(0)}% over)`,
      });
    } else if (percent >= 85 && percent < 100) {
      alerts.push({
        type: 'warning',
        icon: AlertCircle,
        title: `${label} Nearly Spent`,
        message: `${percent.toFixed(0)}% of budget used, $${Math.round(cat.estimated_budget - cat.actualSpent).toLocaleString()} remaining`,
      });
    }
  });

  // Success message if no issues
  if (alerts.length === 0 && totalSpent > 0) {
    alerts.push({
      type: 'success',
      icon: CheckCircle,
      title: 'Budget On Track',
      message: `All categories are within budget. ${(100 - overallPercent).toFixed(0)}% of total budget remaining.`,
    });
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Budget Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No spending recorded yet
          </p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, index) => {
              const Icon = alert.icon;
              return (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border flex items-start gap-3",
                    alert.type === 'danger' && "bg-destructive/10 border-destructive/30",
                    alert.type === 'warning' && "bg-warning/10 border-warning/30",
                    alert.type === 'success' && "bg-success/10 border-success/30"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 mt-0.5 flex-shrink-0",
                    alert.type === 'danger' && "text-destructive",
                    alert.type === 'warning' && "text-warning",
                    alert.type === 'success' && "text-success"
                  )} />
                  <div>
                    <p className={cn(
                      "font-medium",
                      alert.type === 'danger' && "text-destructive",
                      alert.type === 'warning' && "text-warning",
                      alert.type === 'success' && "text-success"
                    )}>
                      {alert.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
