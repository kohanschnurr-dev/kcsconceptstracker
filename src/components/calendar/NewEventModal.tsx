import { useState, useMemo, useEffect } from 'react';
import { format, addMonths, addYears, differenceInCalendarDays } from 'date-fns';
import { Plus, AlertTriangle, Zap, CalendarRange, Check, ChevronsUpDown, Repeat, Circle, X, Calendar as CalendarIcon } from 'lucide-react';
import { ProjectAutocomplete } from '@/components/ProjectAutocomplete';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  CATEGORY_GROUPS,
  getCalendarCategories,
  getCategoryStyles,
  getCategoryLabel,
  getCategoryGroup,
  CATEGORY_CHECKLIST_PRESETS,
  type CategoryGroup,
  type CalendarCategory,
} from '@/lib/calendarCategories';
import type { CalendarTask } from '@/pages/Calendar';

interface Project {
  id: string;
  name: string;
  address: string;
}

interface NewEventModalProps {
  projects: Project[];
  onEventCreated: () => void;
  defaultProjectId?: string;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  defaultStartDate?: Date;
  defaultTitle?: string;
  linkedTaskId?: string;
  allTasks?: CalendarTask[];
}

export function NewEventModal({ projects, onEventCreated, defaultProjectId, externalOpen, onExternalOpenChange, defaultStartDate, defaultTitle, linkedTaskId, allTasks = [] }: NewEventModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (isControlled) {
      onExternalOpenChange?.(v);
    } else {
      setInternalOpen(v);
    }
  };

  useEffect(() => {
    if (externalOpen) {
      if (defaultStartDate) {
        setStartDate(defaultStartDate);
        setEndDate(defaultStartDate);
      }
      if (defaultTitle) {
        setTitle(defaultTitle);
      }
      if (defaultProjectId) {
        setProjectId(defaultProjectId);
      }
    }
  }, [externalOpen, defaultStartDate, defaultTitle, defaultProjectId]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [isCriticalPath, setIsCriticalPath] = useState(false);
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState<{ id: string; label: string; completed: boolean }[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [recurrenceUntilType, setRecurrenceUntilType] = useState<'indefinite' | 'date'>('indefinite');
  const [recurrenceUntilDate, setRecurrenceUntilDate] = useState<Date | undefined>();
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [recurringPopoverOpen, setRecurringPopoverOpen] = useState(false);
  const [dependencies, setDependencies] = useState<{ taskId: string; type: 'FS' | 'SS' | 'FF' | 'SF' }[]>([]);
  const [depTaskId, setDepTaskId] = useState('');
  const [depType, setDepType] = useState<'FS' | 'SS' | 'FF' | 'SF'>('FS');

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) {
      return getCalendarCategories();
    }
    const query = categorySearch.toLowerCase().trim();
    return getCalendarCategories().filter(cat =>
      cat.label?.toLowerCase().includes(query) ||
      cat.groupLabel?.toLowerCase().includes(query)
    );
  }, [categorySearch]);

  const filteredGrouped = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => {
      if (!acc[cat.group]) acc[cat.group] = [];
      acc[cat.group].push(cat);
      return acc;
    }, {} as Record<CategoryGroup, CalendarCategory[]>);
  }, [filteredCategories]);

  const sameProjectTasks = useMemo(() => {
    if (!projectId || !allTasks.length) return [];
    return allTasks.filter(t => t.projectId === projectId && !dependencies.find(d => d.taskId === t.id));
  }, [allTasks, projectId, dependencies]);

  const resetForm = () => {
    setTitle('');
    setProjectId(defaultProjectId || '');
    setCategory('');
    setStartDate(new Date());
    setEndDate(new Date());
    setIsMultiDay(false);
    setIsCriticalPath(false);
    setNotes('');
    setChecklist([]);
    setNewChecklistItem('');
    setIsRecurring(false);
    setRecurrenceFrequency('monthly');
    setRecurrenceUntilType('indefinite');
    setRecurrenceUntilDate(undefined);
    setDependencies([]);
    setDepTaskId('');
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    if (date) {
      if (!isMultiDay || (endDate && date > endDate)) {
        setEndDate(date);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId || !title || !category || !startDate || !endDate) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast({
        title: 'Not authenticated',
        description: 'Please sign in to create events',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const baseEvent = {
      user_id: userData.user.id,
      project_id: projectId,
      title,
      event_category: category,
      trade: null as string | null,
      is_critical_path: isCriticalPath,
      notes: notes || null,
      checklist: checklist.length > 0 ? checklist : null,
      linked_task_id: linkedTaskId || null,
      dependencies: dependencies.length > 0 ? dependencies : null,
    };

    let eventsToInsert: any[] = [];

    if (isRecurring) {
      const groupId = crypto.randomUUID();
      const durationDays = isMultiDay && endDate ? differenceInCalendarDays(endDate, startDate) : 0;
      
      const maxOccurrences = recurrenceFrequency === 'monthly' ? 24 : recurrenceFrequency === 'quarterly' ? 8 : 5;
      const maxEndDate = recurrenceFrequency === 'yearly' 
        ? addYears(startDate, 5) 
        : addYears(startDate, 2);
      const untilDate = recurrenceUntilType === 'date' && recurrenceUntilDate 
        ? recurrenceUntilDate 
        : maxEndDate;

      let current = new Date(startDate);
      for (let i = 0; i < maxOccurrences; i++) {
        if (current > untilDate) break;
        const occurrenceEnd = new Date(current);
        if (durationDays > 0) occurrenceEnd.setDate(occurrenceEnd.getDate() + durationDays);
        
        eventsToInsert.push({
          ...baseEvent,
          start_date: format(current, 'yyyy-MM-dd'),
          end_date: format(occurrenceEnd, 'yyyy-MM-dd'),
          recurrence_rule: recurrenceFrequency,
          recurrence_group_id: groupId,
          recurrence_until: recurrenceUntilType === 'date' && recurrenceUntilDate 
            ? format(recurrenceUntilDate, 'yyyy-MM-dd') 
            : null,
        });

        if (recurrenceFrequency === 'monthly') current = addMonths(startDate, i + 1);
        else if (recurrenceFrequency === 'quarterly') current = addMonths(startDate, (i + 1) * 3);
        else current = addYears(startDate, i + 1);
      }
    } else {
      eventsToInsert.push({
        ...baseEvent,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });
    }

    const { error } = await supabase.from('calendar_events').insert(eventsToInsert as any);

    setLoading(false);

    if (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to create event',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Event created',
        description: eventsToInsert.length > 1 
          ? `${eventsToInsert.length} recurring "${title}" events added to the calendar`
          : `"${title}" has been added to the calendar`,
      });
      resetForm();
      setOpen(false);
      onEventCreated();
    }
  };

  const selectedCategoryStyles = category ? getCategoryStyles(category) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 sm:mr-0" />
            <span className="hidden sm:inline">Add Project Event</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">New Project Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Selector */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Project *</Label>
            <ProjectAutocomplete
              projects={projects}
              value={projectId}
              onSelect={setProjectId}
              placeholder="Search"
              triggerClassName="bg-card border-border text-foreground hover:bg-secondary"
            />
          </div>

          {/* Category - Searchable selector */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Category *</Label>
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={categoryOpen}
                  className={cn(
                    "w-full justify-between bg-card border-border text-foreground hover:bg-secondary",
                    selectedCategoryStyles && `${selectedCategoryStyles.borderClass} border-2`,
                    !category && "text-muted-foreground"
                  )}
                >
                  {category ? (
                    <div className="flex items-center gap-2">
                      <span 
                        className={cn("w-2 h-2 rounded-full", selectedCategoryStyles?.swatchClass)}
                      />
                      {getCategoryLabel(category)}
                    </div>
                  ) : (
                    "Select category..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-card border-border" align="start">
                <Command shouldFilter={false} className="bg-card">
                  <CommandInput
                    placeholder="Type to search categories..."
                    value={categorySearch}
                    onValueChange={setCategorySearch}
                    className="text-foreground"
                  />
                  <div style={{ overflowY: 'auto', maxHeight: 300, overscrollBehavior: 'contain' }} onWheel={(e) => e.stopPropagation()}>
                  <CommandList className="overflow-visible [&_[cmdk-list-sizer]]:overflow-visible">
                    <CommandEmpty className="text-muted-foreground py-6 text-center text-sm">
                      No categories found
                    </CommandEmpty>
                    {(Object.keys(CATEGORY_GROUPS) as CategoryGroup[]).filter(g => filteredGrouped[g]?.length).map((groupKey) => { const cats = filteredGrouped[groupKey]; return (
                      <CommandGroup 
                        key={groupKey} 
                         heading={
                          <span className={cn("text-xs font-bold tracking-wide uppercase", CATEGORY_GROUPS[groupKey].textClass)}>
                            {CATEGORY_GROUPS[groupKey].label}
                          </span>
                        }
                      >
                        {cats.map((cat) => (
                          <CommandItem
                            key={cat.value}
                            value={cat.value}
                            onSelect={() => {
                              setCategory(cat.value);
                              setCategoryOpen(false);
                              setCategorySearch('');
                            }}
                            className="text-foreground cursor-pointer aria-selected:bg-secondary"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                category === cat.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span 
                              className={cn("w-2 h-2 rounded-full mr-2", CATEGORY_GROUPS[groupKey].swatchClass)}
                            />
                            {cat.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ); })}
                  </CommandList>
                  </div>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedCategoryStyles && (
              <p className={cn("text-xs", selectedCategoryStyles.textClass)}>
                {CATEGORY_GROUPS[Object.entries(CATEGORY_GROUPS).find(([_, v]) => v === selectedCategoryStyles)?.[0] as CategoryGroup]?.label || 'Category'}
              </p>
            )}
            {category && getCategoryGroup(category) === 'milestones' && (
              <p className="text-xs text-amber-500/70">
                Milestones use noun-first naming: e.g., "Listing Date", "Project Close"
              </p>
            )}
          </div>

          {/* Event Title */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Event Title *</Label>
            <div className="flex gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Install Drywall"
                className="bg-card border-border text-foreground flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  if (category) {
                    setTitle(getCategoryLabel(category));
                  }
                }}
                disabled={!category}
                className={cn(
                  "border-border shrink-0",
                  category
                    ? "text-primary hover:text-primary/90 hover:bg-primary/10 hover:border-primary/30"
                    : "text-muted-foreground"
                )}
                title={category ? `Fill with "${getCategoryLabel(category)}"` : "Select a category first"}
              >
                <Zap className="h-4 w-4" />
              </Button>
            </div>
            {getCategoryGroup(category || '') !== 'milestones' && (
              <p className="text-xs text-muted-foreground/70">
                Tasks should be action-first: Verb + Noun (e.g., "Install Drywall", "Pour Foundation")
              </p>
            )}
          </div>

          {/* Compact 3-pill row: Date · Recurring · Critical */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Schedule *</Label>
            <div className="grid grid-cols-3 gap-2">
              {/* Date pill */}
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="border border-border bg-card hover:bg-secondary px-3 py-2.5 text-left transition-colors min-w-0"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                      <CalendarIcon className="h-3 w-3" /> Date
                    </div>
                    <div className="text-sm text-foreground mt-0.5 truncate font-medium">
                      {startDate
                        ? isMultiDay && endDate
                          ? `${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d')}`
                          : format(startDate, 'MMM d, yyyy')
                        : 'Pick date'}
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3 bg-card border-border space-y-3" align="start">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="multiDay"
                      checked={isMultiDay}
                      onCheckedChange={(checked) => {
                        setIsMultiDay(checked === true);
                        if (!checked && startDate) setEndDate(startDate);
                      }}
                      className="border-muted-foreground data-[state=checked]:bg-muted-foreground"
                    />
                    <label htmlFor="multiDay" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                      <CalendarRange className="h-3 w-3" />
                      Multi-day event
                    </label>
                  </div>
                  {isMultiDay ? (
                    <Calendar
                      mode="range"
                      selected={{ from: startDate, to: endDate }}
                      onSelect={(range: any) => {
                        if (range?.from) handleStartDateChange(range.from);
                        setEndDate(range?.to ?? range?.from);
                      }}
                      numberOfMonths={1}
                      className="pointer-events-auto"
                    />
                  ) : (
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={handleStartDateChange}
                      className="pointer-events-auto"
                    />
                  )}
                </PopoverContent>
              </Popover>

              {/* Recurring pill */}
              <Popover open={recurringPopoverOpen} onOpenChange={setRecurringPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => {
                      if (isRecurring) {
                        e.preventDefault();
                        setIsRecurring(false);
                        setRecurringPopoverOpen(false);
                      } else {
                        setIsRecurring(true);
                      }
                    }}
                    className={cn(
                      'border px-3 py-2.5 text-left transition-colors min-w-0',
                      isRecurring
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:bg-secondary'
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                      <Repeat className={cn('h-3 w-3', isRecurring && 'text-primary')} /> Recurring
                    </div>
                    <div className={cn('text-sm mt-0.5 truncate font-medium capitalize', isRecurring ? 'text-primary' : 'text-foreground')}>
                      {isRecurring ? recurrenceFrequency : 'Off'}
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3 bg-card border-border space-y-3" align="start">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs">Frequency</Label>
                      <select
                        value={recurrenceFrequency}
                        onChange={(e) => setRecurrenceFrequency(e.target.value as any)}
                        className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs">Until when?</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={recurrenceUntilType === 'indefinite' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setRecurrenceUntilType('indefinite')}
                          className="flex-1"
                        >
                          Indefinitely
                        </Button>
                        <Button
                          type="button"
                          variant={recurrenceUntilType === 'date' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setRecurrenceUntilType('date')}
                          className="flex-1"
                        >
                          Until date
                        </Button>
                      </div>
                      {recurrenceUntilType === 'date' && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal bg-card border-border',
                                !recurrenceUntilDate && 'text-muted-foreground'
                              )}
                            >
                              {recurrenceUntilDate ? format(recurrenceUntilDate, 'MMM d, yyyy') : 'Pick end date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-card border-border">
                            <Calendar
                              mode="single"
                              selected={recurrenceUntilDate}
                              onSelect={setRecurrenceUntilDate}
                              disabled={(date) => (startDate ? date < startDate : false)}
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {recurrenceUntilType === 'indefinite'
                          ? `Up to ${recurrenceFrequency === 'monthly' ? '24' : recurrenceFrequency === 'quarterly' ? '8' : '5'} events (${recurrenceFrequency === 'yearly' ? '5' : '2'} years)`
                          : recurrenceUntilDate
                            ? `From ${startDate ? format(startDate, 'MMM d, yyyy') : '...'} to ${format(recurrenceUntilDate, 'MMM d, yyyy')}`
                            : 'Select an end date'}
                      </p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Critical Path pill */}
              <button
                type="button"
                onClick={() => setIsCriticalPath((v) => !v)}
                className={cn(
                  'border px-3 py-2.5 text-left transition-colors min-w-0',
                  isCriticalPath
                    ? 'border-amber-500 bg-amber-500/5'
                    : 'border-border bg-card hover:bg-secondary'
                )}
                title="Highlight this event in red on the calendar"
              >
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <AlertTriangle className={cn('h-3 w-3', isCriticalPath && 'text-amber-500')} /> Critical
                </div>
                <div className={cn('text-sm mt-0.5 truncate font-medium', isCriticalPath ? 'text-amber-500' : 'text-foreground')}>
                  {isCriticalPath ? 'On' : 'Off'}
                </div>
              </button>
            </div>
          </div>

          {/* 30-day scope warning */}
          {isMultiDay && startDate && endDate && differenceInCalendarDays(endDate, startDate) > 30 && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>
                This task spans {differenceInCalendarDays(endDate, startDate)} days. Consider breaking it into smaller sub-tasks.
              </span>
            </div>
          )}

          {/* Dependencies */}
          {(sameProjectTasks.length > 0 || dependencies.length > 0) && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Dependencies</Label>
              {dependencies.length > 0 && (
                <div className="space-y-1">
                  {dependencies.map((dep) => {
                    const depTask = allTasks.find(t => t.id === dep.taskId);
                    return (
                      <div key={dep.taskId} className="flex items-center gap-2 px-2 py-1.5 rounded bg-card/50 group">
                        <span className="flex-1 text-sm text-foreground truncate">{depTask?.title || dep.taskId}</span>
                        <span className="text-xs text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded font-mono">{dep.type}</span>
                        <button
                          type="button"
                          onClick={() => setDependencies(prev => prev.filter(d => d.taskId !== dep.taskId))}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {sameProjectTasks.length > 0 && (
                <div className="flex gap-2">
                  <select
                    value={depTaskId}
                    onChange={(e) => setDepTaskId(e.target.value)}
                    className="flex-1 min-w-0 rounded-md border border-border bg-card text-foreground px-2 py-1.5 text-sm"
                  >
                    <option value="">Add predecessor...</option>
                    {sameProjectTasks.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                  <select
                    value={depType}
                    onChange={(e) => setDepType(e.target.value as 'FS' | 'SS' | 'FF' | 'SF')}
                    className="rounded-md border border-border bg-card text-foreground px-2 py-1.5 text-sm"
                  >
                    <option value="FS">FS</option>
                    <option value="SS">SS</option>
                    <option value="FF">FF</option>
                    <option value="SF">SF</option>
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={!depTaskId}
                    onClick={() => {
                      if (!depTaskId) return;
                      setDependencies(prev => [...prev, { taskId: depTaskId, type: depType }]);
                      setDepTaskId('');
                    }}
                    className="h-9 w-9 shrink-0 border-border text-muted-foreground hover:text-primary hover:border-primary"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                FS = Finish→Start · SS = Start→Start · FF = Finish→Finish · SF = Start→Finish
              </p>
            </div>
          )}

          {/* Checklist */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Checklist</Label>
            
            {/* Quick-add preset chips */}
            {(() => {
              const presets = CATEGORY_CHECKLIST_PRESETS[category] || [];
              const existingLabels = new Set(checklist.map(i => i.label.toLowerCase()));
              const available = presets.filter(p => !existingLabels.has(p.toLowerCase()));
              if (available.length === 0 && checklist.length === 0) return (
                <p className="text-xs text-muted-foreground">
                  {category ? 'No presets for this category. Add custom items below.' : 'Select a category to see suggested tasks.'}
                </p>
              );
              return available.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {available.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setChecklist(prev => [...prev, { id: `item-${Date.now()}-${Math.random()}`, label: preset, completed: false }]);
                      }}
                      className="text-xs px-2 py-1 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              ) : null;
            })()}

            {/* Added checklist items */}
            {checklist.length > 0 && (
              <div className="space-y-1">
                {checklist.map(item => (
                  <div key={item.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-card/50 group">
                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-sm text-foreground">{item.label}</span>
                    <button
                      type="button"
                      onClick={() => setChecklist(prev => prev.filter(i => i.id !== item.id))}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Manual input */}
            <div className="flex items-center gap-2">
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newChecklistItem.trim()) {
                      setChecklist(prev => [...prev, { id: `item-${Date.now()}`, label: newChecklistItem.trim(), completed: false }]);
                      setNewChecklistItem('');
                    }
                  }
                }}
                placeholder="Add custom task..."
                className="flex-1 bg-card border-border text-foreground text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  if (newChecklistItem.trim()) {
                    setChecklist(prev => [...prev, { id: `item-${Date.now()}`, label: newChecklistItem.trim(), completed: false }]);
                    setNewChecklistItem('');
                  }
                }}
                disabled={!newChecklistItem.trim()}
                className="h-9 w-9 border-border text-muted-foreground hover:text-primary hover:border-primary"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="DFW-specific details: HVAC serial numbers, foundation depth, contractor names..."
              className="bg-card border-border text-foreground min-h-[80px]"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-border text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
