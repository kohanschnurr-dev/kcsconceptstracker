import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminEvent, AdminEventType } from "@/types/admin";

interface Props {
  events: AdminEvent[];
  isLoading: boolean;
  onAddEvent: (event: {
    title: string;
    event_type: AdminEventType;
    date: string;
    time?: string | null;
    notes?: string | null;
  }) => void;
  onDeleteEvent: (id: string) => void;
}

const EVENT_COLORS: Record<AdminEventType, string> = {
  demo: "bg-teal-400/20 text-teal-400 border-teal-400/30",
  trial_expiration: "bg-amber-400/20 text-amber-400 border-amber-400/30",
  custom: "bg-gray-400/20 text-gray-400 border-gray-400/30",
};

const EVENT_LABELS: Record<AdminEventType, string> = {
  demo: "Demo",
  trial_expiration: "Trial Expiration",
  custom: "Custom",
};

export default function AdminCalendar({ events, isLoading, onAddEvent, onDeleteEvent }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    event_type: "custom" as AdminEventType,
    date: new Date().toISOString().slice(0, 10),
    time: "",
    notes: "",
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [year, month]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, AdminEvent[]> = {};
    events.forEach((e) => {
      const dateStr = e.date.slice(0, 10);
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(e);
    });
    return map;
  }, [events]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) return;
    onAddEvent({
      title: newEvent.title,
      event_type: newEvent.event_type,
      date: newEvent.date,
      time: newEvent.time || null,
      notes: newEvent.notes || null,
    });
    setShowAddModal(false);
    setNewEvent({ title: "", event_type: "custom", date: new Date().toISOString().slice(0, 10), time: "", notes: "" });
  };

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Calendar & Scheduling</h1>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Event
        </Button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        {(Object.entries(EVENT_LABELS) as [AdminEventType, string][]).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${EVENT_COLORS[type]}`} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="font-heading font-semibold">{monthName}</span>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-2 py-2 text-xs text-muted-foreground text-center font-semibold">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dateStr = day
              ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              : null;
            const dayEvents = dateStr ? eventsByDate[dateStr] ?? [] : [];
            const isToday = dateStr === new Date().toISOString().slice(0, 10);

            return (
              <div
                key={idx}
                className={`min-h-[80px] sm:min-h-[100px] border-b border-r border-border/50 p-1 ${
                  day ? "" : "bg-secondary/10"
                }`}
              >
                {day && (
                  <>
                    <span
                      className={`text-xs font-medium ${
                        isToday
                          ? "bg-primary text-primary-foreground w-6 h-6 rounded-full inline-flex items-center justify-center"
                          : "text-muted-foreground"
                      }`}
                    >
                      {day}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayEvents.map((e) => (
                        <div
                          key={e.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded border truncate group relative ${
                            EVENT_COLORS[e.event_type]
                          }`}
                          title={e.title}
                        >
                          {e.title}
                          <button
                            onClick={() => onDeleteEvent(e.id)}
                            className="absolute -top-1 -right-1 hidden group-hover:flex w-4 h-4 bg-card border border-border rounded-full items-center justify-center"
                          >
                            <Trash2 className="w-2.5 h-2.5 text-rose-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming events list */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-heading font-semibold mb-4">Upcoming Events</h2>
        {events.filter((e) => e.date >= new Date().toISOString().slice(0, 10)).length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming events</p>
        ) : (
          <div className="space-y-2">
            {events
              .filter((e) => e.date >= new Date().toISOString().slice(0, 10))
              .slice(0, 10)
              .map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${EVENT_COLORS[e.event_type].split(" ")[0]}`} />
                    <span>{e.title}</span>
                    {e.time && <span className="text-xs text-muted-foreground">{e.time}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(e.date).toLocaleDateString()}
                    </span>
                    <button onClick={() => onDeleteEvent(e.id)}>
                      <Trash2 className="w-3 h-3 text-muted-foreground hover:text-rose-400 transition-colors" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold">Add Event</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Title</label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Event title"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Type</label>
                <select
                  value={newEvent.event_type}
                  onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value as AdminEventType })}
                  className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="demo">Demo</option>
                  <option value="trial_expiration">Trial Expiration</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Date</label>
                  <Input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Time (optional)</label>
                  <Input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Notes (optional)</label>
                <textarea
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                  className="w-full bg-secondary/30 border border-border rounded-lg p-2 text-sm min-h-[60px] resize-y"
                />
              </div>
            </div>

            <Button className="w-full" onClick={handleAddEvent}>
              Add Event
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
