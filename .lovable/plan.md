

## Distribute Calendar Header Evenly

The calendar header currently uses `justify-between` which pushes the left group (title + nav) and right group (filters + views + button) to opposite edges, leaving a large gap in the middle.

### Fix

**File: `src/components/calendar/CalendarHeader.tsx`**

Change the outer container from `justify-between` to `justify-evenly` (or use `w-full` with spaced-out children). Specifically:

1. **Line 72** - Change the outer `div` class from `justify-between` to `justify-between w-full` and make the inner sections use `flex-1` so they spread across the available space.

   More precisely:
   - Left section (line 74): Add `flex-1` so it takes available space
   - Right section (line 104): Add `flex-1 justify-end` so it takes the remaining space and right-aligns its content

This distributes both sections across the full width of the header bar, eliminating the large dead-space gap while keeping the left group left-aligned and the right group right-aligned.

### Result
The title/navigation will anchor to the left and the filters/views/button will anchor to the right, with both sections stretching to fill the container evenly -- no wasted space in between.
