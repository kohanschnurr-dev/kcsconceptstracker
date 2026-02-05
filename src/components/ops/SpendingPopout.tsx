 import { useMemo } from 'react';
 import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { format, subDays, startOfDay, isSameDay } from 'date-fns';
 
 interface BusinessExpense {
   id: string;
   amount: number;
   date: string;
   category: string;
 }
 
 interface SpendingPopoutProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   expenses: BusinessExpense[];
 }
 
 export function SpendingPopout({ open, onOpenChange, expenses }: SpendingPopoutProps) {
   const chartData = useMemo(() => {
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
 
   const last30DaysTotal = chartData.reduce((sum, day) => sum + day.amount, 0);
   const dailyAverage = last30DaysTotal / 30;
   const maxDay = Math.max(...chartData.map(d => d.amount));
   const minDay = Math.min(...chartData.filter(d => d.amount > 0).map(d => d.amount)) || 0;
 
   const formatCurrency = (value: number) => {
     return new Intl.NumberFormat('en-US', {
       style: 'currency',
       currency: 'USD',
       minimumFractionDigits: 0,
       maximumFractionDigits: 0,
     }).format(value);
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-lg">
         <DialogHeader>
           <DialogTitle>30-Day Spending</DialogTitle>
         </DialogHeader>
         
         <div className="space-y-4">
           {/* Stats Row */}
           <div className="grid grid-cols-3 gap-3">
             <div className="text-center p-3 rounded-lg bg-muted/30">
               <p className="text-xs text-muted-foreground">Total</p>
               <p className="text-lg font-semibold font-mono">{formatCurrency(last30DaysTotal)}</p>
             </div>
             <div className="text-center p-3 rounded-lg bg-muted/30">
               <p className="text-xs text-muted-foreground">Daily Avg</p>
               <p className="text-lg font-semibold font-mono">{formatCurrency(dailyAverage)}</p>
             </div>
             <div className="text-center p-3 rounded-lg bg-muted/30">
               <p className="text-xs text-muted-foreground">Peak Day</p>
               <p className="text-lg font-semibold font-mono">{formatCurrency(maxDay)}</p>
             </div>
           </div>
 
           {/* Chart */}
           <div className="h-[200px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData}>
                 <defs>
                   <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                     <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                 <XAxis 
                   dataKey="date" 
                   tick={{ fontSize: 10 }} 
                   interval={6}
                   className="fill-muted-foreground"
                 />
                 <YAxis 
                   tick={{ fontSize: 10 }}
                   tickFormatter={(v) => `$${v}`}
                   className="fill-muted-foreground"
                 />
                 <Tooltip 
                   formatter={(value: number) => [formatCurrency(value), 'Spent']}
                   contentStyle={{ 
                     backgroundColor: 'hsl(var(--card))', 
                     border: '1px solid hsl(var(--border))' 
                   }}
                 />
                 <Area
                   type="monotone"
                   dataKey="amount"
                   stroke="hsl(var(--primary))"
                   strokeWidth={2}
                   fill="url(#spendingGradient)"
                 />
               </AreaChart>
             </ResponsiveContainer>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 }