import { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';

interface BusinessExpense {
  id: string;
  amount: number;
  date: string;
  category: string;
}

interface BusinessExpensesDashboardProps {
  expenses: BusinessExpense[];
  getCategoryLabel: (category: string) => string;
  onCategoryClick: (category: string) => void;
  selectedCategory: string;
}

export function BusinessExpensesDashboard({ 
  expenses, 
  getCategoryLabel, 
  onCategoryClick,
  selectedCategory 
}: BusinessExpensesDashboardProps) {
  // Last 30 days daily data for sparkline
  const sparklineData = useMemo(() => {
    const today = startOfDay(new Date());
    const data = [];

    for (let i = 29; i >= 0; i--) {
      const date = subDays(today, i);
      const dayExpenses = expenses.filter(e => isSameDay(new Date(e.date), date));
      const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      data.push({
        date: format(date, 'MMM d'),
        amount: total,
      });
    }

    return data;
  }, [expenses]);

  // Category breakdown for pills
  const categoryData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    
    expenses.forEach(expense => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0;
      }
      categoryTotals[expense.category] += expense.amount;
    });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        categoryKey: category,
        label: getCategoryLabel(category),
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, getCategoryLabel]);

  const last30DaysTotal = sparklineData.reduce((sum, day) => sum + day.amount, 0);
  const dailyAverage = last30DaysTotal / 30;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCompactCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: value >= 1000 ? 'compact' : 'standard',
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Sparkline Card - 30 Day Spending */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">30-Day Spending</p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(dailyAverage)}/day avg
          </p>
        </div>
        
        <div className="flex items-end gap-4">
          <p className="text-2xl font-semibold font-mono">
            {formatCurrency(last30DaysTotal)}
          </p>
        </div>
        
        {/* Sparkline */}
        <div className="h-[60px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                fill="url(#sparklineGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Pills Card */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Category Breakdown</p>
          {selectedCategory !== 'all' && (
            <button 
              onClick={() => onCategoryClick('all')}
              className="text-xs text-primary hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto">
          {categoryData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses yet</p>
          ) : (
            categoryData.map((cat) => (
              <Badge
                key={cat.categoryKey}
                variant={selectedCategory === cat.categoryKey ? "default" : "secondary"}
                className="cursor-pointer hover:bg-primary/20 transition-colors gap-1.5"
                onClick={() => onCategoryClick(cat.categoryKey === selectedCategory ? 'all' : cat.categoryKey)}
              >
                <span className="truncate max-w-[100px]">{cat.label}</span>
                <span className="font-mono text-xs opacity-80">
                  {formatCompactCurrency(cat.amount)}
                </span>
              </Badge>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
