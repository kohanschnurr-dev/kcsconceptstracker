import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Plus, X, Pencil, Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Goal {
  id: string;
  title: string;
  target_value: number;
  current_value: number | null;
  category: string | null;
}

interface GoalsPopoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goals: Goal[];
  onAddGoal?: (goal: { title: string; target_value: number; category: string }) => Promise<void>;
  onUpdateGoal?: (goalId: string, newValue: number) => Promise<void>;
}

export function GoalsPopout({ open, onOpenChange, goals, onAddGoal, onUpdateGoal }: GoalsPopoutProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [category, setCategory] = useState('financial');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleSubmit = async () => {
    if (!title.trim() || !targetValue || !onAddGoal) return;
    setIsSubmitting(true);
    try {
      await onAddGoal({ title: title.trim(), target_value: parseFloat(targetValue), category });
      setTitle('');
      setTargetValue('');
      setCategory('financial');
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
    await onUpdateGoal(goal.id, newVal);
  };

  const formatValue = (value: number, category: string | null) => {
    if (category === 'financial') {
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

  const financialGoals = goals.filter(g => g.category === 'financial');
  const taskGoals = goals.filter(g => g.category === 'task_completion');

  const renderGoalCard = (goal: Goal) => {
    const current = goal.current_value || 0;
    const percent = Math.min((current / goal.target_value) * 100, 100);
    const isEditing = editingGoalId === goal.id;
    const isTask = goal.category === 'task_completion';

    return (
      <div key={goal.id} className="space-y-2 p-3 rounded-lg bg-muted/20">
        <div className="flex justify-between items-center gap-2">
          <span className="text-sm font-medium flex-1">{goal.title}</span>
          {isEditing ? (
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
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {isTask ? `${current} / ${goal.target_value}` : `${formatValue(current, goal.category)} / ${formatValue(goal.target_value, goal.category)}`}
              </span>
              {onUpdateGoal && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStartEdit(goal)}>
                  <Pencil className="h-3 w-3" />
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quarterly Goals</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {showForm && (
            <div className="space-y-3 p-3 rounded-lg border border-border/50 bg-muted/30">
              <Input
                placeholder="Goal title"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Target value"
                value={targetValue}
                onChange={e => setTargetValue(e.target.value)}
              />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="task_completion">Task Completion</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={!title.trim() || !targetValue || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? 'Adding...' : 'Add Goal'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Financial Goals */}
          {financialGoals.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Financial Goals</h4>
              {financialGoals.map(renderGoalCard)}
            </div>
          )}

          {/* Task Completion Goals */}
          {taskGoals.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Task Completion Goals</h4>
              {taskGoals.map(renderGoalCard)}
            </div>
          )}

          {goals.length === 0 && !showForm && (
            <p className="text-center text-muted-foreground py-8">No goals set for this quarter</p>
          )}

          {/* Add New Goal button at the bottom */}
          {onAddGoal && !showForm && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Goal
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
