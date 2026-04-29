## Change

Remove the "Week" view from the calendar view switcher and rename "Month" to "Calendar". Keep two options: **Calendar** and **Gantt**.

## Edits

**`src/components/calendar/CalendarHeader.tsx`**
- Mobile `<Select>` (lines 95–100): drop the `weekly` `SelectItem`; rename Month label to "Calendar".
- Desktop pill group (lines 207–241): remove the Week `<Button>`; rename the Month button label to "Calendar".
- Leave the `view === 'monthly' ? MonthYearPicker : label` branches intact — Gantt still uses the fallback label.

**`src/pages/Calendar.tsx`**
- Remove the `WeeklyView` import (line 8) and the `{view === 'weekly' && <WeeklyView … />}` block (lines 314–325).
- Narrow `CalendarView` type (line 20) from `'monthly' | 'weekly' | 'gantt'` to `'monthly' | 'gantt'`.

No DB or routing changes. `WeeklyView.tsx` file is left in place (unused) so we don't risk breaking other imports — can be deleted later if confirmed orphaned.
