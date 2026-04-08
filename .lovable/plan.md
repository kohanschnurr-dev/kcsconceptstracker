

## Fix: Clicking an event should open detail panel, not "New Event" modal

### Problem
The day cell `<div>` (line 218) has an `onClick` that always opens the "New Project Event" modal. When clicking on an existing event (`DealCard`), the click bubbles up to the day cell, triggering both the detail panel AND the new event modal.

### Fix

**File: `src/components/project/ProjectCalendar.tsx`**

1. In the `DealCard` `onClick` handlers (lines 258-261 and 276-279), add `e.stopPropagation()` to prevent the click from bubbling up to the day cell.

2. Similarly, add `e.stopPropagation()` to the "expand" button (line 284) and the day number button (line 223) to prevent those from also opening the modal.

This ensures:
- Clicking empty space on a day → opens New Event modal (existing behavior)
- Clicking an existing event → opens detail panel only (fixed)
- Clicking "+N more" → expands list only (fixed)

