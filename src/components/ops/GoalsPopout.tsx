import { useState, useMemo } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus, X, Pencil, Check, Minus, ChevronDown, CheckCircle2,
  Calendar, RotateCcw, Trash2, Target, ShieldCheck, TrendingUp,
  Zap, Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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

interface GoalsPopoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goals: Goal[];
  onAddGoal?: (goal: { title: string; target_value: number; category: string; start_date?: string; due_date?: string }) => Promise<void>;
  onUpdateGoal?: (goalId: string, newValue: number) => Promise<void>;
  onCompleteGoal?: (goalId: string) => Promise<void>;
  onUncompleteGoal?: (goalId: string) => Promise<void>;
  onDeleteGoal?: (goalId: string) => Promise<void>;
}

const SEGMENT_COUNT = 10;

export function GoalsPopout({ open, onOpenChange, goals, onAddGoal, onUpdateGoal, onCompleteGoal, onUncompleteGoal, onDeleteGoal }: GoalsPopoutProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [category, setCategory] = useState('financial');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  const activeGoals = goals.filter(g => !g.completed_at);
  const completedGoals = goals.filter(g => !!g.completed_at);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (activeGoals.length === 0) return { avgProgress: 0, onTrack: 0, atRisk: 0 };
    const percents = activeGoals.map(g => Math.min(((g.current_value || 0) / g.target_value) * 100, 100));
    const avgProgress = percents.reduce((a, b) => a + b, 0) / percents.length;
    const onTrack = percents.filter(p => p >= 50).length;
    const atRisk = percents.filter(p => p < 50).length;
    return { avgProgress, onTrack, atRisk };
  }, [activeGoals]);

  const handleSubmit = async () => {
    if (!title.trim() || !targetValue || !onAddGoal) return;
    setIsSubmitting(true);
    try {
      await onAddGoal({
        title: title.trim(),
        target_value: parseFloat(targetValue),
        category,
        start_date: startDate || undefined,
        due_date: dueDate || undefined,
      });
      setTitle('');
      setTargetValue('');
      setCategory('financial');
      setStartDate('');
      setDueDate('');
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setEditValue(String(goal.current_value || 0));
  };

  const handleSaveEdit = async (goalId: string) => {
    if (!onUpdateGoal) return;
    const newVal = parseFloat(editValue);
    if (isNaN(newVal)) return;
    await onUpdateGoal(goalId, newVal);
    setEditingGoalId(null);
  };

  const handleStepValue = async (goal: Goal, delta: number) => {
    if (!onUpdateGoal) return;
    const newVal = Math.max(0, (goal.current_value || 0) + delta);
    setEditValue(String(newVal));
    await onUpdateGoal(goal.id, newVal);
  };

  const formatValue = (value: number, cat: string | null) => {
    if (cat === 'financial') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return value.toString();
  };

  const getHealthStatus = (percent: number): { label: string; color: string; bgColor: string; trackColor: string } => {
    if (percent >= 60) return { label: 'On Track', color: 'text-cyan-400', bgColor: 'bg-cyan-500/15', trackColor: 'bg-cyan-400' };
    if (percent >= 30) return { label: 'At Risk', color: 'text-amber-400', bgColor: 'bg-amber-500/15', trackColor: 'bg-amber-400' };
    return { label: 'Behind', color: 'text-red-400', bgColor: 'bg-red-500/15', trackColor: 'bg-red-400' };
  };

  const getVelocity = (goal: Goal) => {
    const current = goal.current_value || 0;
    const target = goal.target_value;
    if (current === 0 || target === 0) return null;
    // Simulate velocity as percentage of target achieved (contextual hint)
    const velocity = Math.round((current / target) * 100);
    if (velocity >= 80) return { value: '+' + (velocity - 75) + '%', positive: true };
    if (velocity >= 40) return { value: '+' + Math.round(velocity / 3) + '%', positive: true };
    return { value: '-' + (50 - velocity) + '%', positive: false };
  };

  const formatDateLabel = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr + 'T00:00:00'), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const getCategoryIcon = (cat: string | null) => {
    if (cat === 'financial') return Target;
    return ShieldCheck;
  };

  const renderSegmentedTrack = (percent: number, health: ReturnType<typeof getHealthStatus>) => {
    const filledSegments = Math.round((percent / 100) * SEGMENT_COUNT);
    return (
      <div className="segmented-track">
        {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "segment transition-all duration-300",
              i < filledSegments ? health.trackColor : "bg-slate-700/50"
            )}
          />
        ))}
      </div>
    );
  };

  const renderGoalCard = (goal: Goal, isCompleted = false) => {
    const current = goal.current_value || 0;
    const percent = Math.min((current / goal.target_value) * 100, 100);
    const isEditing = editingGoalId === goal.id;
    const isTask = goal.category === 'task_completion';
    const health = getHealthStatus(percent);
    const velocity = getVelocity(goal);
    const Icon = getCategoryIcon(goal.category);

    return (
      <div
        key={goal.id}
        className={cn(
          "p-4 rounded-xl border transition-all duration-300",
          isCompleted
            ? "border-slate-700/40 bg-slate-800/30"
            : "border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-900/40 hover:border-slate-600/60"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className={cn("p-1.5 rounded-lg mt-0.5", health.bgColor)}>
              <Icon className={cn("h-4 w-4", health.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold font-jakarta block">{goal.title}</span>
              {(goal.start_date || goal.due_date) && !isCompleted && (
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3 text-slate-500" />
                  <span className="text-xs text-slate-500">
                    {goal.start_date && goal.due_date
                      ? `${formatDateLabel(goal.start_date)} – ${formatDateLabel(goal.due_date)}`
                      : goal.due_date
                      ? `Due ${formatDateLabel(goal.due_date)}`
                      : `Started ${formatDateLabel(goal.start_date)}`}
                  </span>
                </div>
              )}
              {isCompleted && goal.completed_at && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-emerald-500" />
                  Completed {format(new Date(goal.completed_at), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          {!isCompleted && isEditing ? (
            <div className="flex items-center gap-1">
              {isTask ? (
                <>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700" onClick={() => handleStepValue(goal, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="h-7 w-16 text-center text-xs bg-slate-800 border-slate-600"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700" onClick={() => handleStepValue(goal, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <Input
                  type="number"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="h-7 w-24 text-xs bg-slate-800 border-slate-600"
                  placeholder="$"
                />
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-cyan-400 hover:bg-cyan-500/20" onClick={() => handleSaveEdit(goal.id)}>
                <Check className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-slate-700" onClick={() => setEditingGoalId(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : !isCompleted ? (
            <div className="flex items-center gap-0.5">
              {onUpdateGoal && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700" onClick={() => handleStartEdit(goal)}>
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
              {onCompleteGoal && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/15" onClick={() => onCompleteGoal(goal.id)}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDeleteGoal && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400/60 hover:text-red-400 hover:bg-red-500/15" onClick={() => onDeleteGoal(goal.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {onUncompleteGoal && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700" onClick={() => onUncompleteGoal(goal.id)} title="Reopen goal">
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Contextual data row */}
        {!isCompleted && (
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-3">
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", health.bgColor, health.color)}>
                {health.label}
              </span>
              {velocity && (
                <span className={cn(
                  "text-xs font-medium flex items-center gap-0.5",
                  velocity.positive ? "text-cyan-400" : "text-red-400"
                )}>
                  <TrendingUp className={cn("h-3 w-3", !velocity.positive && "rotate-180")} />
                  {velocity.value} velocity
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">
              {isTask
                ? `${current} / ${goal.target_value}`
                : `${formatValue(current, goal.category)} / ${formatValue(goal.target_value, goal.category)}`}
            </span>
          </div>
        )}

        {/* Segmented Progress Track */}
        {renderSegmentedTrack(percent, health)}

        {/* Projected vs Actual footer */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-slate-500">
            Projected: {formatValue(goal.target_value, goal.category)}
          </span>
          <span className={cn("text-[11px] font-semibold font-jakarta", health.color)}>
            {percent.toFixed(0)}% achieved
          </span>
        </div>
      </div>
    );
  };

  const activeFinancial = activeGoals.filter(g => g.category === 'financial');
  const activeTasks = activeGoals.filter(g => g.category === 'task_completion');

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 overlay-dashboard flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
    >
      <div className="overlay-dashboard-panel-rounded w-full max-w-lg max-h-[85vh] flex flex-col font-jakarta animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
              <Target className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Quarterly Goals</h2>
              <p className="text-xs text-slate-400">Q1 2026 Performance Dashboard</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Summary Banner */}
        {activeGoals.length > 0 && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-700/40 border border-slate-700/40">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-semibold font-jakarta text-white">{summaryStats.avgProgress.toFixed(0)}%</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">Avg Progress</p>
              </div>
              <div>
                <p className="text-2xl font-semibold font-jakarta text-cyan-400">{summaryStats.onTrack}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">On Track</p>
              </div>
              <div>
                <p className="text-2xl font-semibold font-jakarta text-amber-400">{summaryStats.atRisk}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">At Risk</p>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-5">
          {/* Add Goal Form */}
          {showForm && (
            <div className="space-y-3 p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
              <Input
                placeholder="Goal title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="bg-slate-800/80 border-slate-600 font-jakarta"
              />
              <Input
                type="number"
                placeholder="Target value"
                value={targetValue}
                onChange={e => setTargetValue(e.target.value)}
                className="bg-slate-800/80 border-slate-600"
              />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-slate-800/80 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="task_completion">Task Completion</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Start Date</label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs bg-slate-800/80 border-slate-600" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Due Date</label>
                  <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="text-xs bg-slate-800/80 border-slate-600" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-jakarta font-semibold"
                  disabled={!title.trim() || !targetValue || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? 'Adding...' : 'Add Goal'}
                </Button>
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Active Financial Goals */}
          {activeFinancial.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-cyan-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Profit Targets</h4>
              </div>
              {activeFinancial.map(g => renderGoalCard(g))}
            </div>
          )}

          {/* Active Task Goals */}
          {activeTasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Budget & Task Milestones</h4>
              </div>
              {activeTasks.map(g => renderGoalCard(g))}
            </div>
          )}

          {activeGoals.length === 0 && !showForm && (
            <div className="text-center py-12">
              <div className="p-3 rounded-2xl bg-slate-800/50 w-fit mx-auto mb-3">
                <Zap className="h-6 w-6 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm">No active goals</p>
              <p className="text-slate-500 text-xs mt-1">Create your first goal to start tracking</p>
            </div>
          )}

          {/* Add New Goal */}
          {onAddGoal && !showForm && (
            <Button
              variant="outline"
              className="w-full border-dashed border-slate-600 text-slate-300 hover:text-white hover:border-cyan-500/50 hover:bg-cyan-500/5 font-jakarta"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Goal
            </Button>
          )}

          {/* Completed Goals History */}
          {completedGoals.length > 0 && (
            <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors w-full">
                  <ChevronDown className={cn("h-4 w-4 transition-transform", historyOpen && "rotate-180")} />
                  <Trophy className="h-3.5 w-3.5 text-emerald-500" />
                  Achievements ({completedGoals.length})
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3">
                {completedGoals.map(g => renderGoalCard(g, true))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
}
