## Bug
After expanding the new 365-day pan range, the Gantt chart breaks visually:

1. **Task labels disappear from the frozen left column** (only the floating diamonds/bars remain). Confirmed via DOM extract — the labels exist but are invisible.
2. **Type-group section headers ("Fix & Flip", "Rentals", etc.) don't render visibly** even though projects span multiple types.

## Root cause

In `src/components/calendar/GanttView.tsx` at line 567, task rows are wrapped in:
```tsx
{!collapsed && (
  <div className="overflow-hidden">
    {rows.map(...)}
  </div>
)}
```

`overflow-hidden` creates a new scroll/clip context. When a `position: sticky` element (the task-row frozen left column at line 580–583) lives inside an `overflow-hidden` ancestor, the browser **anchors sticky to that ancestor**, not to the outer `overflow-x-auto` scroll container. With the chart now ~28,000px wide and the user scrolled to today (~middle), the task labels stick to position 0 of their inner container — which is far off-screen to the left. Result: invisible labels.

This wasn't visible before my pan-range change because the chart fit in the viewport (no horizontal scroll → no broken sticky observable).

The type-group header at line 488 has its own visibility issue: `bg-background` + `text-muted-foreground/70` text on a near-white background renders effectively invisible. Width is also only 192px (frozen-column wide), so it looks like a thin empty strip.

## Fix

### 1. Remove the broken `overflow-hidden` wrapper (line 567)
Replace `<div className="overflow-hidden">` with a plain `<div>`. Collapse already toggles via `{!collapsed && ...}`, so the wrapper has no real purpose besides clipping (which is what's breaking sticky).

### 2. Make type-group section headers visibly distinct
Update the section header (lines 488–500) to:
- Span the full chart width (not just the frozen 192px) so the divider line reads across the whole timeline.
- Use `bg-secondary/40` + a top border for a clearly visible band.
- Make the label `text-foreground/80` (was `text-muted-foreground/70`) and `text-[11px]` for legibility.
- Keep label inside a `sticky left-0` inner div so it stays pinned at the left while horizontally scrolling.

```tsx
{showHeader && (
  <div
    className="flex items-center bg-secondary/40 border-y border-border"
    style={{ height: TYPE_HEADER_H }}
  >
    <div
      className="sticky left-0 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/80 bg-secondary/40"
      style={{ minWidth: FROZEN_W, height: TYPE_HEADER_H, lineHeight: `${TYPE_HEADER_H}px` }}
    >
      {TYPE_LABEL[currType] ?? 'Other'}
    </div>
  </div>
)}
```

The outer flex element (no explicit width) inside the chart's `minWidth: CHART_MIN` parent will naturally stretch to that minWidth, drawing the band edge-to-edge.

## Files touched
- `src/components/calendar/GanttView.tsx` only (two small edits)

No DB or other components affected. After this, scrolling horizontally should keep both project-summary and task-row labels pinned to the left, and the type-group headers should clearly delineate Fix & Flip / New Construction / Rentals.
