import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, subDays, startOfDay, isSameDay, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';

interface BusinessExpense {
  id: string;
  amount: number;
  date: string;
  category: string;
}

interface BusinessExpenseTrendChartProps {
  expenses: BusinessExpense[];
  getCategoryLabel: (category: string) => string;
}

export function BusinessExpenseTrendChart({ expenses, getCategoryLabel }: BusinessExpenseTrendChartProps) {
  // Last 30 days daily data
  const dailyData = useMemo(() => {
    const today = startOfDay(new Date());
    const data = [];

    for (let i = 29; i >= 0; i--) {
      const date = subDays(today, i);
      const dayExpenses = expenses.filter(e => isSameDay(new Date(e.date), date));
      const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      data.push({
        date: format(date, 'MMM d'),
        fullDate: format(date, 'MMMM d, yyyy'),
        amount: total,
      });
    }

    return data;
  }, [expenses]);

  // Last 6 months monthly data
  const monthlyData = useMemo(() => {
    const today = new Date();
    const sixMonthsAgo = subMonths(today, 5);
    const months = eachMonthOfInterval({ start: startOfMonth(sixMonthsAgo), end: startOfMonth(today) });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });
      const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

      return {
        month: format(month, 'MMM'),
        fullMonth: format(month, 'MMMM yyyy'),
        amount: total,
      };
    });
  }, [expenses]);

  // Category breakdown
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
        category: getCategoryLabel(category),
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8); // Top 8 categories
  }, [expenses, getCategoryLabel]);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const last30DaysTotal = dailyData.reduce((sum, day) => sum + day.amount, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value}`;
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Expense Trends</span>
          <span className="text-sm font-normal text-muted-foreground">
            Total: {formatCurrency(totalSpent)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="daily">Last 30 Days</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="category">By Category</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-0">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorBusinessAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border))" 
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    dy={10}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickFormatter={formatYAxis}
                    width={45}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Spent']}
                    labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBusinessAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div>
                <p className="text-sm text-muted-foreground">Last 30 Days</p>
                <p className="text-xl font-semibold font-mono">{formatCurrency(last30DaysTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Daily Average</p>
                <p className="text-lg font-mono">{formatCurrency(last30DaysTotal / 30)}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="mt-0">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border))" 
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickFormatter={formatYAxis}
                    width={45}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Spent']}
                    labelFormatter={(label, payload) => payload[0]?.payload?.fullMonth || label}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div>
                <p className="text-sm text-muted-foreground">6-Month Total</p>
                <p className="text-xl font-semibold font-mono">
                  {formatCurrency(monthlyData.reduce((sum, m) => sum + m.amount, 0))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Monthly Average</p>
                <p className="text-lg font-mono">
                  {formatCurrency(monthlyData.reduce((sum, m) => sum + m.amount, 0) / 6)}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="category" className="mt-0">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border))" 
                    horizontal={false}
                  />
                  <XAxis 
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickFormatter={formatYAxis}
                  />
                  <YAxis 
                    type="category"
                    dataKey="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    width={100}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Spent']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="hsl(var(--chart-2))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">Top categories by total spending</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
