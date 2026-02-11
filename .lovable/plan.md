

## Add Recurring Events to "New Project Event" Modal

### What It Does
Adds a "Repeat" option to the event creation form so you can schedule recurring events like "Collect Rent" on the 1st of every month or "Change Air Filter" every quarter. Includes an "Until When" setting with options for indefinitely or a specific end date. When submitted, all individual occurrences are created as separate calendar events in the database.

### UI Changes (NewEventModal)

A new section appears below the date picker:

1. **Repeat Toggle** -- a checkbox or switch: "Recurring event"
2. When enabled, show:
   - **Frequency** dropdown: Monthly, Quarterly, Yearly (and optionally Weekly)
   - **Day of Month** input (e.g., "1" for the 1st) -- pre-filled from the selected start date
   - **Until When** radio/select:
     - "Indefinitely" (generates events for 2 years ahead as a practical cap)
     - "Until specific date" with a date picker

### Database Changes
Add 3 nullable columns to `calendar_events` to track recurrence metadata on each generated event:

- `recurrence_rule` (text, nullable) -- e.g., "monthly", "quarterly", "yearly"
- `recurrence_group_id` (uuid, nullable) -- shared ID linking all events from the same recurrence
- `recurrence_until` (date, nullable) -- null means indefinite

These columns are informational -- they let you identify and potentially bulk-edit/delete recurring event series later.

### Event Generation Logic
On form submit, instead of inserting 1 row, the code calculates all occurrence dates from the start date to the "until" date (or 2 years out for indefinite) and batch-inserts them. Each occurrence gets:
- The same title, category, project, notes, etc.
- Its own start/end date (adjusted for multi-day duration if applicable)
- A shared `recurrence_group_id` UUID

Occurrence limits:
- Monthly: up to 24 events (2 years)
- Quarterly: up to 8 events (2 years)
- Yearly: up to 5 events (5 years)

### Technical Details

**Migration SQL:**
```sql
ALTER TABLE calendar_events 
  ADD COLUMN recurrence_rule text,
  ADD COLUMN recurrence_group_id uuid,
  ADD COLUMN recurrence_until date;
```

**File: `src/components/calendar/NewEventModal.tsx`**
- Add state: `isRecurring`, `recurrenceFrequency`, `recurrenceUntilType`, `recurrenceUntilDate`
- Add UI section between the date picker and lead time sections
- Modify `handleSubmit` to generate multiple events when `isRecurring` is true
- Use `addMonths`, `addQuarters`, `addYears` from `date-fns` for date math
- Batch insert using `.insert([...arrayOfEvents])`

