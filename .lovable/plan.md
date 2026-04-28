## Goal

The Gantt currently caps the visible window at 21 days, so users can't see events further out (or far behind) without paging week-by-week with the `<` `>` arrows. Extend the zoom range so users can scroll back and forward to the furthest events, while keeping the default landing view at today.

## Changes

**File: `src/components/calendar/GanttView.tsx`**

1. **Expand zoom presets** from `[7, 14, 21]` → `[7, 14, 21, 30, 60, 90]`. These pill buttons stay in the toolbar and let users jump to common ranges.
2. **Raise slider max** from 21 → 180 (six months). Min stays 7. Step stays 1.
3. **Default `zoomDays`** stays at its current value (14d) so initial render is unchanged.
4. **No change to `currentDate` defaulting** — Gantt continues to open at today via the page-level state. Existing `<` `>` arrows in `CalendarHeader` already step by week and have no clamp, so extending zoom is the only change needed.

## Why this satisfies the request

- "Starting at the current date" → preserved (default `currentDate = new Date()`, default zoom = 14d).
- "Scroll further back and forward" → users can now zoom out to 30/60/90/180-day windows (or fine-tune via the slider) to see distant past or future events on one screen, and the existing prev/next arrows still page through time.

## Out of scope

No backend changes, no changes to the bar/diamond rendering, no changes to drag-drop logic (already clamps within `zoomDays`).
