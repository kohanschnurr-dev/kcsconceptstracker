import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameDay, isSameMonth, isToday, addMonths, subMonths,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CRM_EVENT_TYPE_CONFIG } from '@/types/crm';
import type { CRMCalendarEvent, CRMEventType, CRMEventStatus, CRMContact } from '@/types/crm';
import { useAuth } from '@/contexts/AuthContext';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface EventFormProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  date: Date | null;
  contacts: CRMContact[];
  onSave: (e: Omit<CRMCalendarEvent, 'id' | 'created_at' | 'updated_at' | 'contact_name'>) => void;
  userId: string;
}

function EventForm({ open, onOpenChange, date, contacts, onSave, userId }: EventFormProps) {
  const [form, setForm] = useState({
    title: '',
    contact_id: '',
    event_type: 'follow_up_call' as CRMEventType,
    event_date: date ? format(date, "yyyy-MM-dd'T'HH:mm") : '',
    duration_minutes: 30 as number | null,
    notes: '',
    reminder: 'none',
    status: 'scheduled' as CRMEventStatus,
  });

  const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));

  const handleSave = () => {
    if (!form.title || !form.contact_id || !form.event_date) return;
    onSave({
      user_id: userId,
      contact_id: form.contact_id,
      title: form.title,
      event_type: form.event_type,
      event_date: new Date(form.event_date).toISOString(),
      duration_minutes: form.duration_minutes,
      notes: form.notes || null,
      reminder: form.reminder === 'none' ? null : form.reminder,
      status: form.status,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Schedule CRM Event</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input className="mt-1" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Follow-up call with John" />
          </div>
          <div>
            <Label>Contact <span className="text-destructive">*</span></Label>
            <Select value={form.contact_id} onValueChange={v => set('contact_id', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select contact" /></SelectTrigger>
              <SelectContent>
                {contacts.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Event Type</Label>
              <Select value={form.event_type} onValueChange={v => set('event_type', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CRM_EVENT_TYPE_CONFIG).map(([v, c]) => (
                    <SelectItem key={v} value={v}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration</Label>
              <Select value={String(form.duration_minutes)} onValueChange={v => set('duration_minutes', v === 'null' ? null : parseInt(v))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 hr</SelectItem>
                  <SelectItem value="120">2 hr</SelectItem>
                  <SelectItem value="null">All Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Date & Time <span className="text-destructive">*</span></Label>
            <Input className="mt-1" type="datetime-local" value={form.event_date} onChange={e => set('event_date', e.target.value)} />
          </div>
          <div>
            <Label>Reminder</Label>
            <Select value={form.reminder} onValueChange={v => set('reminder', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="15m">15 min before</SelectItem>
                <SelectItem value="30m">30 min before</SelectItem>
                <SelectItem value="1h">1 hr before</SelectItem>
                <SelectItem value="1d">1 day before</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea className="mt-1" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.title || !form.contact_id || !form.event_date}>Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CRMCalendarViewProps {
  events: CRMCalendarEvent[];
  contacts: CRMContact[];
  onCreateEvent: (e: Omit<CRMCalendarEvent, 'id' | 'created_at' | 'updated_at' | 'contact_name'>) => void;
  onUpdateEvent: (id: string, updates: Partial<CRMCalendarEvent>) => void;
}

export function CRMCalendarView({ events, contacts, onCreateEvent, onUpdateEvent }: CRMCalendarViewProps) {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CRMCalendarEvent | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, CRMCalendarEvent[]> = {};
    events.forEach(e => {
      const key = format(new Date(e.event_date), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* CRM Calendar label */}
      <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5">
        <span className="text-xs font-medium text-primary">CRM Follow-Up Calendar</span>
        <span className="text-xs text-muted-foreground">· Independent from the main project Calendar</span>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => { setSelectedDate(new Date()); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Event
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(CRM_EVENT_TYPE_CONFIG).map(([, cfg]) => (
          <div key={cfg.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
            {cfg.label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {DOW.map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDay[key] ?? [];
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);

            return (
              <div
                key={i}
                onClick={() => handleDayClick(day)}
                className={cn(
                  'min-h-[80px] p-1.5 border-b border-r border-border cursor-pointer hover:bg-muted/20 transition-colors',
                  !inMonth && 'opacity-40',
                  today && 'bg-primary/5',
                )}
              >
                <span className={cn(
                  'text-xs font-medium mb-1 h-5 w-5 flex items-center justify-center rounded-full',
                  today && 'bg-primary text-primary-foreground',
                )}>
                  {format(day, 'd')}
                </span>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map(e => (
                    <div
                      key={e.id}
                      onClick={ev => { ev.stopPropagation(); setSelectedEvent(e); }}
                      className="truncate text-[10px] rounded px-1 py-0.5 font-medium cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: CRM_EVENT_TYPE_CONFIG[e.event_type]?.color + '33', color: CRM_EVENT_TYPE_CONFIG[e.event_type]?.color }}
                    >
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event detail popover */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <DialogTitle className="pr-4">{selectedEvent.title}</DialogTitle>
              </div>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CRM_EVENT_TYPE_CONFIG[selectedEvent.event_type]?.color }}
                />
                <span className="text-muted-foreground">{CRM_EVENT_TYPE_CONFIG[selectedEvent.event_type]?.label}</span>
              </div>
              <p><span className="text-muted-foreground">Contact: </span>{selectedEvent.contact_name ?? '—'}</p>
              <p><span className="text-muted-foreground">Date: </span>
                {new Date(selectedEvent.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
              {selectedEvent.notes && <p className="text-muted-foreground">{selectedEvent.notes}</p>}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-muted-foreground">Status:</span>
                <Select
                  value={selectedEvent.status}
                  onValueChange={v => { onUpdateEvent(selectedEvent.id, { status: v as CRMEventStatus }); setSelectedEvent(null); }}
                >
                  <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                    <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <EventForm
        open={formOpen}
        onOpenChange={setFormOpen}
        date={selectedDate}
        contacts={contacts}
        onSave={onCreateEvent}
        userId={user?.id ?? ''}
      />
    </div>
  );
}
