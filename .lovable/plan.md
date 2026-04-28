## Change

Rename the diamond marker label from **"Milestone"** to **"Key Event"** in the calendar legend.

## File

- `src/components/calendar/CalendarLegend.tsx` — line 15, change the legend text next to the rotated diamond swatch.

That's the only spot where "Milestone" appears as the diamond's display label. The category group is still called "Milestones" (used in many event categorizations like Sale Closing, Refinancing, etc.) and stays unchanged — only the diamond marker's legend label is updated.
