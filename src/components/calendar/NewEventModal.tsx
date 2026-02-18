import { useState, useMemo } from 'react';
import { format, addMonths, addYears, differenceInCalendarDays } from 'date-fns';
import { Plus, AlertTriangle, Zap, CalendarRange, Check, ChevronsUpDown, Repeat } from 'lucide-react';
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
  type CategoryGroup,
  type CalendarCategory,
} from '@/lib/calendarCategories';

interface Project {
  id: string;
  name: string;
  address: string;
}

interface NewEventModalProps {
  projects: Project[];
  onEventCreated: () => void;
  defaultProjectId?: string;
}

export function NewEventModal({ projects, onEventCreated, defaultProjectId }: NewEventModalProps) {
  const [open, setOpen] = useState(false);
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
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [recurrenceUntilType, setRecurrenceUntilType] = useState<'indefinite' | 'date'>('indefinite');
  const [recurrenceUntilDate, setRecurrenceUntilDate] = useState<Date | undefined>();

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) {
      return getCalendarCategories();
    }
    const query = categorySearch.toLowerCase().trim();
    return getCalendarCategories().filter(cat =>
      cat.label.toLowerCase().includes(query) ||
      cat.groupLabel.toLowerCase().includes(query)
    );
  }, [categorySearch]);

  const filteredGrouped = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => {
      if (!acc[cat.group]) acc[cat.group] = [];
      acc[cat.group].push(cat);
      return acc;
    }, {} as Record<CategoryGroup, CalendarCategory[]>);
  }, [filteredCategories]);

  const resetForm = () => {
    setTitle('');
    setProjectId(defaultProjectId || '');
    setCategory('');
    setStartDate(new Date());
    setEndDate(new Date());
    setIsMultiDay(false);
    setIsCriticalPath(false);
    setNotes('');
    setIsRecurring(false);
    setRecurrenceFrequency('monthly');
    setRecurrenceUntilType('indefinite');
    setRecurrenceUntilDate(undefined);
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
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 sm:mr-0" />
          <span className="hidden sm:inline">Add Project Event</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </DialogTrigger>
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
              placeholder="Search projects..."
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
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: selectedCategoryStyles ? `var(--${selectedCategoryStyles.color}-500, ${selectedCategoryStyles.color})` : undefined }} 
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
                    {(Object.entries(filteredGrouped) as [CategoryGroup, CalendarCategory[]][]).map(([groupKey, cats]) => (
                      <CommandGroup 
                        key={groupKey} 
                        heading={
                          <span className={cn("text-xs font-semibold", CATEGORY_GROUPS[groupKey].textClass)}>
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
                              className="w-2 h-2 rounded-full mr-2" 
                              style={{ backgroundColor: `var(--${CATEGORY_GROUPS[groupKey].color}-500, ${CATEGORY_GROUPS[groupKey].color})` }} 
                            />
                            {cat.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
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
          </div>

          {/* Event Title */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Event Title *</Label>
            <div className="flex gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Foundation Inspection"
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
          </div>

          {/* Dates */}
          <div className="space-y-3">
            {/* Multi-day toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground">Date *</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="multiDay"
                  checked={isMultiDay}
                  onCheckedChange={(checked) => {
                    setIsMultiDay(checked === true);
                    if (!checked && startDate) {
                      setEndDate(startDate);
                    }
                  }}
                  className="border-muted-foreground data-[state=checked]:bg-muted-foreground"
                />
                <label
                  htmlFor="multiDay"
                  className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1"
                >
                  <CalendarRange className="h-3 w-3" />
                  Multi-day event
                </label>
              </div>
            </div>

            {isMultiDay ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal bg-card border-border',
                          !startDate && 'text-muted-foreground'
                        )}
                      >
                        {startDate ? format(startDate, 'MMM d, yyyy') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-border">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={handleStartDateChange}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal bg-card border-border',
                          !endDate && 'text-muted-foreground'
                        )}
                      >
                        {endDate ? format(endDate, 'MMM d, yyyy') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-border">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => startDate ? date < startDate : false}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-card border-border',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    {startDate ? format(startDate, 'MMM d, yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateChange}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Recurring Event */}
          <div className="space-y-3 p-3 rounded-lg bg-card/50 border border-border">
            <div className="flex items-center justify-between">
              <label htmlFor="recurring" className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                Recurring event
              </label>
              <Switch
                id="recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>
            {isRecurring && (
              <div className="space-y-3 pt-2 border-t border-border">
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
                          disabled={(date) => startDate ? date < startDate : false}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {recurrenceUntilType === 'indefinite' 
                      ? `Will create up to ${recurrenceFrequency === 'monthly' ? '24' : recurrenceFrequency === 'quarterly' ? '8' : '5'} events (${recurrenceFrequency === 'yearly' ? '5' : '2'} years)`
                      : recurrenceUntilDate ? `Events from ${startDate ? format(startDate, 'MMM d, yyyy') : '...'} to ${format(recurrenceUntilDate, 'MMM d, yyyy')}` : 'Select an end date'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>


          {/* Critical Path Checkbox */}
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-card/50 border border-border">
            <Checkbox
              id="criticalPath"
              checked={isCriticalPath}
              onCheckedChange={(checked) => setIsCriticalPath(checked === true)}
              className="border-muted-foreground data-[state=checked]:bg-muted-foreground"
            />
            <div className="flex-1">
              <label
                htmlFor="criticalPath"
                className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Critical Path
              </label>
              <p className="text-xs text-muted-foreground">
                Highlight this event in red on the calendar
              </p>
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
