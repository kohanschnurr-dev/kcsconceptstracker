 import { useState, useMemo } from 'react';
 import { DollarSign, Grid3X3, Target, ListChecks } from 'lucide-react';
 import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { parseDateString } from '@/lib/dateUtils';
 import { SpendingPopout } from './SpendingPopout';
 import { CategoriesPopout } from './CategoriesPopout';
 import { GoalsPopout } from './GoalsPopout';
 import { RulesPopout } from './RulesPopout';
 import { cn } from '@/lib/utils';
 
 interface BusinessExpense {
   id: string;
   amount: number;
   date: string;
   category: string;
 }
 
interface Goal {
  id: string;
  title: string;
  target_value: number;
  current_value: number | null;
  category: string | null;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
}
 
  interface OperationCode {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    is_completed: boolean | null;
  }
 
interface CompactDashboardWidgetsProps {
  expenses: BusinessExpense[];
  goals: Goal[];
  allGoals?: Goal[];
  rules: OperationCode[];
  getCategoryLabel: (category: string) => string;
  onCategoryClick: (category: string) => void;
  selectedCategory: string;
  onAddGoal?: (goal: { title: string; target_value: number; category: string; start_date?: string; due_date?: string }) => Promise<void>;
  onUpdateGoal?: (goalId: string, newValue: number) => Promise<void>;
  onCompleteGoal?: (goalId: string) => Promise<void>;
  onUncompleteGoal?: (goalId: string) => Promise<void>;
  onAddRule?: (rule: { title: string; category: string; description?: string }) => Promise<void>;
  onDeleteRule?: (ruleId: string) => Promise<void>;
  onUpdateRuleCategory?: (ruleId: string, newCategory: string) => Promise<void>;
  onDeleteGoal?: (goalId: string) => Promise<void>;
}
 
export function CompactDashboardWidgets({ 
  expenses, 
  goals,
  allGoals,
  rules,
  getCategoryLabel, 
  onCategoryClick,
  selectedCategory,
  onAddGoal,
  onUpdateGoal,
  onCompleteGoal,
  onUncompleteGoal,
  onAddRule,
  onDeleteRule,
  onUpdateRuleCategory,
  onDeleteGoal,
}: CompactDashboardWidgetsProps) {
   const [spendingOpen, setSpendingOpen] = useState(false);
   const [categoriesOpen, setCategoriesOpen] = useState(false);
   const [goalsOpen, setGoalsOpen] = useState(false);
   const [rulesOpen, setRulesOpen] = useState(false);
 
   // Sparkline data for spending
   const sparklineData = useMemo(() => {
     const today = startOfDay(new Date());
     const data = [];
     for (let i = 29; i >= 0; i--) {
       const date = subDays(today, i);
       const dayExpenses = expenses.filter(e => isSameDay(parseDateString(e.date), date));
       const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
       data.push({ date: format(date, 'MMM d'), amount: total });
     }
     return data;
   }, [expenses]);
 
   const last30DaysTotal = sparklineData.reduce((sum, day) => sum + day.amount, 0);
 
  // Category breakdown data
  const categoryBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const totalSpend = sorted.reduce((sum, [, amt]) => sum + amt, 0);
    return { sorted, totalSpend, count: sorted.length };
  }, [expenses]);
 
   // Goals summary
   const goalsSummary = useMemo(() => {
     const active = goals.filter(g => {
       const percent = ((g.current_value || 0) / g.target_value) * 100;
       return percent < 100;
     }).length;
     return { active, total: goals.length };
   }, [goals]);
 
    // Rules summary
    const rulesSummary = useMemo(() => {
      return { total: rules.length };
    }, [rules]);
 
   const formatCurrency = (value: number) => {
     return new Intl.NumberFormat('en-US', {
       style: 'currency',
       currency: 'USD',
       minimumFractionDigits: 0,
       maximumFractionDigits: 0,
     }).format(value);
   };
 
   return (
     <>
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
         {/* Spending Widget */}
         <button
           onClick={() => setSpendingOpen(true)}
           className={cn(
             "h-[100px] p-3 rounded-lg border border-border/30 bg-muted/20",
             "flex flex-col justify-between text-left",
             "transition-all hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
           )}
         >
           <div className="flex items-center gap-2">
             <DollarSign className="h-4 w-4 text-primary" />
             <span className="text-xs text-muted-foreground uppercase tracking-wide">30 Day Spending</span>
           </div>
           <p className="text-xl font-semibold font-mono">{formatCurrency(last30DaysTotal)}</p>
           <div className="h-[20px] -mx-1">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={sparklineData}>
                 <Area
                   type="monotone"
                   dataKey="amount"
                   stroke="hsl(var(--primary))"
                   strokeWidth={1}
                   fill="hsl(var(--primary) / 0.2)"
                 />
               </AreaChart>
             </ResponsiveContainer>
           </div>
         </button>
 
        {/* Category Breakdown Widget */}
        <button
          onClick={() => setCategoriesOpen(true)}
          className={cn(
            "h-[100px] p-3 rounded-lg border border-border/30 bg-muted/20",
            "flex flex-col justify-between text-left",
            "transition-all hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
          )}
        >
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Category Breakdown</span>
          </div>
          <p className="text-sm font-semibold">
            {formatCurrency(categoryBreakdown.totalSpend)} across {categoryBreakdown.count} categories
          </p>
          <div className="flex gap-1 h-2">
            {categoryBreakdown.sorted.slice(0, 4).map(([cat, amt]) => (
              <div
                key={cat}
                className="h-full rounded-sm bg-primary/70"
                style={{ flexGrow: amt / (categoryBreakdown.totalSpend || 1) }}
              />
            ))}
          </div>
        </button>
 
         {/* Goals Widget */}
         <button
           onClick={() => setGoalsOpen(true)}
           className={cn(
             "h-[100px] p-3 rounded-lg border border-border/30 bg-muted/20",
             "flex flex-col justify-between text-left",
             "transition-all hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
           )}
         >
           <div className="flex items-center gap-2">
             <Target className="h-4 w-4 text-primary" />
             <span className="text-xs text-muted-foreground uppercase tracking-wide">Goals</span>
           </div>
            <p className="text-xl font-semibold">
              {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
            </p>
           <div className="flex gap-1">
             {goals.slice(0, 4).map((goal) => {
               const percent = ((goal.current_value || 0) / goal.target_value) * 100;
               return (
                 <div key={goal.id} className="flex-1 h-1.5 rounded-full bg-muted">
                   <div 
                     className={cn(
                       "h-full rounded-full",
                       percent >= 75 ? "bg-emerald-500" : percent >= 50 ? "bg-amber-500" : "bg-red-500"
                     )}
                     style={{ width: `${Math.min(percent, 100)}%` }}
                   />
                 </div>
               );
             })}
           </div>
         </button>
 
         {/* Rules Widget */}
         <button
           onClick={() => setRulesOpen(true)}
           className={cn(
             "h-[100px] p-3 rounded-lg border border-border/30 bg-muted/20",
             "flex flex-col justify-between text-left",
             "transition-all hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
           )}
         >
           <div className="flex items-center gap-2">
             <ListChecks className="h-4 w-4 text-primary" />
             <span className="text-xs text-muted-foreground uppercase tracking-wide">Rules</span>
           </div>
            <p className="text-xl font-semibold">
              {rules.length} {rules.length === 1 ? 'rule' : 'rules'}
            </p>
            <div className="flex gap-1">
              {rules.slice(0, 6).map((rule) => (
                <div 
                  key={rule.id} 
                  className="h-2 w-2 rounded-sm bg-primary/70"
                />
              ))}
            </div>
         </button>
       </div>
 
       {/* Pop-out Dialogs */}
       <SpendingPopout 
         open={spendingOpen} 
         onOpenChange={setSpendingOpen} 
         expenses={expenses} 
       />
       <CategoriesPopout 
         open={categoriesOpen} 
         onOpenChange={setCategoriesOpen} 
         expenses={expenses}
         getCategoryLabel={getCategoryLabel}
       />
        <GoalsPopout 
          open={goalsOpen} 
          onOpenChange={setGoalsOpen} 
          goals={allGoals || goals}
          onAddGoal={onAddGoal}
          onUpdateGoal={onUpdateGoal}
            onCompleteGoal={onCompleteGoal}
            onUncompleteGoal={onUncompleteGoal}
            onDeleteGoal={onDeleteGoal}
          />
        <RulesPopout 
          open={rulesOpen} 
          onOpenChange={setRulesOpen} 
          rules={rules}
          onAddRule={onAddRule}
          onDeleteRule={onDeleteRule}
          onUpdateRuleCategory={onUpdateRuleCategory}
        />
     </>
   );
 }