
## Move Calendar Legend Below the Grid

### What changes
**`src/components/project/ProjectCalendar.tsx`**

1. **Remove** the Info icon popover from the header (lines 138-147) -- the Popover wrapping `CalendarLegend` and the `Info` icon button will be deleted entirely.

2. **Add** the `CalendarLegend` directly below the calendar grid (after line 294, before the "no events" message), rendered inline as a subtle row:
   ```
   <div className="pt-3 mt-2 border-t border-border">
     <CalendarLegend />
   </div>
   ```

This places the legend at the bottom of the card content area, always visible but out of the way -- no longer requiring a popover click to see it.

### No other files affected
The main Calendar page already has its own legend placement and is unchanged.
