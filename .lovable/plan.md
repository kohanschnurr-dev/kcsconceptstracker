

## Give Calendar and Add Buttons More Width

### Problem
The text input takes up too much horizontal space, leaving the calendar icon button and "Add" button squeezed into narrow widths on the right.

### Solution
**File: `src/components/dashboard/QuickTaskInput.tsx`**

- Change the input wrapper from `flex-1` to a constrained width (e.g., `flex-1 max-w-[75%]`) so it doesn't consume all available space
- Add `min-w-[100px]` to the "Add" button and increase padding so it has more presence
- Add `min-w-[44px]` to the calendar button so it doesn't shrink too small
- Alternatively, a simpler approach: give the calendar button and Add button explicit wider sizing (`w-12` for calendar, `w-24` for Add) so they claim more of the row

The simplest fix: add `px-4` to the calendar button and `min-w-[80px]` to the Add button, giving both more horizontal real estate without overcomplicating the layout.

