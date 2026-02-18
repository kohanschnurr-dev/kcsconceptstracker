
## Fix CalendarHeader Mobile Layout

### Problems in the Screenshot

The `CalendarHeader` on mobile stacks everything linearly inside `flex flex-wrap` with `gap-4`, resulting in:

1. **Row 1**: "Project Calendar" title + left/right nav + MonthYearPicker — all crowded
2. **Row 2**: "All Projects" dropdown — full width, fine but wasteful
3. **Row 3**: Weather widget (Fort Worth 5-day forecast) — takes significant vertical space
4. **Row 4**: View selector dropdown (Month) — separate row
5. **Row 5**: "+ Add Project Event" button — separate row at the bottom

This wastes ~280px of vertical height before the calendar even renders.

### Target Mobile Layout (2 compact rows)

```
Row 1: [📅 Project Calendar]          [Month ▾] [+ Add]
Row 2: [<]  February 2026  [>]   [All Projects ▾]
        (weather hidden or collapsed on mobile)
```

- Title stays left, view selector + add button go right on **row 1**
- Navigation (prev/next/month picker) + project filter on **row 2**  
- Weather widget hidden on mobile (it's a nice-to-have, saves lots of space)

### Changes to `src/components/calendar/CalendarHeader.tsx`

**1. Restructure into mobile-specific two-row layout vs desktop single-row layout**

On mobile (below `sm:`):
- **Row 1**: Title left | View selector + Add button right (inline, compact)
- **Row 2**: Chevron + MonthYearPicker + Chevron + Project filter (all inline)
- Weather widget: hidden (`hidden sm:flex`) — too much space on mobile

On desktop (`sm:` and up): keep existing layout exactly as-is using `hidden sm:flex` wrappers

**2. Compact the Add button text on mobile**

The "+ Add Project Event" button is wide. On mobile show "+ Add" only (or keep the full text if it fits in the new layout — it will since it shares row 1 only with a small view selector).

### Technical Implementation

Wrap the entire header in a responsive structure:

```tsx
{/* Mobile layout */}
<div className="sm:hidden flex flex-col gap-2">
  {/* Row 1: Title + View selector + Add */}
  <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-1.5">
      <Calendar className="h-4 w-4 text-primary shrink-0" />
      <h1 className="text-sm font-bold text-foreground">Project Calendar</h1>
    </div>
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <Select value={view} onValueChange={...}>
        <SelectTrigger className="h-8 w-[90px] text-xs bg-card border-border">
          <SelectValue />
        </SelectTrigger>
        ...
      </Select>
      {onAddEvent}
    </div>
  </div>
  {/* Row 2: Nav + Project filter */}
  <div className="flex items-center gap-1.5">
    <Button variant="ghost" size="icon" onClick={handlePrev} className="h-7 w-7">
      <ChevronLeft className="h-3.5 w-3.5" />
    </Button>
    <MonthYearPicker currentDate={currentDate} onDateChange={onDateChange} labelClassName="text-sm min-w-[110px] text-center" />
    <Button variant="ghost" size="icon" onClick={handleNext} className="h-7 w-7">
      <ChevronRight className="h-3.5 w-3.5" />
    </Button>
    {onProjectFilterChange && projects.length > 0 && (
      <ProjectAutocomplete ... triggerClassName="h-8 flex-1 min-w-0 text-xs" />
    )}
  </div>
</div>

{/* Desktop layout (existing, unchanged) */}
<div className="hidden sm:flex flex-wrap items-center gap-4">
  ... existing code ...
</div>
```

**3. Remove duplicate view selector**

The existing code renders the mobile view selector (`sm:hidden Select`) inside the `flex flex-wrap` left section. In the new layout it moves to row 1 alongside the add button. The old one gets removed.

### Files to Modify

| File | Change |
|---|---|
| `src/components/calendar/CalendarHeader.tsx` | Restructure into mobile 2-row layout (hidden on desktop) + wrap existing layout in `hidden sm:flex`. Move view selector to mobile row 1. Hide weather widget on mobile. |

### Result

Before (mobile): ~280px header height, 5 stacked rows  
After (mobile): ~80px header height, 2 compact rows — calendar visible immediately
