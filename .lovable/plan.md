

## Remove Lead Time and Expected Date Fields

### What Changes
Remove the "Lead Time (days)" and "Expected Date" fields from the New Project Event modal.

### Technical Details

**File: `src/components/calendar/NewEventModal.tsx`**

1. Remove the `leadTimeDays` and `expectedDate` state variables
2. Remove the UI section containing the "Lead Time (days)" input and "Expected Date" date picker
3. Remove `lead_time_days` and `expected_date` from the event object passed to the database insert
4. Keep all other fields (Project, Category, Title, Date, Recurring, Critical Path, Notes) intact

