## Problem

In the Gantt view's frozen left column (project / task names), the project summary row and individual event rows use semi-transparent backgrounds. This lets the timeline's vertical gridlines and the red "today" indicator bleed visually through the name column, producing the grey/red lines crossing through "534 St John…", "718 Chaparr…", and the task labels in the screenshot.

Current backgrounds (in `src/components/calendar/GanttView.tsx`):

- **Project summary row outer** (line 502): `bg-secondary/25` — 25% opacity
- **Project summary frozen-left cell** (line 505): `bg-secondary/50` — 50% opacity
- **Task row outer** (line 576): no background — fully transparent
- **Task row frozen-left cell** (line 581): `bg-background/95` — 95% opacity (still transparent)

Because the frozen left cells use `position: sticky`, anything painted underneath them in the scrolling timeline (gridlines, today line, bars from other rows) shows through.

## Fix

Make the frozen left column fully opaque on every row type. The timeline area on the right keeps its current transparency so gridlines remain visible there (that's correct Gantt behavior).

In `src/components/calendar/GanttView.tsx`:

1. **Project summary frozen-left cell** (line 505): `bg-secondary/50` → `bg-secondary` (solid).
2. **Project summary outer row** (line 502): `bg-secondary/25` → keep transparent on the timeline side. Leave the outer row class as-is — only the frozen cell needs to be opaque, since gridlines should still be visible behind the project span chevron.
3. **Task row frozen-left cell** (line 581): `bg-background/95` → `bg-background` (solid).

That's all that's needed — the timeline portion of each row stays transparent so date gridlines and the today indicator remain visible across bars, but the name column on the left becomes a solid, clean panel with nothing bleeding through.

### Resulting snippets

```tsx
// Project summary frozen-left (line 505)
className="shrink-0 sticky left-0 z-10 bg-secondary border-r border-border flex items-center gap-1 px-2"

// Task row frozen-left (line 581)
className="shrink-0 sticky left-0 z-10 bg-background border-r border-border/40 flex items-center gap-1.5 px-3"
```

## Files

- `src/components/calendar/GanttView.tsx` — two className opacity changes (lines 505 and 581). No layout, sizing, or logic changes.

## Verification

- Frozen left column (project + task names) is a clean, solid panel.
- No vertical gridlines, no red today line, and no bar shadows show through any name row.
- Gridlines and the today indicator still display correctly across the timeline area to the right.
- Section headers, chevrons, hover buttons, and bars are unchanged.