import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { isToday, isThisWeek, format, parseISO, startOfDay, isSameDay } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  eventCategory: string;
  projectId: string;
}

interface CalendarGlanceWidgetProps {
  refreshKey?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  acquisition_admin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  structural_exterior: 'bg-red-500/20 text-red-400 border-red-500/30',
  rough_ins: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  inspections: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  interior_finishes: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  milestones: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export function CalendarGlanceWidget({ refreshKey }: CalendarGlanceWidgetProps) {
  const navigate = useNavigate();
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [weekEvents, setWeekEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCalendarEvents();
  }, [refreshKey]);

  // Refetch when tab becomes visible (cross-tab sync)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCalendarEvents();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchCalendarEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;

      const today = startOfDay(new Date());
      
      const transformed: CalendarEvent[] = (data || []).map((e) => ({
        id: e.id,
        title: e.title,
        startDate: e.start_date,
        endDate: e.end_date,
        eventCategory: e.event_category,
        projectId: e.project_id,
      }));

      // Filter events that include today (event spans today)
      const todaysEvents = transformed.filter((e) => {
        const start = startOfDay(parseISO(e.startDate));
        const end = startOfDay(parseISO(e.endDate));
        return today >= start && today <= end;
      });

      // Filter events this week (excluding today's)
      const thisWeekEvents = transformed.filter((e) => {
        const start = startOfDay(parseISO(e.startDate));
        const end = startOfDay(parseISO(e.endDate));
        const isEventToday = today >= start && today <= end;
        return !isEventToday && (isThisWeek(start, { weekStartsOn: 0 }) || isThisWeek(end, { weekStartsOn: 0 }));
      });

      setTodayEvents(todaysEvents);
      setWeekEvents(thisWeekEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return null;

  const hasEvents = todayEvents.length > 0 || weekEvents.length > 0;

  if (!hasEvents) return null;

  return (
    <div className="glass-card p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Week at a Glance</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/calendar')}
          className="text-xs gap-1 h-7"
        >
          View Calendar
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      {/* Today's Events */}
      {todayEvents.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
              Today
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(), 'EEEE, MMM d')}
            </span>
          </div>
          <div className="space-y-1.5">
            {todayEvents.slice(0, 4).map((event) => (
              <div
                key={event.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md border text-xs ${
                  CATEGORY_COLORS[event.eventCategory] || 'bg-muted/50 text-foreground border-border'
                }`}
              >
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{event.title}</span>
              </div>
            ))}
            {todayEvents.length > 4 && (
              <p className="text-xs text-muted-foreground pl-2">
                +{todayEvents.length - 4} more today
              </p>
            )}
          </div>
        </div>
      )}

      {/* This Week's Events */}
      {weekEvents.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              This Week
            </Badge>
          </div>
          <div className="space-y-1.5">
            {weekEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-muted/30 text-xs"
              >
                <span className="truncate text-muted-foreground">{event.title}</span>
                <span className="text-muted-foreground/70 flex-shrink-0">
                  {format(parseISO(event.startDate), 'EEE')}
                </span>
              </div>
            ))}
            {weekEvents.length > 3 && (
              <p className="text-xs text-muted-foreground pl-2">
                +{weekEvents.length - 3} more this week
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
