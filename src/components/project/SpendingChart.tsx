import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
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

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(220, 70%, 50%)',
  'hsl(280, 70%, 50%)',
  'hsl(180, 70%, 50%)',
  'hsl(30, 70%, 50%)',
];

export function SpendingChart({ categories, totalBudget }: SpendingChartProps) {
  const barData = useMemo(() => {
    return categories.map(cat => {
      const label = BUDGET_CATEGORIES.find(b => b.value === cat.category)?.label || cat.category;
      return {
        name: label,
        estimated: cat.estimated_budget,
        actual: cat.actualSpent,
      };
    });
  }, [categories]);

  const pieData = useMemo(() => {
    return categories
      .filter(cat => cat.actualSpent > 0)
      .map(cat => {
        const label = BUDGET_CATEGORIES.find(b => b.value === cat.category)?.label || cat.category;
        return {
          name: label,
          value: cat.actualSpent,
        };
      });
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

  if (categories.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Spending Analysis
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
          Spending Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bar Chart - Budget vs Actual */}
        <div>
          <h4 className="text-sm font-medium mb-4">Budget vs Actual by Category</h4>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <XAxis 
                  type="number" 
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={80}
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
                <Bar dataKey="estimated" fill="hsl(var(--muted-foreground))" name="Estimated" radius={[0, 4, 4, 0]} />
                <Bar dataKey="actual" fill="hsl(var(--primary))" name="Actual" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Spending Distribution */}
        {pieData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-4">Spending Distribution</h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Total Spent: <span className="font-semibold">{formatCurrency(totalSpent)}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
