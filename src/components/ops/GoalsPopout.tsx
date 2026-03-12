import { useState } from 'react';
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
  Calendar, RotateCcw, Trash2, Crosshair, Trophy,
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

  const formatDateLabel = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr + 'T00:00:00'), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  /** Render a single Strategic Target card */
  const renderTargetCard = (goal: Goal, isCompleted = false) => {
    const current = goal.current_value || 0;
    const target = goal.target_value;
    const isEditing = editingGoalId === goal.id;
    const isTask = goal.category === 'task_completion';
    const isFinancial = goal.category === 'financial';

    // Determine if target is met
    const isMet = current >= target;

    return (
      <div
        key={goal.id}
        className={cn(
          "p-5 rounded-xl border transition-all duration-200",
          isCompleted
            ? "border-slate-700/30 bg-slate-800/20"
            : isMet
            ? "border-emerald-800/40 bg-emerald-950/10"
            : "border-slate-700/40 bg-slate-800/20 hover:border-slate-600/50"
        )}
      >
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold font-jakarta text-slate-200 leading-tight">
              {goal.title}
            </h4>
            {(goal.start_date || goal.due_date) && !isCompleted && (
              <div className="flex items-center gap-1 mt-1.5">
                <Calendar className="h-3 w-3 text-slate-600" />
                <span className="text-[11px] text-slate-500">
                  {goal.start_date && goal.due_date
                    ? `${formatDateLabel(goal.start_date)} – ${formatDateLabel(goal.due_date)}`
                    : goal.due_date
                    ? `Due ${formatDateLabel(goal.due_date)}`
                    : `Started ${formatDateLabel(goal.start_date)}`}
                </span>
              </div>
            )}
            {isCompleted && goal.completed_at && (
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <Trophy className="h-3 w-3 text-slate-500" />
                Achieved {format(new Date(goal.completed_at), 'MMM d, yyyy')}
              </p>
            )}
          </div>

          {/* Actions */}
          {!isCompleted && !isEditing && (
            <div className="flex items-center gap-0.5 shrink-0">
              {onUpdateGoal && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-white hover:bg-slate-700" onClick={() => handleStartEdit(goal)}>
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
              {onCompleteGoal && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10" onClick={() => onCompleteGoal(goal.id)}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDeleteGoal && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:text-red-400 hover:bg-red-500/10" onClick={() => onDeleteGoal(goal.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
          {isCompleted && onUncompleteGoal && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-white hover:bg-slate-700" onClick={() => onUncompleteGoal(goal.id)} title="Reopen">
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* The Data — Target vs. Current Reality */}
        {!isCompleted && (
          <div className="flex items-end justify-between gap-4">
            {/* Target */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-medium mb-1">Target</p>
              <p className="text-lg font-semibold font-jakarta text-slate-300">
                {formatValue(target, goal.category)}
              </p>
            </div>

            {/* Current Reality — editable */}
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-medium mb-1">Current Reality</p>
              {isEditing ? (
                <div className="flex items-center gap-1 justify-end">
                  {isTask && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700" onClick={() => handleStepValue(goal, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                  )}
                  <Input
                    type="number"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className={cn("h-8 text-right text-sm bg-slate-800 border-slate-600", isTask ? "w-16 text-center" : "w-24")}
                    placeholder={isFinancial ? "$" : "0"}
                  />
                  {isTask && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700" onClick={() => handleStepValue(goal, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-400 hover:bg-emerald-500/15" onClick={() => handleSaveEdit(goal.id)}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-slate-700" onClick={() => setEditingGoalId(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <p className={cn(
                  "text-lg font-semibold font-jakarta",
                  isMet ? "text-emerald-400" : "text-white"
                )}>
                  {formatValue(current, goal.category)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Completed: show final values */}
        {isCompleted && (
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-600 font-medium mb-1">Target</p>
              <p className="text-base font-semibold font-jakarta text-slate-500">
                {formatValue(target, goal.category)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-600 font-medium mb-1">Final</p>
              <p className="text-base font-semibold font-jakarta text-slate-500">
                {formatValue(current, goal.category)}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

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
            <div className="p-2 rounded-xl bg-gradient-to-br from-slate-700/40 to-slate-600/20 border border-slate-600/30">
              <Crosshair className="h-5 w-5 text-slate-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Strategic Targets</h2>
              <p className="text-xs text-slate-500">Q1 2026 · Target vs. Reality</p>
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
          {/* Add Target Form */}
          {showForm && (
            <div className="space-y-3 p-4 rounded-xl border border-slate-600/30 bg-slate-800/30">
              <Input
                placeholder="Target name (e.g., SOW Variance < 5%)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="bg-slate-800/80 border-slate-600 font-jakarta font-semibold"
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
                  <SelectItem value="task_completion">Task / Metric</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1 block">Start Date</label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs bg-slate-800/80 border-slate-600" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1 block">Due Date</label>
                  <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="text-xs bg-slate-800/80 border-slate-600" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-jakarta font-semibold"
                  disabled={!title.trim() || !targetValue || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? 'Adding...' : 'Set Target'}
                </Button>
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Active Targets */}
          {activeGoals.length > 0 && (
            <div className="space-y-3">
              {activeGoals.map(g => renderTargetCard(g))}
            </div>
          )}

          {activeGoals.length === 0 && !showForm && (
            <div className="text-center py-12">
              <div className="p-3 rounded-2xl bg-slate-800/50 w-fit mx-auto mb-3">
                <Crosshair className="h-6 w-6 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm">No strategic targets</p>
              <p className="text-slate-500 text-xs mt-1">Set your first target to track against reality</p>
            </div>
          )}

          {/* Add New Target */}
          {onAddGoal && !showForm && (
            <Button
              variant="outline"
              className="w-full border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800/30 font-jakarta"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Target
            </Button>
          )}

          {/* Achieved History */}
          {completedGoals.length > 0 && (
            <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors w-full">
                  <ChevronDown className={cn("h-4 w-4 transition-transform", historyOpen && "rotate-180")} />
                  <Trophy className="h-3.5 w-3.5 text-slate-500" />
                  Achieved ({completedGoals.length})
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3">
                {completedGoals.map(g => renderTargetCard(g, true))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
}
