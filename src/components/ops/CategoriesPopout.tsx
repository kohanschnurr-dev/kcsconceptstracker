 import { useMemo } from 'react';
 import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { ScrollArea } from '@/components/ui/scroll-area';
 
 interface BusinessExpense {
   id: string;
   amount: number;
   date: string;
   category: string;
 }
 
 interface CategoriesPopoutProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   expenses: BusinessExpense[];
   getCategoryLabel: (category: string) => string;
 }
 
 const COLORS = [
   'hsl(var(--primary))',
   'hsl(25, 95%, 53%)',
   'hsl(45, 93%, 47%)',
   'hsl(142, 71%, 45%)',
   'hsl(199, 89%, 48%)',
   'hsl(262, 83%, 58%)',
   'hsl(330, 81%, 60%)',
   'hsl(0, 72%, 51%)',
 ];
 
 export function CategoriesPopout({ 
   open, 
   onOpenChange, 
   expenses, 
   getCategoryLabel 
 }: CategoriesPopoutProps) {
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
         name: getCategoryLabel(category),
         value: amount,
       }))
       .sort((a, b) => b.value - a.value);
   }, [expenses, getCategoryLabel]);
 
   const total = categoryData.reduce((sum, cat) => sum + cat.value, 0);
 
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
       <DialogContent className="max-w-md">
         <DialogHeader>
           <DialogTitle>Category Breakdown</DialogTitle>
         </DialogHeader>
         
         <div className="space-y-4">
           {/* Donut Chart */}
           <div className="h-[180px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={categoryData}
                   cx="50%"
                   cy="50%"
                   innerRadius={50}
                   outerRadius={80}
                   paddingAngle={2}
                   dataKey="value"
                 >
                   {categoryData.map((_, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                  itemStyle={{ color: '#FFFFFF' }}
                  labelStyle={{ color: '#FFFFFF' }}
                />
               </PieChart>
             </ResponsiveContainer>
           </div>
 
           {/* Category List */}
           <ScrollArea className="h-[200px]">
             <div className="space-y-2">
               {categoryData.map((cat, index) => (
                 <div 
                   key={cat.categoryKey}
                   className="flex items-center justify-between p-2 rounded-lg bg-muted/20"
                 >
                   <div className="flex items-center gap-2">
                     <div 
                       className="w-3 h-3 rounded-full" 
                       style={{ backgroundColor: COLORS[index % COLORS.length] }}
                     />
                     <span className="text-sm text-white">{cat.name}</span>
                   </div>
                   <div className="text-right">
                     <span className="text-sm font-mono font-medium text-white">{formatCurrency(cat.value)}</span>
                     <span className="text-xs text-muted-foreground ml-2">
                       ({((cat.value / total) * 100).toFixed(0)}%)
                     </span>
                   </div>
                 </div>
               ))}
             </div>
           </ScrollArea>
         </div>
       </DialogContent>
     </Dialog>
   );
 }