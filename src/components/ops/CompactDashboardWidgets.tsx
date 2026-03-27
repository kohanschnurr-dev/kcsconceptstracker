import { useState, useMemo } from 'react';
import { DollarSign, Grid3X3, Target, ShieldAlert, Trophy, AlertTriangle } from 'lucide-react';
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

  // Goals "Winning" summary
  const goalsSummary = useMemo(() => {
    const activeGoals = goals.filter(g => !g.completed_at);
    if (activeGoals.length === 0) return { avgProgress: 0, label: 'No goals set', onTrack: 0, total: 0 };

    const percents = activeGoals.map(g => Math.min(((g.current_value || 0) / g.target_value) * 100, 100));
    const avgProgress = percents.reduce((a, b) => a + b, 0) / percents.length;
    const onTrack = percents.filter(p => p >= 50).length;

    let label = `${Math.round(avgProgress)}% toward Q1 Target`;
    if (avgProgress >= 90) label = 'Crushing It!';
    else if (avgProgress >= 70) label = `${Math.round(avgProgress)}% — Winning`;

    return { avgProgress, label, onTrack, total: activeGoals.length };
  }, [goals]);

  // Rules compliance summary
  const rulesSummary = useMemo(() => {
    const total = rules.length;
    if (total === 0) return { label: 'No rules defined', complianceRate: 100, total: 0, triggered: 0 };

    // Read rule-meta from localStorage for triggered count
    let triggered = 0;
    try {
      const stored = localStorage.getItem('rule-meta');
      if (stored) {
        const meta = JSON.parse(stored);
        triggered = rules.filter(r => meta[r.id]?.status === 'triggered').length;
      }
    } catch {}

    const complianceRate = Math.round(((total - triggered) / total) * 100);
    const label = complianceRate === 100
      ? '100% Site Compliance'
      : `${complianceRate}% Compliance`;

    return { label, complianceRate, total, triggered };
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

        {/* Goals Widget — Dynamic "Winning" Summary */}
        <button
          onClick={() => setGoalsOpen(true)}
          className={cn(
            "h-[100px] p-3 rounded-xl border relative overflow-hidden",
            "flex flex-col justify-between text-left",
            "transition-all cursor-pointer group",
            goalsSummary.avgProgress >= 70
              ? "border-primary/30 bg-primary/5 hover:border-primary/50"
              : goalsSummary.avgProgress >= 40
              ? "border-warning/30 bg-warning/5 hover:border-warning/50"
              : "border-border/40 bg-muted/20 hover:border-border/60"
          )}
        >
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1 rounded-md",
              goalsSummary.avgProgress >= 70 ? "bg-primary/15" : goalsSummary.avgProgress >= 40 ? "bg-warning/15" : "bg-muted"
            )}>
              {goalsSummary.avgProgress >= 90 ? (
                <Trophy className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Target className="h-3.5 w-3.5 text-primary" />
              )}
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-jakarta">Goals</span>
          </div>

          <p className={cn(
            "text-sm font-semibold font-jakarta leading-tight",
            goalsSummary.avgProgress >= 70 ? "text-primary" : goalsSummary.avgProgress >= 40 ? "text-warning" : "text-foreground"
          )}>
            {goalsSummary.label}
          </p>

          {/* Mini segmented progress */}
          <div className="flex gap-1">
            {goals.filter(g => !g.completed_at).slice(0, 5).map((goal) => {
              const percent = Math.min(((goal.current_value || 0) / goal.target_value) * 100, 100);
              return (
                <div key={goal.id} className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      percent >= 60 ? "bg-primary" : percent >= 30 ? "bg-warning" : "bg-destructive"
                    )}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              );
            })}
          </div>
        </button>

        {/* Rules Widget — Compliance Status */}
        <button
          onClick={() => setRulesOpen(true)}
          className={cn(
            "h-[100px] p-3 rounded-xl border relative overflow-hidden",
            "flex flex-col justify-between text-left",
            "transition-all cursor-pointer group",
            rulesSummary.complianceRate === 100
              ? "border-success/30 bg-success/5 hover:border-success/50"
              : rulesSummary.triggered > 0
              ? "border-destructive/30 bg-destructive/5 hover:border-destructive/50"
              : "border-border/40 bg-muted/20 hover:border-border/60"
          )}
        >
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1 rounded-md",
              rulesSummary.complianceRate === 100 ? "bg-success/15" : rulesSummary.triggered > 0 ? "bg-destructive/15" : "bg-muted"
            )}>
              {rulesSummary.triggered > 0 ? (
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              ) : (
                <ShieldAlert className="h-3.5 w-3.5 text-success" />
              )}
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-jakarta">Rules</span>
          </div>

          <p className={cn(
            "text-sm font-semibold font-jakarta leading-tight",
            rulesSummary.complianceRate === 100 ? "text-success" : rulesSummary.triggered > 0 ? "text-destructive" : "text-foreground"
          )}>
            {rulesSummary.label}
          </p>

          {/* Status dots row */}
          <div className="flex gap-1.5 items-center">
            {rules.slice(0, 8).map((rule) => {
              let dotColor = 'bg-success';
              try {
                const stored = localStorage.getItem('rule-meta');
                if (stored) {
                  const meta = JSON.parse(stored);
                  if (meta[rule.id]?.status === 'triggered') dotColor = 'bg-destructive';
                  else if (meta[rule.id]?.status === 'paused') dotColor = 'bg-muted-foreground';
                }
              } catch {}
              return (
                <span key={rule.id} className={cn("h-2 w-2 rounded-full", dotColor)} />
              );
            })}
            {rules.length > 8 && (
              <span className="text-[10px] text-muted-foreground ml-1">+{rules.length - 8}</span>
            )}
          </div>
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
