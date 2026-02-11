

## Fix Calendar Header Layout - Remove Dead Space

### Problem
The `flex-1` on both sections creates a gap in the middle. The filters and views float away from the title, and the "Add Project Event" button dropped to a second line.

### Fix

**File: `src/components/calendar/CalendarHeader.tsx`**

1. **Remove `flex-1` from both sections** -- revert to simple `flex` without growing
2. **Change the outer container** to keep `justify-between` but ensure everything sits on one row
3. **Move all middle items (project filter, weather, view toggle) next to the title/nav** in the LEFT section so they flow naturally left-to-right with no gap
4. **Keep only the "Add Project Event" button in the RIGHT section**, anchored to the far right

### Result Layout
```
[Calendar Icon] Project Calendar  < February 2026 >  [All Projects v]  [Weather]  [Month|Week|Gantt]          [+ Add Project Event]
```

Everything flows left-to-right with no dead space. The button stays pinned to the top-right corner.

### Technical Details

- Line 72: Keep outer div as `flex ... justify-between`
- Lines 74-100 (left section): Remove `flex-1`, add project filter, weather widget, and view toggle buttons into this section
- Lines 103-145 (right section): Remove `flex-1 justify-end`, keep only `{onAddEvent && onAddEvent}`

