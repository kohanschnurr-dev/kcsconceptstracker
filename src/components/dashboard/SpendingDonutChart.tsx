import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getBudgetCategories } from '@/types';

interface SpendingDonutChartProps {
  expenses: Array<{
    categoryId: string;
    amount: number;
  }>;
  categories: Array<{
    id: string;
    category: string;
  }>;
}

const CHART_COLORS = [
  'hsl(32, 95%, 55%)',   // primary orange
  'hsl(142, 76%, 36%)',  // success green
  'hsl(200, 80%, 50%)',  // blue
  'hsl(270, 60%, 55%)',  // purple
  'hsl(0, 72%, 51%)',    // red
  'hsl(45, 93%, 47%)',   // warning yellow
  'hsl(180, 70%, 45%)',  // teal
  'hsl(320, 70%, 50%)',  // pink
];

export function SpendingDonutChart({ expenses, categories }: SpendingDonutChartProps) {
  const chartData = useMemo(() => {
    const categorySpending: Record<string, number> = {};
    
    expenses.forEach((expense) => {
      categorySpending[expense.categoryId] = (categorySpending[expense.categoryId] || 0) + expense.amount;
    });

    return Object.entries(categorySpending)
      .map(([categoryId, amount]) => {
        const category = categories.find(c => c.id === categoryId);
        const label = category 
          ? getBudgetCategories().find(b => b.value === category.category)?.label || category.category
          : 'Unknown';
        return { name: label, value: amount, categoryId };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories
  }, [expenses, categories]);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (chartData.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            No expenses recorded yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                itemStyle={{
                  color: 'hsl(var(--foreground))',
                }}
                labelStyle={{
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-2">
          <p className="text-sm text-muted-foreground">Total Spent</p>
          <p className="text-2xl font-semibold font-mono">{formatCurrency(total)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
