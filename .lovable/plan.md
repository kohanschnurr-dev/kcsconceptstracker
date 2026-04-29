## Goal
Simplify the Gantt toolbar: remove the granular slider and the 30/60/90 buttons. Keep only **7d / 14d / 21d** as zoom presets (controlling day-cell width). The user pans backward/forward through time using the existing horizontal scrollbar, which will now span ±6 months around today (~365 days rendered).

## Changes — `src/components/calendar/GanttView.tsx`

1. **Toolbar (lines 277–295)**
   - Drop the `30, 60, 90` entries from the preset list — keep `[7, 14, 21]`.
   - Remove the `<Slider>` and the `"{zoomDays} days"` label.
   - Add a small "Today" button on the right that scrolls the chart so today's column is centered (uses `innerRef` parent's `scrollLeft`).
   - Default `zoomDays` stays `14`.

2. **Render a wide date range, not just `zoomDays` columns**
   - Introduce `PAN_RANGE_DAYS = 365` and `viewStart = startOfDay(addDays(today, -180))`.
   - `days` array length becomes `PAN_RANGE_DAYS` (independent of `zoomDays`).
   - `zoomDays` now only controls **day-cell width**:
     - 7d → ~110px/day (zoomed in)
     - 14d → ~76px/day
     - 21d → ~52px/day (zoomed out)
   - `CHART_MIN = FROZEN_W + COL_WIDTH * PAN_RANGE_DAYS` so the native horizontal scrollbar appears and pans across the full year.

3. **Update positioning math**
   - `getTaskPos` and dependency-arrow coords currently divide by `zoomDays`. Change to use `days.length` (the full rendered range) so bars land on the right column regardless of zoom.
   - Today red line: position by `todayIdx` over `days.length`.
   - Vertical gridlines: iterate `days` (already does) — fine.

4. **Auto-center on today (mount + when `currentDate` changes)**
   - In a `useEffect`, after layout, set the scroll container's `scrollLeft` so today's column sits ~30% from the left edge of the visible viewport (gives forward-looking context). Use a ref on the scroll container (the `overflow-x-auto` div).

5. **Performance**
   - 365 day cells × N task rows is fine (existing code already handles 90+). Day header cells are tiny divs; gridlines are absolute. No virtualization needed.

## Visual reference

```text
Before:  [🔍] (7) (14) (21) (30) (60) (90)  ──────●──── 58 days
After:   [🔍] (7) (14) (21)                              [Today]
         ◄═══════ horizontal scrollbar pans ±6 months ═══════►
```

## Files touched
- `src/components/calendar/GanttView.tsx` (toolbar, range constants, positioning math, auto-center effect, scroll container ref)

No DB, no other components affected.
