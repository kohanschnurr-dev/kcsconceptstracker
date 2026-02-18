
## Fix: Make Calendar Icons Perfectly Vertically Aligned

### The Real Root Cause

The current row layout (left to right) is:
```
[ ☐ ] [ Title flex-1 ] [ due date 105px ] [ badge + icon ]
```

The problem is the **rightmost group** (`badge + icon`) has **variable width**. "High" badge is wider than "Medium" badge, which is wider than "Low". Since flex lays out left-to-right, the 105px due-date box starts at a different X position on rows with "High" vs "Medium" vs "Low" badges — so even though the content is right-aligned inside the box, the box itself moves.

### The Fix: Give the Badge Column a Fixed Width Too

Give the badge + icon column a fixed width (`w-[90px]`) so it never changes size. This anchors every column at a deterministic position:

```
[ ☐ ] [ Title flex-1 ] [ due date w-[105px] justify-end ] [ badge+icon w-[90px] justify-end ]
       ^expands         ^always same x-start               ^always same width
```

This guarantees the calendar icon always starts at the exact same horizontal position — every row, every priority level.

### Exact Change in `src/components/project/ProjectTasks.tsx`

**Line 150 — Before:**
```tsx
<div className="flex items-center gap-2 shrink-0">
```

**After:**
```tsx
<div className="w-[90px] shrink-0 flex items-center justify-end gap-2">
```

That's the only change needed. The due date column (`w-[105px] justify-end`) is already correct — it just needs the badge column to stop being variable width.

### Visual Result

```
Row 1: [ ☐ ] [ Tell Jose… ─────────── ] [📅 Due Feb 18] [  High 🔴  ]
Row 2: [ ☐ ] [ Garage studs ──────── ] [              ] [  High 🔴  ]
Row 3: [ ☐ ] [ Concrete situation ── ] [📅 Due Feb 17] [  Med  🟡  ]
Row 4: [ ☐ ] [ Adding 2x4s ──────── ] [              ] [  Low  ⚪  ]
                                         ↑ calendar icons
                                           all at same X
```

Every column is now fixed-width and the calendar emoji will form a perfect vertical line.

### Files to Modify

| File | Change |
|------|--------|
| `src/components/project/ProjectTasks.tsx` | Add `w-[90px] justify-end` to the badge+icon wrapper div (line 150) |
