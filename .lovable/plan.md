
## Hide View-Switcher Buttons on Mobile — Calendar Page

### What the User Means

On the Calendar page, the header contains Month / Week / Gantt view-switcher buttons that are always visible. On mobile, these crowd the header row alongside the title, date navigator, project filter, and weather widget — creating a cramped, wrapped layout. Since the user navigates primarily through the top-right area on mobile, these tab-style controls are redundant clutter on small screens.

On the home page (Index.tsx), there are no tab selectors — it is already clean on mobile.

### What Changes

The Month / Week / Gantt pill group in `CalendarHeader` will be hidden on mobile (`hidden sm:flex`) and replaced with a compact `Select` dropdown that appears only on mobile (`sm:hidden`). This keeps the view-switching ability without sacrificing header space.

```
Mobile (< 640px):
┌──────────────────────────────────────────┐
│ 📅 Project Calendar    ‹ Feb 2026 ›  [+] │
│ [All Projects ▾]   🌤 72°               │
│ [Month ▾]  ← compact select             │
└──────────────────────────────────────────┘

Desktop (≥ 640px):
┌────────────────────────────────────────────────────────┐
│ 📅 Project Calendar  ‹ Feb 2026 ›  [All Projects ▾]    │
│ 🌤 72°   [ Month | Week | Gantt ]              [+ Add] │
└────────────────────────────────────────────────────────┘
```

### Technical Changes

#### `src/components/calendar/CalendarHeader.tsx`

1. **Hide pill group on mobile**: add `hidden sm:flex` to the view-switcher `div`.
2. **Add mobile `Select` dropdown**: rendered only on mobile (`sm:hidden`) using the existing `Select` component, with options Month / Week / Gantt and icons.

```tsx
{/* Mobile view selector */}
<div className="sm:hidden">
  <Select value={view} onValueChange={(v) => onViewChange(v as CalendarView)}>
    <SelectTrigger className="h-9 w-[120px] bg-card border-border">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="monthly">
        <span className="flex items-center gap-2"><LayoutGrid className="h-4 w-4" />Month</span>
      </SelectItem>
      <SelectItem value="weekly">
        <span className="flex items-center gap-2"><List className="h-4 w-4" />Week</span>
      </SelectItem>
      <SelectItem value="gantt">
        <span className="flex items-center gap-2"><GanttChart className="h-4 w-4" />Gantt</span>
      </SelectItem>
    </SelectContent>
  </Select>
</div>

{/* Desktop pill group */}
<div className="hidden sm:flex items-center gap-1 bg-secondary rounded-lg p-1">
  {/* existing Month / Week / Gantt buttons unchanged */}
</div>
```

### Files to Modify

| File | Change |
|---|---|
| `src/components/calendar/CalendarHeader.tsx` | 1. Wrap pill group in `hidden sm:flex`. 2. Add `sm:hidden` Select dropdown for mobile. |

One file. No logic changes — the same `onViewChange` callback is used by both the pill group and the dropdown. The current view is preserved correctly since both read/write the same `view` prop.
