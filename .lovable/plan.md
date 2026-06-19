## Plan: Update Demo Walkthrough Availability

### What to change
1. **Enable weekends** on the date picker.
2. **Weekday slots** (Mon-Fri): 7:00 AM – 8:00 AM and 5:30 PM – 9:00 PM CT.
3. **Weekend slots** (Sat-Sun): 9:00 AM – 9:00 PM CT.
4. **Add backend validation** in the `book-demo` edge function to enforce the same window rules (currently it only checks 30-min boundaries).

### Files to edit
- `src/lib/demoAvailability.ts` — change slot generation and day option logic.
- `src/components/demo/DemoScheduler.tsx` — update the helper text under the calendar.
- `supabase/functions/book-demo/index.ts` — add business-hours validation to reject out-of-window slots server-side.

### Technical details
- `demoAvailability.ts`: remove the `isWeekend` disable flag. Change `getSlotsForDay` so it selects a different start/end hour set based on the day-of-week (Mon-Fri vs Sat-Sun). Use 30-min slots.
- Weekday 7:00–8:00 + 17:30–21:00 means slots at 7:00, 7:30, 17:30, 18:00, 18:30, 19:00, 19:30, 20:00, 20:30.
- Weekend 9:00–21:00 means slots every 30 min from 9:00 to 20:30.
- Edge function: after parsing `slotDate`, compute its CT day-of-week and wall-clock time, reject if outside the allowed window.
- No database schema changes needed.