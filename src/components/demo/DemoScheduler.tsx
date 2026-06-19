import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Calendar, Clock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { detectTimezone, getNextDays, getSlotsForDay, type DayOption, type Slot } from "@/lib/demoAvailability";
import { downloadIcs, googleCalendarUrl } from "@/lib/icsCalendar";

type Step = 1 | 2 | 3;

interface BookingForm {
  name: string;
  email: string;
  company: string;
  phone: string;
  role: string;
  notes: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function DemoScheduler() {
  const [step, setStep] = useState<Step>(1);
  const [tz] = useState(() => detectTimezone());
  const [days] = useState<DayOption[]>(() => getNextDays());
  const [selectedDay, setSelectedDay] = useState<DayOption | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [bookedIsos, setBookedIsos] = useState<Set<string>>(new Set());
  const [loadingBooked, setLoadingBooked] = useState(false);
  const [carouselStart, setCarouselStart] = useState(0);
  const visibleDayCount = 7;

  const [form, setForm] = useState<BookingForm>({
    name: "", email: "", company: "", phone: "", role: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmedAt, setConfirmedAt] = useState<Date | null>(null);

  // Pre-fetch booked slots for selected day
  useEffect(() => {
    if (!selectedDay) return;
    let cancelled = false;
    (async () => {
      setLoadingBooked(true);
      const dayStart = new Date(selectedDay.date);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 2);
      const { data } = await supabase
        .from("demo_bookings")
        .select("slot_at")
        .eq("status", "booked")
        .gte("slot_at", dayStart.toISOString())
        .lt("slot_at", dayEnd.toISOString());
      if (!cancelled) {
        setBookedIsos(new Set((data ?? []).map((r: any) => new Date(r.slot_at).toISOString())));
        setLoadingBooked(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedDay]);

  const slots = useMemo(() => {
    if (!selectedDay) return [];
    const now = Date.now();
    return getSlotsForDay(selectedDay.iso, tz).filter((s) => s.utc.getTime() > now + 60_000);
  }, [selectedDay, tz]);

  const visibleDays = days.slice(carouselStart, carouselStart + visibleDayCount);
  const canPrev = carouselStart > 0;
  const canNext = carouselStart + visibleDayCount < days.length;

  const formValid =
    form.name.trim().length > 0 &&
    EMAIL_RE.test(form.email.trim()) &&
    selectedSlot !== null;

  const handleSubmit = async () => {
    if (!formValid || !selectedSlot) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("book-demo", {
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          company: form.company.trim(),
          phone: form.phone.trim(),
          role: form.role.trim(),
          notes: form.notes.trim(),
          slot_at: selectedSlot.iso,
          timezone: tz,
        },
      });
      if (error) throw new Error(error.message || "Booking failed");
      if ((data as any)?.error) throw new Error((data as any).error);
      setConfirmedAt(selectedSlot.utc);
    } catch (e: any) {
      toast.error(e.message || "Could not book that slot. Please try another.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Confirmation view ----
  if (confirmedAt && selectedSlot) {
    const calEvent = {
      title: "GroundWorks Walkthrough",
      description: `30-minute live walkthrough of GroundWorks.\n\nBooked by ${form.name} (${form.email}).`,
      start: confirmedAt,
      durationMinutes: 30,
    };
    const prettyLocal = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, weekday: "long", month: "long", day: "numeric",
      hour: "numeric", minute: "2-digit", timeZoneName: "short",
    }).format(confirmedAt);

    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/15 mb-4">
          <CheckCircle2 className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-heading text-2xl font-bold mb-2">You're booked</h3>
        <p className="text-muted-foreground mb-6">
          A confirmation is on its way to <strong className="text-foreground">{form.email}</strong>.
        </p>
        <div className="inline-flex flex-col items-center gap-1 border border-border bg-background px-6 py-4 rounded-lg mb-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" /> Walkthrough
          </div>
          <div className="font-semibold text-base">{prettyLocal}</div>
          <div className="text-xs text-muted-foreground">30 minutes · video link arrives by email</div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="default">
            <a href={googleCalendarUrl(calEvent)} target="_blank" rel="noreferrer">
              <Calendar className="w-4 h-4 mr-2" /> Add to Google Calendar
            </a>
          </Button>
          <Button variant="outline" onClick={() => downloadIcs(calEvent)}>
            <Download className="w-4 h-4 mr-2" /> Download .ics
          </Button>
        </div>
      </div>
    );
  }

  // ---- Wizard view ----
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 border-b border-border bg-background/40 py-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={cn(
                "w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center transition-colors",
                step === n
                  ? "bg-primary text-primary-foreground"
                  : step > n
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {n}
            </div>
            <span className={cn("text-xs hidden sm:inline", step === n ? "text-foreground font-medium" : "text-muted-foreground")}>
              {n === 1 ? "Date" : n === 2 ? "Time" : "Details"}
            </span>
            {n < 3 && <div className="w-6 sm:w-10 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="p-6 sm:p-8">
        {step === 1 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold">Pick a day</h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost" size="icon" className="h-8 w-8"
                  disabled={!canPrev}
                  onClick={() => setCarouselStart(Math.max(0, carouselStart - visibleDayCount))}
                  aria-label="Previous days"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-8 w-8"
                  disabled={!canNext}
                  onClick={() => setCarouselStart(Math.min(days.length - visibleDayCount, carouselStart + visibleDayCount))}
                  aria-label="Next days"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {visibleDays.map((d) => {
                const active = selectedDay?.iso === d.iso;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    disabled={d.disabled}
                    onClick={() => { setSelectedDay(d); setSelectedSlot(null); setStep(2); }}
                    className={cn(
                      "flex flex-col items-center justify-center py-3 px-1 border transition-all",
                      d.disabled
                        ? "border-border bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
                        : active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:border-primary hover:bg-primary/5",
                    )}
                  >
                    <span className="text-[10px] uppercase tracking-wider opacity-80">{d.label}</span>
                    <span className="text-base font-bold leading-tight mt-0.5">{d.dateLabel.split(" ")[1]}</span>
                    <span className="text-[9px] uppercase opacity-60">{d.dateLabel.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Times shown in <strong>{tz.replace(/_/g, " ")}</strong>
            </p>
          </div>
        )}

        {step === 2 && selectedDay && (
          <div>
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
            >
              <ChevronLeft className="w-4 h-4" /> Change day
            </button>
            <h3 className="font-heading text-xl font-bold mb-1">Pick a time</h3>
            <p className="text-sm text-muted-foreground mb-5">
              {new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "long", month: "long", day: "numeric" }).format(selectedDay.date)}
              {" · "}30 minutes
            </p>
            {loadingBooked ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                No more slots today. Pick another day.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {slots.map((s) => {
                  const taken = bookedIsos.has(s.iso);
                  const active = selectedSlot?.iso === s.iso;
                  return (
                    <button
                      key={s.iso}
                      type="button"
                      disabled={taken}
                      onClick={() => { setSelectedSlot(s); setStep(3); }}
                      className={cn(
                        "py-2.5 px-3 border text-sm font-medium transition-all",
                        taken
                          ? "border-border bg-muted/20 text-muted-foreground/40 line-through cursor-not-allowed"
                          : active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:border-primary hover:bg-primary/5",
                      )}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === 3 && selectedSlot && selectedDay && (
          <div>
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
            >
              <ChevronLeft className="w-4 h-4" /> Change time
            </button>
            <h3 className="font-heading text-xl font-bold mb-1">Your details</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
              <Clock className="w-4 h-4" />
              {new Intl.DateTimeFormat("en-US", {
                timeZone: tz, weekday: "short", month: "short", day: "numeric",
                hour: "numeric", minute: "2-digit", timeZoneName: "short",
              }).format(selectedSlot.utc)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bk-name">Name <span className="text-destructive">*</span></Label>
                <Input id="bk-name" value={form.name} maxLength={120}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bk-email">Work email <span className="text-destructive">*</span></Label>
                <Input id="bk-email" type="email" value={form.email} maxLength={254}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bk-company">Company</Label>
                <Input id="bk-company" value={form.company} maxLength={200}
                  onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme Builders" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bk-phone">Phone (optional)</Label>
                <Input id="bk-phone" value={form.phone} maxLength={40}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="bk-role">What's your role?</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger id="bk-role"><SelectValue placeholder="Select one..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Investor">Real Estate Investor</SelectItem>
                    <SelectItem value="General Contractor">General Contractor</SelectItem>
                    <SelectItem value="Project Manager">Project Manager</SelectItem>
                    <SelectItem value="Lender">Lender</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="bk-notes">What do you want to see? (optional)</Label>
                <Textarea id="bk-notes" value={form.notes} maxLength={1000} rows={3}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. budgeting flow, lender draws, expense tracking..." />
              </div>
            </div>

            <Button
              size="lg"
              className="w-full mt-6 gold-glow hover:scale-[1.01] transition-transform"
              disabled={!formValid || submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Booking your slot...</>
              ) : (
                <>Confirm walkthrough</>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              By booking, you agree to receive a confirmation email. No credit card required.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
