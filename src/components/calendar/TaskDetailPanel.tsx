import { useState, useRef, useEffect } from 'react';
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
  Calendar as CalendarIcon,
  Link2,
  Plus,
  Pencil,
  Save,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { CalendarTask } from '@/pages/Calendar';
import { 
  getCalendarCategories, 
  CATEGORY_GROUPS, 
  getGroupedCategories, 
  getCategoryLabel,
  getCategoryStyles,
  getCategoryGroup,
} from '@/lib/calendarCategories';

interface TaskDetailPanelProps {
  task: CalendarTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdate: (task: CalendarTask) => void;
  onTaskDelete?: (taskId: string) => void;
  allTasks: CalendarTask[];
}

export function TaskDetailPanel({ task, open, onOpenChange, onTaskUpdate, onTaskDelete, allTasks }: TaskDetailPanelProps) {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Editable state
  const [editedTitle, setEditedTitle] = useState('');
  const [editedCategory, setEditedCategory] = useState('');
  const [editedStartDate, setEditedStartDate] = useState<Date | undefined>();
  const [editedEndDate, setEditedEndDate] = useState<Date | undefined>();
  const [editedNotes, setEditedNotes] = useState('');
  const [editedChecklist, setEditedChecklist] = useState<{ id: string; label: string; completed: boolean }[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const groupedCategories = getGroupedCategories();

  // Initialize editable state when task changes
  useEffect(() => {
    if (task) {
      setEditedTitle(task.title);
      setEditedCategory(task.eventCategory || 'due_diligence');
      setEditedStartDate(new Date(task.startDate));
      setEditedEndDate(new Date(task.endDate));
      setEditedNotes(task.notes || '');
      setEditedChecklist([...task.checklist]);
      setHasChanges(false);
    }
  }, [task]);

  if (!task) return null;

  const completedCount = editedChecklist.filter(c => c.completed).length;
  const progress = editedChecklist.length > 0 ? (completedCount / editedChecklist.length) * 100 : 0;

  const markAsChanged = () => {
    if (!hasChanges) setHasChanges(true);
  };

  const handleTitleChange = (newTitle: string) => {
    setEditedTitle(newTitle);
    markAsChanged();
  };

  const handleCategoryChange = (newCategory: string) => {
    setEditedCategory(newCategory);
    markAsChanged();
  };

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setEditedStartDate(date);
      // Auto-update end date if start date is after end date
      if (editedEndDate && date > editedEndDate) {
        setEditedEndDate(date);
      }
      markAsChanged();
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      setEditedEndDate(date);
      // Auto-update start date if end date is before start date
      if (editedStartDate && date < editedStartDate) {
        setEditedStartDate(date);
      }
      markAsChanged();
    }
  };

  const handleNotesChange = (notes: string) => {
    setEditedNotes(notes);
    markAsChanged();
  };

  const toggleChecklistItem = (itemId: string) => {
    const updated = editedChecklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setEditedChecklist(updated);
    markAsChanged();
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newItem = {
      id: `item-${Date.now()}`,
      label: newChecklistItem.trim(),
      completed: false,
    };
    setEditedChecklist([...editedChecklist, newItem]);
    setNewChecklistItem('');
    markAsChanged();
  };

  const deleteChecklistItem = (itemId: string) => {
    setEditedChecklist(editedChecklist.filter(item => item.id !== itemId));
    markAsChanged();
  };

  const handleSave = async () => {
    if (!editedStartDate || !editedEndDate) return;
    
    setSaving(true);

    const { error } = await supabase
      .from('calendar_events')
      .update({
        title: editedTitle,
        event_category: editedCategory,
        start_date: format(editedStartDate, 'yyyy-MM-dd'),
        end_date: format(editedEndDate, 'yyyy-MM-dd'),
        notes: editedNotes || null,
        checklist: editedChecklist,
      })
      .eq('id', task.id);

    setSaving(false);

    if (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    } else {
      // Update local state
      const updatedTask: CalendarTask = {
        ...task,
        title: editedTitle,
        eventCategory: editedCategory,
        category: editedCategory,
        startDate: editedStartDate,
        endDate: editedEndDate,
        notes: editedNotes,
        checklist: editedChecklist,
        status: getStatusFromCategory(editedCategory),
      };
      onTaskUpdate(updatedTask);
      setHasChanges(false);
      toast({
        title: 'Changes saved',
        description: 'Event updated successfully',
      });
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', task.id);

    setDeleting(false);

    if (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Event deleted',
        description: `"${task.title}" has been removed`,
      });
      onOpenChange(false);
      onTaskDelete?.(task.id);
    }
  };

  const getStatusFromCategory = (category: string): CalendarTask['status'] => {
    const group = getCategoryGroup(category);
    switch (group) {
      case 'acquisition_admin': return 'permitting';
      case 'structural_exterior': return 'demo';
      case 'rough_ins': return 'rough-in';
      case 'inspections': return 'permitting';
      case 'interior_finishes': return 'finish';
      case 'milestones': return 'complete';
      default: return 'rough-in';
    }
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

  const getDependencies = () => {
    if (!task.dependsOn) return [];
    return task.dependsOn
      .map(id => allTasks.find(t => t.id === id))
      .filter(Boolean) as CalendarTask[];
  };

  const getDependents = () => {
    return allTasks.filter(t => t.dependsOn?.includes(task.id));
  };

  const categoryStyles = getCategoryStyles(editedCategory);

  const dependencies = getDependencies();
  const dependents = getDependents();
  const hasOrderWarning = dependencies.some(dep => dep.status !== 'complete');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-slate-900 border-slate-800 overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-slate-800">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {/* Editable Title */}
              <Input
                value={editedTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-xl font-semibold bg-transparent border-transparent hover:border-slate-700 focus:border-emerald-500 text-white px-0 h-auto py-1"
                placeholder="Event title..."
              />
              <p className="text-sm text-slate-400 mt-1">{task.projectName}</p>
            </div>
            {/* Delete Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-900 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Delete Event</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    Are you sure you want to delete "{task.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Category Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">Category</label>
            <Select value={editedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className={cn(
                "bg-slate-800 border-slate-700 text-white",
                `${categoryStyles.borderClass} border-2`
              )}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 max-h-[300px]">
                {(Object.entries(groupedCategories) as [keyof typeof CATEGORY_GROUPS, typeof groupedCategories[keyof typeof groupedCategories]][]).map(([groupKey, categories]) => (
                  <SelectGroup key={groupKey}>
                    <SelectLabel className={cn(
                      "text-xs font-semibold py-2",
                      CATEGORY_GROUPS[groupKey].textClass
                    )}>
                      {CATEGORY_GROUPS[groupKey].label}
                    </SelectLabel>
                    {categories.map((cat) => (
                      <SelectItem 
                        key={cat.value} 
                        value={cat.value} 
                        className="text-white cursor-pointer focus:bg-slate-700"
                      >
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Editable Date Range */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">Date Range</label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 justify-start text-left bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
                    {editedStartDate ? format(editedStartDate, 'MMM d, yyyy') : 'Start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                  <Calendar
                    mode="single"
                    selected={editedStartDate}
                    onSelect={handleStartDateChange}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <span className="text-slate-500">→</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 justify-start text-left bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
                    {editedEndDate ? format(editedEndDate, 'MMM d, yyyy') : 'End date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                  <Calendar
                    mode="single"
                    selected={editedEndDate}
                    onSelect={handleEndDateChange}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Budget Health Display */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50">
            <DollarSign className={cn('h-4 w-4', 
              task.budgetHealth === 'green' ? 'text-emerald-400' :
              task.budgetHealth === 'yellow' ? 'text-amber-400' : 'text-red-400'
            )} />
            <span className={cn('text-sm font-medium capitalize',
              task.budgetHealth === 'green' ? 'text-emerald-400' :
              task.budgetHealth === 'yellow' ? 'text-amber-400' : 'text-red-400'
            )}>
              {task.budgetHealth} Budget
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

          {/* Editable Checklist */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-300">Checklist</h4>
              <span className="text-xs text-slate-500">
                {completedCount}/{editedChecklist.length} complete
              </span>
            </div>
            <Progress value={progress} className="h-2 mb-3" />
            
            {/* Add new checklist item */}
            <div className="flex items-center gap-2 mb-3">
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                placeholder="Add a task..."
                className="flex-1 bg-slate-800 border-slate-700 text-white text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={addChecklistItem}
                disabled={!newChecklistItem.trim()}
                className="h-9 w-9 border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Checklist items */}
            <div className="space-y-2">
              {editedChecklist.map(item => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group',
                    item.completed ? 'bg-emerald-500/10' : 'bg-slate-800/50'
                  )}
                >
                  <button
                    onClick={() => toggleChecklistItem(item.id)}
                    className="shrink-0"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-500 hover:text-emerald-500" />
                    )}
                  </button>
                  <span className={cn(
                    'flex-1 text-sm',
                    item.completed ? 'text-slate-500 line-through' : 'text-white'
                  )}>
                    {item.label}
                  </span>
                  <button
                    onClick={() => deleteChecklistItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {editedChecklist.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No tasks yet. Add one above!
                </p>
              )}
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
              value={editedNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Add notes: HVAC serial numbers, foundation depth, contractor names..."
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

          {/* Save Changes Button */}
          {hasChanges && (
            <div className="sticky bottom-0 pt-4 pb-2 bg-slate-900 border-t border-slate-800 -mx-6 px-6">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
