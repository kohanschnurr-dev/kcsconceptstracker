import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, AlertTriangle } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

const EVENT_CATEGORIES = [
  { value: 'inspection', label: 'Inspection' },
  { value: 'quote', label: 'Quote' },
  { value: 'trade_start', label: 'Trade Start (Demo/Plumb/Elec)' },
  { value: 'material_delivery', label: 'Material Delivery' },
  { value: 'city_inspection', label: 'City Inspection' },
];

const TRADES = [
  { value: 'demo', label: 'Demolition' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'structural', label: 'Structural/Foundation' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'drywall', label: 'Drywall' },
  { value: 'finish', label: 'Finish Work' },
  { value: 'general', label: 'General' },
];

export function NewEventModal({ projects, onEventCreated, defaultProjectId }: NewEventModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [eventCategory, setEventCategory] = useState('');
  const [trade, setTrade] = useState('general');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isCriticalPath, setIsCriticalPath] = useState(false);
  const [leadTimeDays, setLeadTimeDays] = useState('0');
  const [expectedDate, setExpectedDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setTitle('');
    setProjectId(defaultProjectId || '');
    setEventCategory('');
    setTrade('general');
    setStartDate(new Date());
    setEndDate(new Date());
    setIsCriticalPath(false);
    setLeadTimeDays('0');
    setExpectedDate(undefined);
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId || !title || !eventCategory || !startDate || !endDate) {
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
      event_category: eventCategory,
      trade,
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

  const showTradeSelector = eventCategory === 'trade_start' || eventCategory === 'inspection';

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
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id} className="text-white">
                    {project.name} - {project.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Event Title */}
          <div className="space-y-2">
            <Label className="text-slate-300">Event Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Foundation Inspection"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Event Category */}
          <div className="space-y-2">
            <Label className="text-slate-300">Event Category *</Label>
            <Select value={eventCategory} onValueChange={setEventCategory}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {EVENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-white">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trade (conditional) */}
          {showTradeSelector && (
            <div className="space-y-2">
              <Label className="text-slate-300">Trade</Label>
              <Select value={trade} onValueChange={setTrade}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select trade" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {TRADES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-white">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Start Date *</Label>
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
                    onSelect={setStartDate}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">End Date *</Label>
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
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
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
              placeholder="Additional details..."
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