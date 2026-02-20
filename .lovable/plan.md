

## Merge Calendar Header into a Single Row

### What Changes

Currently the Project Schedule header has two rows:
- Row 1: "Project Schedule" icon + info icon ... "Add Project Event" button
- Row 2: Month navigation (chevrons + "February 2026")

This creates dead vertical space. All elements will be merged into a single row:

**Left**: Calendar icon + "Project Schedule" + info icon
**Center**: Prev chevron + "February 2026" + Next chevron
**Right**: "+ Add Project Event" button

### Technical Details

**`src/components/project/ProjectCalendar.tsx`**

Replace the current two-row layout in `CardHeader` (Row 1 title+button div and Row 2 month nav div) with a single flex row:

```
<div className="flex items-center justify-between">
  <!-- Left: title + info icon -->
  <!-- Center: month nav (absolute or flex-1 centered) -->
  <!-- Right: Add button -->
</div>
```

- Use `flex-1 justify-center` on the middle section so the month picker stays centered
- Left and right sections get fixed widths to balance the layout
- Remove `space-y-2` from CardHeader since there's only one row now
- On mobile, the single row may wrap slightly but the elements are compact enough to fit

