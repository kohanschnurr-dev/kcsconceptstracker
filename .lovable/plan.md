

## Plan: Remove Today-Highlight Grey Boxes from Task Rows

The grey boxes appearing on Monday (today's column) in each task row are caused by the today-highlight `div` at lines 282–290 in `GanttView.tsx`. Each task row renders a `bg-primary/5` rectangle for today's column — this is what creates the grey outline effect.

### Fix — `src/components/calendar/GanttView.tsx`

**Delete lines 282–290** — remove the today-highlight from inside task rows entirely. The today column is already visually indicated by the bold date header; the per-row background highlight is unnecessary and creates visual clutter.

### Files
- `src/components/calendar/GanttView.tsx`

