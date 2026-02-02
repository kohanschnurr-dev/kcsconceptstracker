

## Plan: Enlarge Calendar Grid to Fill Available Space

### Problem Analysis

Looking at your screenshot, the calendar has significant dead space below it. The calendar grid uses a fixed `min-h-[120px]` for each day cell, which doesn't adapt to the available viewport height.

### Solution

Make the calendar expand vertically to fill the available space while keeping cells reasonably sized. The goal is to use the viewport height more effectively without overdoing it.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/pages/Calendar.tsx` | Make the calendar container use flexbox to fill available height |
| `src/components/calendar/MonthlyView.tsx` | Increase day cell minimum height and make grid fill container |

---

### Technical Details

**File: `src/pages/Calendar.tsx`**

Change the outer layout container to use flex column with `flex-1` so the calendar can grow:
- Update `space-y-4` wrapper to `flex flex-col h-[calc(100vh-8rem)] gap-4`
- This gives the calendar a defined height to fill (viewport minus header padding)

**File: `src/components/calendar/MonthlyView.tsx`**

Increase the day cell height and make the grid fill available space:
- Change container from `p-4` to `flex flex-col h-full p-4`
- Change calendar grid to `grid grid-cols-7 gap-1 flex-1`
- Increase day cells from `min-h-[120px]` to `min-h-[140px]` or use dynamic sizing

---

### Visual Before/After

```text
BEFORE:
┌──────────────────────────────────────┐
│ Header + Legend                      │
├──────────────────────────────────────┤
│ Calendar Grid (120px rows)           │
│                                      │
│                                      │
├──────────────────────────────────────┤
│ Dead Space                           │
│                                      │
│                                      │
└──────────────────────────────────────┘

AFTER:
┌──────────────────────────────────────┐
│ Header + Legend                      │
├──────────────────────────────────────┤
│ Calendar Grid (expanded rows)        │
│                                      │
│                                      │
│                                      │
│                                      │
│                                      │
│                                      │
└──────────────────────────────────────┘
```

---

### Specific Code Changes

**MonthlyView.tsx - Day cell sizing:**
```tsx
// Current
className="min-h-[120px] p-2 rounded-lg border ..."

// New - taller cells to fill space
className="min-h-[140px] p-2 rounded-lg border ..."
```

**Calendar.tsx - Container height:**
```tsx
// Current
<div className="space-y-4">

// New - flex container that fills viewport
<div className="flex flex-col min-h-[calc(100vh-10rem)] gap-4">
```

**Calendar.tsx - Grid container:**
```tsx
// Current
<div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">

// New - flex-1 to grow
<div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex-1">
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Calendar.tsx` | Add flex container with calculated height, make calendar grid `flex-1` |
| `src/components/calendar/MonthlyView.tsx` | Increase cell height to `140px`, make container fill available space |

