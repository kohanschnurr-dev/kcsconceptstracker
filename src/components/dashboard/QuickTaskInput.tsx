import { useState } from 'react';
import { Plus, CalendarIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface QuickTaskInputProps {
  onTaskCreated?: () => void;
}

export function QuickTaskInput({ onTaskCreated }: QuickTaskInputProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: title.trim(),
          status: 'pending',
          priority_level: 'medium',
          due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
        });

      if (error) throw error;

      setTitle('');
      setDueDate(undefined);
      toast({
        title: 'Task added',
        description: 'Your task has been added to the checklist.',
      });
      onTaskCreated?.();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Quick add task... (press Enter to save)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="pl-9"
          disabled={isSubmitting}
        />
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "shrink-0 gap-1",
              dueDate && "text-primary"
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            {dueDate && <span className="text-xs">{format(dueDate, 'MMM d')}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={dueDate}
            onSelect={setDueDate}
            initialFocus
            className="p-3 pointer-events-auto"
          />
          {dueDate && (
            <div className="px-3 pb-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setDueDate(undefined)}
              >
                <X className="h-3 w-3 mr-1" /> Clear date
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      <Button type="submit" disabled={!title.trim() || isSubmitting} size="sm">
        Add
      </Button>
    </form>
  );
}
