

## Fix: Equal Height for All Three Agenda Boxes

### Problem
The three boxes in Today's Agenda have unequal heights -- the Tasks box is taller when it shows overdue/due-today text plus a button, while the Calendar and Events boxes are shorter.

### Solution
**File: `src/components/dashboard/TasksDueTodayBanner.tsx`**

Add a consistent `min-h-[120px]` to all three box containers so they always match in height regardless of their content. This ensures the "View Calendar" box, "Tasks" box, and "Events" box all render at the same height whether there are 0 or 5 items showing.

Each box already has `flex flex-col items-center justify-center` which will keep content vertically centered within the fixed minimum height.

### Change
- Lines for all three box `div`s: add `min-h-[120px]` to the className
- No other files affected

