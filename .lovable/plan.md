## Change

In the New Event modal, clicking the **Recurring** tile should toggle recurrence directly — no extra switch click required.

## Behavior

- **Click tile while OFF** → turn recurrence ON, popover opens so the user can pick frequency / until-date.
- **Click tile while ON** → turn recurrence OFF, popover stays/becomes closed.
- Remove the redundant "Recurring event" switch row from the popover — the popover now contains only frequency + until-date controls (which is all you need once it's already on).

## Edit

**`src/components/calendar/NewEventModal.tsx`** (lines 496–522):

1. Add an `onClick` to the trigger button:
   ```tsx
   onClick={(e) => {
     if (isRecurring) {
       e.preventDefault();   // stop popover from opening
       setIsRecurring(false);
       setRecurringPopoverOpen(false);
     } else {
       setIsRecurring(true); // PopoverTrigger still opens the popover for config
     }
   }}
   ```
2. Delete the `<div className="flex items-center justify-between">…<Switch …/></div>` block (the toggle row inside the popover).
3. Frequency / Until-date sub-section is no longer wrapped in `{isRecurring && …}` since the popover only opens when recurrence is already on; flatten it.
