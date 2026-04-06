

## Plan: Update Gantt Zoom Controls

**Changes to `src/components/calendar/GanttView.tsx`:**

1. **Default to 7 days** — Change `useState(28)` to `useState(7)` on line 70.

2. **Rename buttons from week labels to day labels** — Replace the three preset buttons:
   - `1W` → `7d` (7 days)
   - `2W` → `14d` (14 days)  
   - `4W` → `21d` (21 days, changed from 28)

3. **Update slider max** — Change the slider `max` from 28 to 21 to match the new 21d maximum.

4. **Update the `isZoomed` check** — Adjust the threshold from `< 28` to `< 21` (or remove it if no longer needed).

5. **Update the days label** — The text that shows `"{zoomDays} days"` (line ~201) stays as-is since it already dynamically shows the count.

