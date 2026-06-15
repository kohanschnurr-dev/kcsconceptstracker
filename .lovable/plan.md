## Demo page → "Book a Live Walkthrough" scheduler

Replace the video placeholder + feature checklist with a native booking flow so prospects schedule a 1-on-1 walkthrough with you. You guide them through the product live.

### How it works (prospect view)
1. Land on `/demo`. New hero: **"Book a Live Walkthrough"** + 1-line subheader ("30-minute screen-share. I'll set up your first project with you, live.").
2. **Step 1 — Pick a day.** Calendar grid (next 14 weekdays). Past days disabled, weekends greyed out, unavailable days marked.
3. **Step 2 — Pick a time.** Slot grid in prospect's local timezone (8 AM–5 PM CT shown as their local time, 30-min slots). Already-booked slots disabled.
4. **Step 3 — Your details.** Form: Name, Work email, Company, Phone (optional), Role (dropdown: Investor / GC / PM / Other), "What do you want to see?" (textarea, optional).
5. **Confirm.** Card shows summary: date, time (both timezones), email, "Add to Google Calendar" + "Add to .ics" buttons. Email goes out to prospect (confirmation) and to you (new booking alert) via Resend.

### How it works (your side)
- New table `demo_bookings` stores every request. Visible to you on a future admin page (out of scope for this turn — data is captured for now).
- Resend transactional emails:
  - To prospect: confirmation with date/time, calendar invite, and a "reschedule/cancel" note (manual reply for now).
  - To you (FROM_EMAIL): "New demo booked: {name} · {company} · {datetime}" + their answers.
- You can later wire Google Meet / Zoom links into the confirmation email — out of scope for this turn.

### Technical details

**Schema (migration)**
- New `public.demo_bookings` table: `name`, `email`, `company`, `phone`, `role`, `notes`, `slot_at timestamptz`, `slot_duration_minutes int default 30`, `timezone text`, `status text default 'booked'` (booked|cancelled|completed), plus id/created_at/updated_at.
- RLS: insert allowed to `anon` (public booking), select/update restricted to `service_role` only. No anon select (prevents enumeration of leads).
- Unique partial index on `(slot_at)` where `status = 'booked'` to prevent double-booking.

**Availability source of truth**
- For v1, availability is hard-coded in `src/lib/demoAvailability.ts`:
  - Workdays Mon–Fri, slot duration 30 min, business hours 09:00–17:00 America/Chicago.
  - Buffer of 30 min between bookings.
  - You can later swap to Cal.com / Google Calendar; the UI talks to a single `getAvailableSlots(date)` function so the swap is one file.
- Slot grid queries existing `demo_bookings` where `slot_at >= today AND status = 'booked'` to grey out taken slots.

**Booking edge function** `supabase/functions/book-demo/index.ts`
- POST `{ name, email, company, phone, role, notes, slot_at, timezone }`.
- Validates: email format, slot is in the future, slot is on a valid 30-min boundary in business hours, slot not already booked (re-check with `select count` then insert; rely on unique index for race protection).
- Inserts row via service role.
- Sends two Resend emails (prospect confirmation + owner alert). Uses `RESEND_API_KEY` (already configured) and a hard-coded `FROM_EMAIL` constant + `OWNER_EMAIL` constant at the top of the file (placeholder you swap to your address).
- Generates an `.ics` attachment string and includes it in the prospect email.
- `verify_jwt = false` in `supabase/config.toml` (public endpoint).
- Returns `{ booking_id }` on success, structured `{ error }` on failure.

**Frontend** `src/pages/Demo.tsx` (full rewrite)
- Three-pane wizard inside one card; progress dots at top.
- Date picker: custom 14-day grid (not shadcn calendar — denser, on-brand). Sharp 2px corners, 1px border, `bg-card`, hover `bg-secondary`, active `bg-primary text-primary-foreground`.
- Time slot grid: 4-column on desktop, 2-column on mobile. Disabled slots have `opacity-40 line-through`.
- Form uses existing `Input`, `Textarea`, `Select`. Validation inline; submit disabled until valid.
- On success → swap card to confirmation view with checkmark, summary, calendar buttons (Google Calendar URL builder + downloadable `.ics`).
- Timezone detected via `Intl.DateTimeFormat().resolvedOptions().timeZone`; toggle "Show times in CT" available.
- Trust strip below card: "30 min · Free · No credit card · Bring 1 active project if you can".
- "What we'll cover" mini-list (the 6 highlights reduced to 4 bullet points) lives below the scheduler, not as a separate hero.

**Constants in code (you swap these)**
```text
OWNER_EMAIL    = 'you@groundworks.app'    // booking alerts go here
FROM_EMAIL     = 'demo@groundworks.app'   // sender (must be verified in Resend)
BUSINESS_TZ    = 'America/Chicago'
BUSINESS_HOURS = { start: '09:00', end: '17:00' }
SLOT_MINUTES   = 30
```

### Files
- New migration: `demo_bookings` table + RLS + unique index.
- New: `supabase/functions/book-demo/index.ts` + entry in `supabase/config.toml`.
- New: `src/lib/demoAvailability.ts` (slot generator).
- New: `src/lib/icsCalendar.ts` (tiny .ics builder + Google Calendar URL helper).
- New: `src/components/demo/DemoScheduler.tsx` (the wizard).
- Edited: `src/pages/Demo.tsx` (replace video + checklist with scheduler).

### Out of scope (future)
- Auto-generated Google Meet / Zoom link.
- Reschedule / cancel self-service flow (currently: "reply to confirm email").
- Admin page to view bookings (data is in DB; add a Settings card later).
- Real Cal.com / Google Calendar busy-time integration.
