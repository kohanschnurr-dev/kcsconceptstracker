import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';

interface SpendingTrendChartProps {
  expenses: Array<{
    date: string;
    amount: number;
  }>;
  days?: number;
}

export function SpendingTrendChart({ expenses, days = 7 }: SpendingTrendChartProps) {
  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const data = [];

    // Go from (days-1) days ago up to today (not into future)
    // This ensures we show the PAST 7 days ending at today
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dayExpenses = expenses.filter(e => {
        const expenseDate = startOfDay(new Date(e.date));
        return isSameDay(expenseDate, date);
      });
      const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      data.push({
        date: format(date, 'MMM d'),
        fullDate: format(date, 'MMMM d, yyyy'),
        amount: total,
        isToday: i === 0,
      });
    }

    return data;
  }, [expenses, days]);

  const totalSpent = chartData.reduce((sum, day) => sum + day.amount, 0);
  const avgPerDay = totalSpent / days;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Last {days} Days</span>
          <span className="text-sm font-normal text-muted-foreground">
            Avg: {formatCurrency(avgPerDay)}/day
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(32, 95%, 55%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(32, 95%, 55%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(220, 15%, 22%)" 
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                width={45}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Spent']}
                labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
                contentStyle={{
                  backgroundColor: 'hsl(220, 18%, 13%)',
                  border: '1px solid hsl(220, 15%, 22%)',
                  borderRadius: '8px',
                  color: 'hsl(210, 20%, 95%)',
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="hsl(32, 95%, 55%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAmount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-sm text-muted-foreground">Total ({days} days)</p>
            <p className="text-xl font-semibold font-mono">{formatCurrency(totalSpent)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">This Month Target</p>
            <p className="text-lg font-mono text-muted-foreground">--</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
