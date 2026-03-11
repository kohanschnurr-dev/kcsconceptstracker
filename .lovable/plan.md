

## Plan: Double-Click Calendar Day → Open New Event Modal

### Approach
Add an `onDayDoubleClick` callback from `MonthlyView` and `WeeklyView` up to `Calendar.tsx`, which will control a new `NewEventModal` instance that can be opened programmatically with a pre-set date.

### Changes

**1. `src/components/calendar/NewEventModal.tsx`**
- Add optional props `externalOpen?: boolean`, `onExternalOpenChange?: (open: boolean) => void`, `defaultStartDate?: Date`
- When these are provided, use them to control the dialog open state and pre-fill the start date
- Keep existing trigger button behavior when used from the header

**2. `src/components/calendar/MonthlyView.tsx`**
- Add `onDayDoubleClick?: (date: Date) => void` to props
- Attach `onDoubleClick` handler to the `DroppableDay` wrapper div, calling `onDayDoubleClick(day)`

**3. `src/components/calendar/WeeklyView.tsx`**
- Same: add `onDayDoubleClick` prop and attach `onDoubleClick` to `DroppableDay`

**4. `src/pages/Calendar.tsx`**
- Add state: `quickCreateDate` and `quickCreateOpen`
- Pass `onDayDoubleClick` to `MonthlyView` and `WeeklyView` that sets the date and opens the modal
- Render a second `NewEventModal` controlled externally with the pre-filled date

