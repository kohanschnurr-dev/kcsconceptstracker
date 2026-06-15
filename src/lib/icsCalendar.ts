// Tiny helpers to turn a booking into a Google Calendar URL or an .ics file.

function pad(n: number) { return n.toString().padStart(2, "0"); }
function toICalDate(d: Date) {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

export interface CalendarEvent {
  title: string;
  description: string;
  start: Date;
  durationMinutes: number;
  location?: string;
}

export function googleCalendarUrl(ev: CalendarEvent) {
  const end = new Date(ev.start.getTime() + ev.durationMinutes * 60_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${toICalDate(ev.start)}/${toICalDate(end)}`,
    details: ev.description,
  });
  if (ev.location) params.set("location", ev.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcs(ev: CalendarEvent): string {
  const end = new Date(ev.start.getTime() + ev.durationMinutes * 60_000);
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@groundworks`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GroundWorks//Demo//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toICalDate(new Date())}`,
    `DTSTART:${toICalDate(ev.start)}`,
    `DTEND:${toICalDate(end)}`,
    `SUMMARY:${ev.title.replace(/\n/g, " ")}`,
    `DESCRIPTION:${ev.description.replace(/\n/g, "\\n")}`,
    ev.location ? `LOCATION:${ev.location}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

export function downloadIcs(ev: CalendarEvent, filename = "groundworks-demo.ics") {
  const blob = new Blob([buildIcs(ev)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
