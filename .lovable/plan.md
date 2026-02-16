

## Push "Add Project Event" Button to the Right Edge

### Problem
After removing `justify-between` to close the dead space between controls, the "Add Project Event" button now sits right next to the view toggles instead of being anchored to the far right of the header.

### Solution

**File: `src/components/calendar/CalendarHeader.tsx`**

Split the view toggles and the Add button into separate elements. Keep the view toggles flowing naturally with the left controls, and add `ml-auto` to the Add button wrapper so it pushes to the far-right edge of the header.

1. Move the view toggles (Month/Week/Gantt) out of the right-section wrapper and into the left-section flex container (after the WeatherWidget), so they flow inline with the other controls.

2. Keep the Add button as its own element with `ml-auto` on the outer container to push it to the right edge.

Specifically:
- On the outer container (line 78), keep the current flex layout but add `flex-wrap` for safety.
- Move the view toggle group (`<div className="flex items-center gap-1 bg-secondary ...">`) inside the left-section flex container (after `WeatherWidgetWithCity`).
- Change the Add button wrapper to use `ml-auto flex-shrink-0` so it anchors right.

### Files Changed
- `src/components/calendar/CalendarHeader.tsx` (restructure flex children)
