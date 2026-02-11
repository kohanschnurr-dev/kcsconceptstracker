

## Move City/State Label Above the 5-Day Forecast

### Change

**File: `src/components/calendar/WeatherWidget.tsx`**

Restructure the widget layout from a single horizontal row to a vertical stack:

1. Change the outer container from horizontal `flex items-center` to vertical `flex flex-col` while keeping the same compact sizing (`px-2 py-1.5`).
2. Place the location label (e.g., "Fort Worth, TX") as a small text line at the top, always visible (remove the `hidden lg:block` class).
3. Place the 5-day forecast icons in a horizontal row below it.
4. No size increase -- the label is already small (`text-xs`), so stacking it above just shifts it from inline to above.

The result matches the reference image: city/state on top, forecast days in a row underneath, same compact box.

