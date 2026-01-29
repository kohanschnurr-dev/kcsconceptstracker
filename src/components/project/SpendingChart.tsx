import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { BUDGET_CATEGORIES } from '@/types';

interface Category {
  id: string;
  category: string;
  estimated_budget: number;
  actualSpent: number;
}

interface SpendingChartProps {
  categories: Category[];
  totalBudget: number;
}

export function SpendingChart({ categories, totalBudget }: SpendingChartProps) {
  const barData = useMemo(() => {
    return categories
      .filter(cat => cat.actualSpent > 0)
      .map(cat => {
        const label = BUDGET_CATEGORIES.find(b => b.value === cat.category)?.label || cat.category;
        return {
          name: label,
          actual: cat.actualSpent,
        };
      })
      .sort((a, b) => b.actual - a.actual)
      .slice(0, 6);
  }, [categories]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalSpent = categories.reduce((sum, cat) => sum + cat.actualSpent, 0);

  if (barData.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Spending by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No spending data yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Spending by Category
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical">
              <XAxis 
                type="number" 
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={120}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="actual" fill="hsl(var(--primary))" name="Spent" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Total Spent: <span className="font-semibold font-mono">{formatCurrency(totalSpent)}</span>
        </p>
      </CardContent>
    </Card>
  );
}
