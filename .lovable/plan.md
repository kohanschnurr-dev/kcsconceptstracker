

## Plan: Gantt Chart Zoom Control

Currently the Gantt chart always shows 28 days (4 weeks) with fixed-width columns, making bars hard to read. Add a zoom slider that lets the user control how many days are visible (7–28), with the chart scrolling horizontally when zoomed in.

### Changes

**`src/components/calendar/GanttView.tsx`**

- Add a `zoomDays` state (default 28, range 7–28) controlling how many days are rendered
- Add a zoom toolbar row at the top with:
  - A `Slider` (from existing `ui/slider`) going from 7 to 28
  - Label showing current zoom level (e.g. "7 days" / "28 days")
  - Quick preset buttons: "1W" (7 days) and "4W" (28 days)
- Replace the hardcoded `28` with `zoomDays` everywhere (days array length, position calculations, drag logic)
- When `zoomDays < 28`, give each day column a minimum width (e.g. `minWidth: 80px`) so bars and labels are readable, and wrap the chart in a horizontally scrollable container (`overflow-x-auto`)
- When `zoomDays === 28`, keep current flex layout (no min-width, no scroll)
- The header row and body columns stay aligned via a shared `min-width` on each day cell
- Smooth scroll behavior on the container

### UI Details
- Zoom bar sits flush above the date header row, styled with `bg-secondary/50 rounded-lg p-2`
- Slider uses the existing `ui/slider` component, accent color matches primary
- "1W" and "4W" pill buttons use `variant="outline"` with active state highlighting
- At 7-day zoom, each column is wide enough to show the full task title inside the bar (not just the icon)
- Responsive: on mobile, the zoom bar stacks the slider below the preset buttons

### Files touched
- `src/components/calendar/GanttView.tsx` (only file)

