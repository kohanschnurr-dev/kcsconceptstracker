import { useState, useEffect } from 'react';
import { Plus, Check, Circle, Calendar, Trash2, Loader2, Flag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

interface MilestonesTimelineProps {
  projectId: string;
}

export function MilestonesTimeline({ projectId }: MilestonesTimelineProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMilestones = async () => {
    const { data, error } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching milestones:', error);
    } else {
      setMilestones(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setSubmitting(true);

    const { error } = await supabase
      .from('project_milestones')
      .insert({
        project_id: projectId,
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
        sort_order: milestones.length,
      });

    if (error) {
      toast.error('Failed to add milestone');
      console.error(error);
    } else {
      toast.success('Milestone added');
      setTitle('');
      setDescription('');
      setDueDate('');
      setIsOpen(false);
      fetchMilestones();
    }
    setSubmitting(false);
  };

  const toggleComplete = async (milestone: Milestone) => {
    const { error } = await supabase
      .from('project_milestones')
      .update({
        completed_at: milestone.completed_at ? null : new Date().toISOString(),
      })
      .eq('id', milestone.id);

    if (error) {
      toast.error('Failed to update milestone');
    } else {
      fetchMilestones();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('project_milestones')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete milestone');
    } else {
      toast.success('Milestone deleted');
      fetchMilestones();
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (dueDate: string | null, completedAt: string | null) => {
    if (!dueDate || completedAt) return false;
    return new Date(dueDate) < new Date();
  };

  const completedCount = milestones.filter(m => m.completed_at).length;
  const progress = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flag className="h-5 w-5" />
          Milestones ({completedCount}/{milestones.length})
        </CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Milestone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Milestone</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Foundation Complete"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details..."
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input 
                  type="date"
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <Button onClick={handleAdd} disabled={!title.trim() || submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Milestone
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        {milestones.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : milestones.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No milestones yet. Add some to track project progress!
          </p>
        ) : (
          <div className="space-y-1">
            {milestones.map((milestone, index) => (
              <div 
                key={milestone.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg transition-colors",
                  milestone.completed_at ? "bg-success/10" : "bg-muted/50 hover:bg-muted"
                )}
              >
                <button
                  onClick={() => toggleComplete(milestone)}
                  className={cn(
                    "mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                    milestone.completed_at 
                      ? "bg-success border-success text-success-foreground" 
                      : "border-muted-foreground hover:border-primary"
                  )}
                >
                  {milestone.completed_at && <Check className="h-3 w-3" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-medium",
                      milestone.completed_at && "line-through text-muted-foreground"
                    )}>
                      {milestone.title}
                    </span>
                    {isOverdue(milestone.due_date, milestone.completed_at) && (
                      <span className="text-xs px-2 py-0.5 rounded bg-destructive/20 text-destructive">
                        Overdue
                      </span>
                    )}
                  </div>
                  {milestone.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{milestone.description}</p>
                  )}
                  {milestone.due_date && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      Due {formatDate(milestone.due_date)}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(milestone.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
