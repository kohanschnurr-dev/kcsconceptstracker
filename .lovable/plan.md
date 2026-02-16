

## Fix Calendar Header: Dead Space and Truncated Project Filter

### Problems
1. **"All Proje..." truncated** -- The project filter trigger is hardcoded to `w-[160px]`, cutting off "All Projects" text.
2. **Massive dead space** -- `justify-between` on the outer container pushes the view toggles and Add button to the far right, leaving a wide empty gap in the center.

### Solution

**File: `src/components/calendar/CalendarHeader.tsx`**

1. **Widen the project filter trigger** -- Change `w-[160px]` to `w-[180px]` so "All Projects" displays fully without excess width.

2. **Close the dead space** -- Change the outer container from `justify-between` to `justify-start` (or just remove `justify-between`) so the right section flows naturally after the left section instead of being pushed to the far edge. Keep `gap-4` between sections and let the Add button sit adjacent to the view toggles.

Alternatively, wrap both sections with `flex-wrap` and `gap-4` so everything flows in one line left-to-right without artificial spacing.

### Technical Detail

In `CalendarHeader.tsx` line 78, change:
```
flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4
```
to:
```
flex flex-col lg:flex-row items-start lg:items-center gap-4
```

On line 114, change `w-[160px]` to `w-[180px]`.

### Files Changed
- `src/components/calendar/CalendarHeader.tsx` (two small edits)

