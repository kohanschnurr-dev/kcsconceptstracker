import { useState, useEffect } from 'react';
import { Plus, Minus, Target, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuarterlyGoal {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  quarter: string;
  category: string;
}

const getCurrentQuarter = () => {
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${quarter} ${now.getFullYear()}`;
};

const DEFAULT_GOALS = [
  { title: 'Flips Closed', target_value: 3, current_value: 0 },
  { title: 'Multi-family Deals Underwritten', target_value: 10, current_value: 0 },
  { title: 'Rental Acquisitions', target_value: 2, current_value: 0 },
];

export function QuarterlyGoalsCard() {
  const [goals, setGoals] = useState<QuarterlyGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', target: '' });
  const { toast } = useToast();
  
  const currentQuarter = getCurrentQuarter();

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('quarterly_goals')
        .select('*')
        .eq('quarter', currentQuarter)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Seed default goals if empty for current quarter
      if (!data || data.length === 0) {
        await seedDefaultGoals(user.id);
        return;
      }

      setGoals(data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const seedDefaultGoals = async (userId: string) => {
    try {
      const goalsToInsert = DEFAULT_GOALS.map(goal => ({
        user_id: userId,
        title: goal.title,
        target_value: goal.target_value,
        current_value: goal.current_value,
        quarter: currentQuarter,
        category: 'general',
      }));

      const { data, error } = await supabase
        .from('quarterly_goals')
        .insert(goalsToInsert)
        .select();

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error seeding goals:', error);
    }
  };

  const updateGoalValue = async (goal: QuarterlyGoal, delta: number) => {
    const newValue = Math.max(0, Math.min(goal.target_value, goal.current_value + delta));
    
    try {
      const { error } = await supabase
        .from('quarterly_goals')
        .update({ current_value: newValue })
        .eq('id', goal.id);

      if (error) throw error;

      setGoals(prev => prev.map(g => 
        g.id === goal.id ? { ...g, current_value: newValue } : g
      ));

      if (newValue === goal.target_value && delta > 0) {
        toast({
          title: '🎉 Goal achieved!',
          description: `You've completed: ${goal.title}`,
        });
      }
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const addGoal = async () => {
    if (!newGoal.title.trim() || !newGoal.target) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('quarterly_goals')
        .insert({
          user_id: user.id,
          title: newGoal.title.trim(),
          target_value: parseInt(newGoal.target),
          current_value: 0,
          quarter: currentQuarter,
          category: 'general',
        })
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => [...prev, data]);
      setNewGoal({ title: '', target: '' });
      setShowAddGoal(false);
      
      toast({
        title: 'Goal added',
        description: 'New quarterly goal created',
      });
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quarterly_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-success';
    if (percentage >= 50) return 'bg-warning';
    return 'bg-primary';
  };

  return (
    <div className="ops-panel p-4 h-full">
      <div className="ops-header flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Target className="h-3 w-3" />
          GOALS ({currentQuarter})
        </span>
        <button
          onClick={() => setShowAddGoal(!showAddGoal)}
          className="text-primary hover:text-primary/80"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-4">Loading...</div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const percentage = Math.round((goal.current_value / goal.target_value) * 100);
            const progressColor = getProgressColor(percentage);
            
            return (
              <div key={goal.id} className="group space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{goal.title}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateGoalValue(goal, -1)}
                      className="p-0.5 hover:bg-muted/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Minus className="h-3 w-3 text-muted-foreground" />
                    </button>
                    <span className="text-xs font-mono text-primary min-w-[3rem] text-center">
                      {goal.current_value}/{goal.target_value}
                    </span>
                    <button
                      onClick={() => updateGoalValue(goal, 1)}
                      className="p-0.5 hover:bg-muted/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus className="h-3 w-3 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-0.5 hover:bg-destructive/20 rounded opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
                <div className="progress-industrial">
                  <div 
                    className={`h-full transition-all duration-300 ${progressColor}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-right">
                  <span className={`text-xs font-mono ${
                    percentage >= 100 ? 'text-success' : 'text-muted-foreground'
                  }`}>
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new goal form */}
      {showAddGoal && (
        <div className="mt-4 pt-3 border-t border-border/30 space-y-2">
          <Input
            placeholder="Goal title..."
            value={newGoal.title}
            onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
            className="h-8 text-sm bg-transparent border-border/30"
          />
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Target"
              value={newGoal.target}
              onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
              className="h-8 text-sm bg-transparent border-border/30 w-20"
            />
            <Button
              size="sm"
              onClick={addGoal}
              disabled={!newGoal.title.trim() || !newGoal.target}
              className="h-8 flex-1"
            >
              Add Goal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
