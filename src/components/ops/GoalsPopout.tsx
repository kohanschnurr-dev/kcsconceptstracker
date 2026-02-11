import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X, Pencil, Check, Minus, ChevronDown, CheckCircle2, Calendar, RotateCcw } from 'lucide-react';
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
}

export function GoalsPopout({ open, onOpenChange, goals, onAddGoal, onUpdateGoal, onCompleteGoal, onUncompleteGoal }: GoalsPopoutProps) {
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

  const getProgressColor = (percent: number) => {
    if (percent >= 75) return 'bg-emerald-500';
    if (percent >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const formatDateLabel = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr + 'T00:00:00'), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const renderGoalCard = (goal: Goal, isCompleted = false) => {
    const current = goal.current_value || 0;
    const percent = Math.min((current / goal.target_value) * 100, 100);
    const isEditing = editingGoalId === goal.id;
    const isTask = goal.category === 'task_completion';

    return (
      <div key={goal.id} className="space-y-2 p-3 rounded-lg bg-muted/20">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium">{goal.title}</span>
            {(goal.start_date || goal.due_date) && !isCompleted && (
              <div className="flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {goal.start_date && goal.due_date
                    ? `${formatDateLabel(goal.start_date)} – ${formatDateLabel(goal.due_date)}`
                    : goal.due_date
                    ? `Due ${formatDateLabel(goal.due_date)}`
                    : `Started ${formatDateLabel(goal.start_date)}`}
                </span>
              </div>
            )}
            {isCompleted && goal.completed_at && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Completed {format(new Date(goal.completed_at), 'MMM d, yyyy')}
              </p>
            )}
          </div>
          {!isCompleted && isEditing ? (
            <div className="flex items-center gap-1">
              {isTask ? (
                <>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStepValue(goal, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="h-7 w-16 text-center text-xs"
                  />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStepValue(goal, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <Input
                  type="number"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="h-7 w-24 text-xs"
                  placeholder="$"
                />
              )}
              <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-500" onClick={() => handleSaveEdit(goal.id)}>
                <Check className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingGoalId(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : !isCompleted ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {isTask ? `${current} / ${goal.target_value}` : `${formatValue(current, goal.category)} / ${formatValue(goal.target_value, goal.category)}`}
              </span>
              {onUpdateGoal && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStartEdit(goal)}>
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
              {onCompleteGoal && (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-500 hover:text-emerald-400" onClick={() => onCompleteGoal(goal.id)}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {isTask ? `${current} / ${goal.target_value}` : `${formatValue(current, goal.category)} / ${formatValue(goal.target_value, goal.category)}`}
              </span>
              {onUncompleteGoal && (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => onUncompleteGoal(goal.id)} title="Reopen goal">
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="relative">
          <Progress value={percent} className="h-2" />
          <div
            className={cn("absolute inset-y-0 left-0 rounded-full transition-all", getProgressColor(percent))}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-right text-muted-foreground">{percent.toFixed(0)}%</p>
      </div>
    );
  };

  const activeFinancial = activeGoals.filter(g => g.category === 'financial');
  const activeTasks = activeGoals.filter(g => g.category === 'task_completion');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quarterly Goals</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {showForm && (
            <div className="space-y-3 p-3 rounded-lg border border-border/50 bg-muted/30">
              <Input placeholder="Goal title" value={title} onChange={e => setTitle(e.target.value)} />
              <Input type="number" placeholder="Target value" value={targetValue} onChange={e => setTargetValue(e.target.value)} />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="task_completion">Task Completion</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
                  <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="text-xs" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" disabled={!title.trim() || !targetValue || isSubmitting} onClick={handleSubmit}>
                  {isSubmitting ? 'Adding...' : 'Add Goal'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Active Financial Goals */}
          {activeFinancial.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Financial Goals</h4>
              {activeFinancial.map(g => renderGoalCard(g))}
            </div>
          )}

          {/* Active Task Goals */}
          {activeTasks.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Task Completion Goals</h4>
              {activeTasks.map(g => renderGoalCard(g))}
            </div>
          )}

          {activeGoals.length === 0 && !showForm && (
            <p className="text-center text-muted-foreground py-8">No active goals</p>
          )}

          {/* Add New Goal */}
          {onAddGoal && !showForm && (
            <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Goal
            </Button>
          )}

          {/* Completed Goals History */}
          {completedGoals.length > 0 && (
            <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
                  <ChevronDown className={cn("h-4 w-4 transition-transform", historyOpen && "rotate-180")} />
                  View Completed ({completedGoals.length})
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3">
                {completedGoals.map(g => renderGoalCard(g, true))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
