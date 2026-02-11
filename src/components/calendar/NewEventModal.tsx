import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, AlertTriangle, Zap, CalendarRange, Check, ChevronsUpDown } from 'lucide-react';
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
  const [leadTimeDays, setLeadTimeDays] = useState('0');
  const [expectedDate, setExpectedDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  // Filter categories based on search
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

  // Group the filtered categories
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
    setLeadTimeDays('0');
    setExpectedDate(undefined);
    setNotes('');
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    // Auto-sync end date when not in multi-day mode OR when start date is after end date
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

    const { error } = await supabase.from('calendar_events').insert({
      user_id: userData.user.id,
      project_id: projectId,
      title,
      event_category: category,
      trade: null, // No longer using trade field
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
      is_critical_path: isCriticalPath,
      lead_time_days: parseInt(leadTimeDays) || 0,
      expected_date: expectedDate ? format(expectedDate, 'yyyy-MM-dd') : null,
      notes: notes || null,
    });

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
        description: `"${title}" has been added to the calendar`,
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
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          Add Project Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">New Project Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Selector */}
          <div className="space-y-2">
            <Label className="text-slate-300">Project *</Label>
            <ProjectAutocomplete
              projects={projects}
              value={projectId}
              onSelect={setProjectId}
              placeholder="Search projects..."
              triggerClassName="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            />
          </div>

          {/* Category - Searchable selector */}
          <div className="space-y-2">
            <Label className="text-slate-300">Category *</Label>
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={categoryOpen}
                  className={cn(
                    "w-full justify-between bg-slate-800 border-slate-700 text-white hover:bg-slate-700",
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
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-slate-800 border-slate-700" align="start">
                <Command shouldFilter={false} className="bg-slate-800">
                  <CommandInput
                    placeholder="Type to search categories..."
                    value={categorySearch}
                    onValueChange={setCategorySearch}
                    className="text-white"
                  />
                  <div style={{ overflowY: 'scroll', maxHeight: 300, overscrollBehavior: 'contain' }}>
                  <CommandList className="overflow-visible [&_[cmdk-list-sizer]]:overflow-visible">
                    <CommandEmpty className="text-slate-400 py-6 text-center text-sm">
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
                            className="text-white cursor-pointer aria-selected:bg-slate-700"
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
            <Label className="text-slate-300">Event Title *</Label>
            <div className="flex gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Foundation Inspection"
                className="bg-slate-800 border-slate-700 text-white flex-1"
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
                  "border-slate-700 shrink-0",
                  category 
                    ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500/30" 
                    : "text-slate-500"
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
              <Label className="text-slate-300">Date *</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="multiDay"
                  checked={isMultiDay}
                  onCheckedChange={(checked) => {
                    setIsMultiDay(checked === true);
                    // Sync end date to start date when disabling multi-day
                    if (!checked && startDate) {
                      setEndDate(startDate);
                    }
                  }}
                  className="border-slate-500 data-[state=checked]:bg-slate-600"
                />
                <label
                  htmlFor="multiDay"
                  className="text-xs text-slate-400 cursor-pointer flex items-center gap-1"
                >
                  <CalendarRange className="h-3 w-3" />
                  Multi-day event
                </label>
              </div>
            </div>

            {isMultiDay ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal bg-slate-800 border-slate-700',
                          !startDate && 'text-muted-foreground'
                        )}
                      >
                        {startDate ? format(startDate, 'MMM d, yyyy') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
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
                  <Label className="text-slate-400 text-xs">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal bg-slate-800 border-slate-700',
                          !endDate && 'text-muted-foreground'
                        )}
                      >
                        {endDate ? format(endDate, 'MMM d, yyyy') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
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
                      'w-full justify-start text-left font-normal bg-slate-800 border-slate-700',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    {startDate ? format(startDate, 'MMM d, yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
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

          {/* Lead Time (for tracking delays) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Lead Time (days)</Label>
              <Input
                type="number"
                min="0"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
                placeholder="0"
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500">e.g., City inspection delay</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Expected Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-slate-800 border-slate-700',
                      !expectedDate && 'text-muted-foreground'
                    )}
                  >
                    {expectedDate ? format(expectedDate, 'MMM d, yyyy') : 'Optional'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                  <Calendar
                    mode="single"
                    selected={expectedDate}
                    onSelect={setExpectedDate}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Critical Path Checkbox */}
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <Checkbox
              id="criticalPath"
              checked={isCriticalPath}
              onCheckedChange={(checked) => setIsCriticalPath(checked === true)}
              className="border-amber-500 data-[state=checked]:bg-amber-500"
            />
            <div className="flex-1">
              <label
                htmlFor="criticalPath"
                className="text-sm font-medium text-slate-200 cursor-pointer flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Critical Path
              </label>
              <p className="text-xs text-slate-500">
                Highlight this event in red on the calendar
              </p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-slate-300">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="DFW-specific details: HVAC serial numbers, foundation depth, contractor names..."
              className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
