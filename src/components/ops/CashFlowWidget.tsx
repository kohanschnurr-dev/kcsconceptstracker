import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { subDays, startOfDay, isSameDay, isAfter } from 'date-fns';

interface BusinessExpense {
  id: string;
  amount: number;
  date: string;
  category: string;
}

interface CashFlowWidgetProps {
  expenses: BusinessExpense[];
  getCategoryLabel: (category: string) => string;
  onCategoryClick: (category: string) => void;
  selectedCategory: string;
}

const CHART_COLORS = [
  'hsl(32, 95%, 55%)',   // primary orange
  'hsl(142, 76%, 36%)',  // success green
  'hsl(200, 80%, 50%)',  // blue
  'hsl(270, 60%, 55%)',  // purple
  'hsl(45, 93%, 47%)',   // warning yellow
  'hsl(0, 72%, 51%)',    // destructive red
  'hsl(180, 60%, 45%)',  // teal
  'hsl(320, 60%, 50%)',  // pink
];

export function CashFlowWidget({
  expenses,
  getCategoryLabel,
  onCategoryClick,
  selectedCategory,
}: CashFlowWidgetProps) {
  // Calculate 30-day total and category breakdown
  const { last30DaysTotal, categoryData, trend } = useMemo(() => {
    const today = startOfDay(new Date());
    const thirtyDaysAgo = subDays(today, 30);
    const sixtyDaysAgo = subDays(today, 60);

    // Last 30 days
    const last30Days = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return isAfter(expenseDate, thirtyDaysAgo) || isSameDay(expenseDate, thirtyDaysAgo);
    });

    // Previous 30 days (for trend)
    const previous30Days = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return (isAfter(expenseDate, sixtyDaysAgo) || isSameDay(expenseDate, sixtyDaysAgo)) &&
             !isAfter(expenseDate, thirtyDaysAgo) && !isSameDay(expenseDate, thirtyDaysAgo);
    });

    const currentTotal = last30Days.reduce((sum, e) => sum + e.amount, 0);
    const previousTotal = previous30Days.reduce((sum, e) => sum + e.amount, 0);

    // Calculate trend percentage
    const trendPercentage = previousTotal > 0 
      ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100)
      : 0;

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    last30Days.forEach(expense => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0;
      }
      categoryTotals[expense.category] += expense.amount;
    });

    const sortedCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        categoryKey: category,
        label: getCategoryLabel(category),
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 categories

    return {
      last30DaysTotal: currentTotal,
      categoryData: sortedCategories,
      trend: {
        percentage: trendPercentage,
        isUp: trendPercentage > 0,
      },
    };
  }, [expenses, getCategoryLabel]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare data for donut chart
  const chartData = categoryData.map((cat, index) => ({
    name: cat.label,
    value: cat.amount,
    categoryKey: cat.categoryKey,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <div className="ops-panel p-4 h-full">
      <div className="ops-header">CASH FLOW (30D)</div>

      <div className="flex gap-4 h-[calc(100%-2rem)]">
        {/* Donut Chart */}
        <div className="relative w-[120px] h-[120px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onCategoryClick(entry.categoryKey === selectedCategory ? 'all' : entry.categoryKey)}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-semibold font-mono text-foreground">
              {formatCurrency(last30DaysTotal).replace('$', '')}
            </span>
          </div>
        </div>

        {/* Category List */}
        <div className="flex-1 flex flex-col justify-center space-y-2 min-w-0">
          {categoryData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses yet</p>
          ) : (
            <>
              {categoryData.map((cat, index) => (
                <button
                  key={cat.categoryKey}
                  onClick={() => onCategoryClick(cat.categoryKey === selectedCategory ? 'all' : cat.categoryKey)}
                  className={`flex items-center gap-2 text-left hover:bg-muted/30 rounded px-1 py-0.5 transition-colors ${
                    selectedCategory === cat.categoryKey ? 'bg-primary/10' : ''
                  }`}
                >
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {cat.label}
                  </span>
                  <span className="text-xs font-mono text-foreground flex-shrink-0">
                    {formatCurrency(cat.amount)}
                  </span>
                </button>
              ))}
              
              {/* Trend indicator */}
              <div className="flex items-center gap-1 pt-2 border-t border-border/30 mt-2">
                {trend.isUp ? (
                  <TrendingUp className="h-3 w-3 text-destructive" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-success" />
                )}
                <span className={`text-xs ${trend.isUp ? 'text-destructive' : 'text-success'}`}>
                  {trend.isUp ? '+' : ''}{trend.percentage}% vs last 30d
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
