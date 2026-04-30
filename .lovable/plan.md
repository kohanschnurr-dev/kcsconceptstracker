## Goal

Make multi-day calendar events feel "flawless" when moved: render them as continuous bars that span every day they cover, smooth out the drag motion, and give clear visual feedback about where they will land.

## Current problems

1. **Monthly + Weekly views**: A 3-day event renders as a single compact card inside its **start day cell only**. When dragged, only that cell-shaped card moves — there is no sense of the full duration moving with it. Other days the event covers show nothing.
2. **Drag motion**: `@dnd-kit` `PointerSensor` uses an 8px activation distance and only translates the source card. The `DragOverlay` ghost is a static `DealCard` with no date hint.
3. **Drop feedback**: Hovered day gets a subtle `ring-primary/50`, but only the single landing day highlights — not the full range the event will occupy after the drop.
4. **Toast covers the screen** during/after move (carryover from previous fix). Should be brief, positioned out of the way, and never appear over the chart while a drag is in flight.
5. **Gantt drag**: Uses native HTML5 drag (`onDragStart` / `onDrop`), which gives a browser-default ghost image and no live preview while dragging. Feels disconnected vs. the rest of the app.

## Plan

### 1. Spanning bars in Monthly view (`MonthlyView.tsx`)

Render multi-day events as **continuous horizontal bars** that visually cross day cells, similar to Google Calendar.

- Compute a per-week event layout: for each calendar week (7-day row), find every event whose range overlaps that week, clip its start/end to the week boundaries, assign a vertical "lane" so events don't overlap, and render each as an absolutely-positioned bar over the week's day cells.
- Day-number labels stay in their cells (top-left). Bars sit in a stacked area below the date numbers.
- Cap visible lanes at 3; remaining events become a "+N more" pill that opens the existing popover.
- Bars use the existing `DealCard` styling (category color, icon, title) but stretch full-width across the spanned days, with rounded ends only at the true start/end of the event (square ends where it continues into the next/previous week).
- Mobile (<sm): keep today's compact "N events" badge, but use the same week-bar logic so multi-day events at least show as 1-row colored stripes across cells.

### 2. Whole-bar drag in Monthly + Weekly (`MonthlyView.tsx`, `WeeklyView.tsx`)

- Make the **entire spanning bar** draggable, not just the start-cell card. The drag source becomes the bar element rendered at the week-row level.
- Capture the cursor's day-offset within the bar at drag start (e.g. grabbed on day 2 of a 5-day event → offset = 2). On drop, place the bar so the same day under the cursor anchors the new start: `newStart = dropDay - offset`.
- Update the `DragOverlay` ghost to render a slim pill showing the event title and the **new date range** ("May 4 – May 6") so users see exactly where it will land while dragging.
- Lower `PointerSensor` activation distance from 8px to 4px and add a 120ms delay tolerance so single clicks still open the detail panel cleanly but drags start crisply.

### 3. Range-preview drop feedback

While a drag is active:
- Compute the would-be range from the currently-hovered day + grab offset + event duration.
- Highlight **every day cell in that range** with a soft `bg-primary/10` + `ring-1 ring-primary/40`, not just the landing day.
- Highlight is updated via the `onDragOver` callback in `DndContext`.

### 4. Smoother Gantt drag (`GanttView.tsx`)

- Replace native HTML5 drag with `@dnd-kit` (same library used elsewhere) so the bar follows the cursor pixel-perfectly with a translucent overlay.
- Preserve the existing grab-offset logic (cursor grabs day 3 of a 7-day bar → bar moves so day 3 stays under the cursor).
- Add a vertical guide line that follows the cursor across the timeline header during drag, with a tooltip showing the candidate new start date.
- Snap to day columns (already implicit via `COL_W`), but visualize the snap with a 100ms CSS transition on the bar's left position when the drop completes.

### 5. Toast placement

- Move the "Event Updated" toast to bottom-right, set `duration` to 1500ms, and ensure z-index keeps it below open popovers/panels. Skip the toast entirely if the move was a no-op (same start date).

### 6. No regressions

- Click-to-open behavior on cards/bars must still work (small movement threshold + distinguishing click vs. drag).
- Day double-click → quick-create flow stays intact (drag must not steal the double-click).
- Linked-task date sync (`syncLinkedTaskDate`) continues to fire on every successful move.
- Recurring/repeating bars in Gantt (the merged-row instances) keep their per-instance drag identity.

## Technical details

**Files to edit**

- `src/components/calendar/MonthlyView.tsx` — week-row layout engine + spanning bars + range preview.
- `src/components/calendar/WeeklyView.tsx` — apply spanning bar pattern across the 7 day columns.
- `src/components/calendar/GanttView.tsx` — switch drag from native HTML5 to `@dnd-kit`, add cursor guide + date tooltip.
- `src/components/calendar/DealCard.tsx` — add a `bar` variant (slim, full-width, optional rounded-only-at-ends).
- `src/pages/Calendar.tsx` — adjust `handleTaskMove` toast (duration, position, no-op skip).
- (Possibly) `src/components/ui/toast.tsx` — confirm bottom-right viewport positioning if not already.

**Lane-packing helper** (new util `src/lib/calendarLaneLayout.ts`): given a list of `{startDate, endDate}` events and a week's `[start, end]`, returns `{ event, lane, startCol, endCol }[]`. Greedy first-fit by start date, max 3 lanes returned + an `overflow` array for "+N more".

**Drag offset state** stored in a ref on each view (`grabOffsetRef`), set on `onDragStart`, applied in `onDragEnd` and used to compute the live range-preview during `onDragOver`.

**Week row height**: switch monthly day cells from a fixed `min-h-[140px]` to `min-h-[150px]` to fit 3 lane bars (~22px each) plus the date label and "+N more" row.

## Out of scope

- Drag-to-resize bar ends (extending duration by dragging an edge). Can be a follow-up if you want it.
- Cross-week drag that lands on the same weekday but different week — already supported by the offset logic, but no special "snap to same weekday" affordance.
