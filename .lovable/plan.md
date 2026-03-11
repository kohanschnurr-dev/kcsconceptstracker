

## Plan: Fix Double-Click Date Pre-Fill in New Event Modal

### Problem
When double-clicking a calendar day, the modal opens but the date field shows today's date instead of the clicked date. The `setOpen` function tries to set the date, but it races with the component's initial state.

### Changes

**`src/components/calendar/NewEventModal.tsx`**
1. Use a `useEffect` that watches `externalOpen` and `defaultStartDate` — when the modal opens externally with a date, set both `startDate` and `endDate` to that date. This is more reliable than setting state inside `setOpen`.
2. Remove the date-setting logic from `setOpen` (lines 70-73) since the effect handles it.

**`src/pages/Calendar.tsx`**
3. In the `onDayDoubleClick` handler, set the date state *before* opening the modal to ensure the value is ready.

