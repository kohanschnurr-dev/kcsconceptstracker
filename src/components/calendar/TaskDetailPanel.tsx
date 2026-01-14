import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { 
  X, 
  CheckCircle2, 
  Circle,
  Upload,
  FileText,
  Trash2,
  AlertTriangle,
  DollarSign,
  Calendar,
  Link2
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { CalendarTask } from '@/pages/Calendar';

interface TaskDetailPanelProps {
  task: CalendarTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdate: (task: CalendarTask) => void;
  allTasks: CalendarTask[];
}

export function TaskDetailPanel({ task, open, onOpenChange, onTaskUpdate, allTasks }: TaskDetailPanelProps) {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  if (!task) return null;

  const completedCount = task.checklist.filter(c => c.completed).length;
  const progress = task.checklist.length > 0 ? (completedCount / task.checklist.length) * 100 : 0;

  const toggleChecklistItem = (itemId: string) => {
    const updatedChecklist = task.checklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onTaskUpdate({ ...task, checklist: updatedChecklist });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      toast({
        title: 'Files Added',
        description: `${newFiles.length} file(s) attached to task.`,
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateNotes = (notes: string) => {
    onTaskUpdate({ ...task, notes });
  };

  const getDependencies = () => {
    if (!task.dependsOn) return [];
    return task.dependsOn
      .map(id => allTasks.find(t => t.id === id))
      .filter(Boolean) as CalendarTask[];
  };

  const getDependents = () => {
    return allTasks.filter(t => t.dependsOn?.includes(task.id));
  };

  const getStatusColor = (status: CalendarTask['status']) => {
    switch (status) {
      case 'permitting': return 'bg-purple-500/20 text-purple-400';
      case 'demo': return 'bg-orange-500/20 text-orange-400';
      case 'rough-in': return 'bg-blue-500/20 text-blue-400';
      case 'finish': return 'bg-cyan-500/20 text-cyan-400';
      case 'complete': return 'bg-emerald-500/20 text-emerald-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getBudgetColor = (health: CalendarTask['budgetHealth']) => {
    switch (health) {
      case 'green': return 'text-emerald-400';
      case 'yellow': return 'text-amber-400';
      case 'red': return 'text-red-400';
    }
  };

  const dependencies = getDependencies();
  const dependents = getDependents();
  const hasOrderWarning = dependencies.some(dep => dep.status !== 'complete');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-slate-900 border-slate-800 overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl text-white">{task.title}</SheetTitle>
              <p className="text-sm text-slate-400 mt-1">{task.projectName}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status and Budget */}
          <div className="flex items-center gap-3">
            <Badge className={cn('capitalize', getStatusColor(task.status))}>
              {task.status}
            </Badge>
            <div className={cn('flex items-center gap-1', getBudgetColor(task.budgetHealth))}>
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium capitalize">{task.budgetHealth} Budget</span>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(task.startDate), 'MMM d, yyyy')} - {format(new Date(task.endDate), 'MMM d, yyyy')}
            </span>
          </div>

          {/* Order of Operations Warning */}
          {hasOrderWarning && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-400">Order of Operations Warning</p>
                <p className="text-xs text-amber-400/80 mt-1">
                  This task has incomplete prerequisites. Complete the following first:
                </p>
                <ul className="mt-2 space-y-1">
                  {dependencies.filter(d => d.status !== 'complete').map(dep => (
                    <li key={dep.id} className="text-xs text-amber-300">
                      • {dep.title}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Dependencies */}
          {dependencies.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Prerequisites
              </h4>
              <div className="space-y-1">
                {dependencies.map(dep => (
                  <div 
                    key={dep.id}
                    className="flex items-center gap-2 text-sm bg-slate-800 rounded px-3 py-2"
                  >
                    {dep.status === 'complete' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-500" />
                    )}
                    <span className={dep.status === 'complete' ? 'text-slate-400' : 'text-white'}>
                      {dep.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-300">Checklist</h4>
              <span className="text-xs text-slate-500">
                {completedCount}/{task.checklist.length} complete
              </span>
            </div>
            <Progress value={progress} className="h-2 mb-3" />
            <div className="space-y-2">
              {task.checklist.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg transition-colors',
                    'hover:bg-slate-800',
                    item.completed ? 'bg-emerald-500/10' : 'bg-slate-800/50'
                  )}
                >
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-500 shrink-0" />
                  )}
                  <span className={cn(
                    'text-sm',
                    item.completed ? 'text-slate-500 line-through' : 'text-white'
                  )}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3">Attachments</h4>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Permit PDF or Photos
            </Button>
            
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-white truncate max-w-[200px]">
                        {file.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3">Notes</h4>
            <Textarea
              value={task.notes}
              onChange={(e) => updateNotes(e.target.value)}
              placeholder="Add notes about this task..."
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[100px]"
            />
          </div>

          {/* Downstream Tasks */}
          {dependents.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">
                Downstream Tasks ({dependents.length})
              </h4>
              <p className="text-xs text-slate-500 mb-2">
                These tasks will shift if this task is moved.
              </p>
              <div className="space-y-1">
                {dependents.map(dep => (
                  <div 
                    key={dep.id}
                    className="text-sm bg-slate-800 rounded px-3 py-2 text-slate-300"
                  >
                    {dep.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
