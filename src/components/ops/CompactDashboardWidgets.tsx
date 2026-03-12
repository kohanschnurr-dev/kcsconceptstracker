import { useState, useMemo } from 'react';
import { DollarSign, Grid3X3, Crosshair, BookOpen } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { parseDateString } from '@/lib/dateUtils';
import { SpendingPopout } from './SpendingPopout';
import { CategoriesPopout } from './CategoriesPopout';
import { GoalsPopout } from './GoalsPopout';
import { RulesPopout } from './RulesPopout';
import { cn } from '@/lib/utils';
import { SEED_GUIDELINES } from '@/lib/ruleGroups';

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

  // Strategic Targets summary — just the data
  const targetsSummary = useMemo(() => {
    const activeGoals = goals.filter(g => !g.completed_at);
    const total = activeGoals.length;
    const met = activeGoals.filter(g => (g.current_value || 0) >= g.target_value).length;
    return { total, met };
  }, [goals]);

  // Codex summary
  const codexCount = SEED_GUIDELINES.length + rules.length;

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

        {/* Strategic Targets Widget */}
        <button
          onClick={() => setGoalsOpen(true)}
          className={cn(
            "h-[100px] p-3 rounded-xl border relative overflow-hidden",
            "flex flex-col justify-between text-left",
            "transition-all cursor-pointer",
            "border-slate-700/40 bg-slate-800/20 hover:border-slate-600/50 hover:bg-slate-800/30"
          )}
        >
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wide font-jakarta">Targets</span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold font-jakarta text-white">
              {targetsSummary.met}
            </span>
            <span className="text-sm text-slate-500 font-jakarta">/ {targetsSummary.total} met</span>
          </div>

          <p className="text-[11px] text-slate-500 font-jakarta">
            {targetsSummary.total === 0
              ? 'No targets set'
              : targetsSummary.met === targetsSummary.total
              ? 'All targets achieved'
              : `${targetsSummary.total - targetsSummary.met} remaining`}
          </p>
        </button>

        {/* Book of Rules Widget */}
        <button
          onClick={() => setRulesOpen(true)}
          className={cn(
            "h-[100px] p-3 rounded-xl border relative overflow-hidden",
            "flex flex-col justify-between text-left",
            "transition-all cursor-pointer",
            "border-slate-700/40 bg-slate-800/20 hover:border-slate-600/50 hover:bg-slate-800/30"
          )}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wide font-jakarta">Codex</span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold font-jakarta text-white">
              {codexCount}
            </span>
            <span className="text-sm text-slate-500 font-jakarta">guideline{codexCount !== 1 ? 's' : ''}</span>
          </div>

          <p className="text-[11px] text-slate-500 font-jakarta truncate">
            {codexCount === 0
              ? 'Build your playbook'
              : `${SEED_GUIDELINES.length} core · ${rules.length} custom`}
          </p>
        </button>
      </div>

      {/* Pop-out Overlays */}
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
