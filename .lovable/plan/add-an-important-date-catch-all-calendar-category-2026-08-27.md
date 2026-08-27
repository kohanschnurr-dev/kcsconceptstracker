# Add an "Important Date" catch-all calendar category

## Goal

Give calendar events a general-purpose category for anything that doesn't fit an existing trade, admin, or milestone bucket.

## What changes

- Add a new category **Important Date** to the calendar category list, placed in the **Milestones** group (gold) so it stands out on the calendar as a notable date rather than construction work.
- It appears in the category search dropdown like any other option, is filterable, and shows the gold Milestones color on month, week, and Gantt views.
- Because it lives in an existing group, no new color palette, legend entry, or filter row is needed.

## Technical detail

- `src/lib/calendarCategories.ts`: append `{ value: 'important_date', label: 'Important Date', group: 'milestones', groupLabel: 'Milestones' }` to `CALENDAR_CATEGORIES`. All views, legends, and filters read from this list (plus the localStorage custom-category merge in `getCalendarCategories`), so the single addition propagates everywhere.
- `calendar_events.event_category` is a free-text column, so no database migration is required.
