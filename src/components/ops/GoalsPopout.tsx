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
import { Plus, X } from 'lucide-react';
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
}

export function GoalsPopout({ open, onOpenChange, goals, onAddGoal }: GoalsPopoutProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [category, setCategory] = useState('financial');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Quarterly Goals</DialogTitle>
            {onAddGoal && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
            )}
          </div>
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
              <Button
                size="sm"
                className="w-full"
                disabled={!title.trim() || !targetValue || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? 'Adding...' : 'Add Goal'}
              </Button>
            </div>
          )}

          {/* Financial Goals */}
          {financialGoals.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Financial Goals</h4>
              {financialGoals.map((goal) => {
                const current = goal.current_value || 0;
                const percent = Math.min((current / goal.target_value) * 100, 100);
                
                return (
                  <div key={goal.id} className="space-y-2 p-3 rounded-lg bg-muted/20">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{goal.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatValue(current, goal.category)} / {formatValue(goal.target_value, goal.category)}
                      </span>
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
              })}
            </div>
          )}

          {/* Task Completion Goals */}
          {taskGoals.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Task Completion Goals</h4>
              {taskGoals.map((goal) => {
                const current = goal.current_value || 0;
                const percent = Math.min((current / goal.target_value) * 100, 100);
                
                return (
                  <div key={goal.id} className="space-y-2 p-3 rounded-lg bg-muted/20">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{goal.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {current} / {goal.target_value}
                      </span>
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
              })}
            </div>
          )}

          {goals.length === 0 && !showForm && (
            <p className="text-center text-muted-foreground py-8">No goals set for this quarter</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
