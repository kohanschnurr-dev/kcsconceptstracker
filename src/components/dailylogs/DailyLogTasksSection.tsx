import { useState } from 'react';
import { Plus, Trash2, CheckSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface TaskItem {
  id?: string;
  description: string;
  is_complete: boolean;
  isNew?: boolean;
}

interface DailyLogTasksSectionProps {
  tasks: TaskItem[];
  onTasksChange: (tasks: TaskItem[]) => void;
  disabled?: boolean;
}

export function DailyLogTasksSection({ tasks, onTasksChange, disabled }: DailyLogTasksSectionProps) {
  const [newTaskDescription, setNewTaskDescription] = useState('');

  const addTask = () => {
    if (!newTaskDescription.trim()) return;
    
    const newTask: TaskItem = {
      description: newTaskDescription.trim(),
      is_complete: false,
      isNew: true,
    };
    
    onTasksChange([...tasks, newTask]);
    setNewTaskDescription('');
  };

  const toggleTask = (index: number) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], is_complete: !updated[index].is_complete };
    onTasksChange(updated);
  };

  const removeTask = (index: number) => {
    onTasksChange(tasks.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTask();
    }
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <CheckSquare className="h-4 w-4" />
        Items To Complete
      </Label>
      
      {/* Add new task */}
      <div className="flex gap-2">
        <Input
          placeholder="Add new task..."
          value={newTaskDescription}
          onChange={(e) => setNewTaskDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1"
        />
        <Button 
          type="button" 
          size="icon" 
          variant="secondary"
          onClick={addTask}
          disabled={disabled || !newTaskDescription.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Task list */}
      {tasks.length > 0 && (
        <div className="space-y-2 max-h-[200px] overflow-y-auto rounded-lg border border-border p-2">
          {tasks.map((task, index) => (
            <div
              key={task.id || `new-${index}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <Checkbox
                checked={task.is_complete}
                onCheckedChange={() => toggleTask(index)}
                disabled={disabled}
              />
              <span className={`flex-1 text-sm ${task.is_complete ? 'line-through text-muted-foreground' : ''}`}>
                {task.description}
              </span>
              <button
                type="button"
                onClick={() => removeTask(index)}
                disabled={disabled}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {tasks.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No tasks added yet. Add items that need to be completed.
        </p>
      )}
    </div>
  );
}
