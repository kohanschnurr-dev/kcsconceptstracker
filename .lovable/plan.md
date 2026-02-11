
## Fix Calendar Header Wrapping on Standard Laptop Screens

### Problem
The calendar header has all its controls (title, date nav, project filter, weather widget, view toggles) in a single `flex-wrap` container. On a standard laptop (~1366-1536px), this overflows and wraps to a second row, creating a "double header" look.

### Solution
Move the view toggle buttons (Month/Week/Gantt) to the right side, next to the "Add Project Event" button, and prevent the left section from wrapping by using `overflow-hidden` with compact sizing. This distributes the content more evenly across the available width.

Specifically:

**File: `src/components/calendar/CalendarHeader.tsx`**

1. Change the left section from `flex-wrap` to `flex-nowrap overflow-x-auto` so items stay on one line and scroll if absolutely necessary on very small screens.
2. Reduce the project filter width from `w-[180px]` to `w-[160px]`.
3. Move the view toggle group out of the left section and into the right section, alongside the "Add Project Event" button.
4. The right section becomes a flex container with the view toggles and the add button grouped together with a small gap.

This keeps the left side focused on: Title + Date Nav + Project Filter + Weather, and the right side on: View Toggles + Add Button -- splitting the content roughly 60/40 so it fits comfortably on a 1366px+ screen.

### Technical Detail

```text
Left group (flex-nowrap):
  [Calendar Icon] Project Calendar  [< February 2026 >]  [All Projects v]  [Weather]

Right group (flex items-center gap-2):
  [Month | Week | Gantt]  [+ Add Project Event]
```

The outer container remains `flex justify-between` with `items-center`. On mobile (`lg:` breakpoint), the layout already stacks vertically via `flex-col`, which stays unchanged.
