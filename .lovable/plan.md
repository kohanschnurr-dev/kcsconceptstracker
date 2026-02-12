

## Show Both Start and Completed Dates on ProjectCard

### What Changes

For completed projects, the card currently shows only "Completed" date. Instead, it will show **both** the start date and the completed date, so you can see the full timeline at a glance.

### Technical Details

**File: `src/components/dashboard/ProjectCard.tsx`** (lines 144-150)

Replace the single date display with conditional logic:
- If the project has a `completedDate`, show two rows: "Start Date" with the start date, and "Completed" with the completed date.
- If no `completedDate`, show just "Start Date" as before.

```tsx
<div>
  <p className="text-xs text-muted-foreground">Start Date</p>
  <div className="flex items-center gap-1 text-sm">
    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
    <span>{formatDate(project.startDate)}</span>
  </div>
  {project.completedDate && (
    <>
      <p className="text-xs text-muted-foreground mt-2">Completed</p>
      <div className="flex items-center gap-1 text-sm">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{formatDate(project.completedDate)}</span>
      </div>
    </>
  )}
</div>
```

### Files Modified
- `src/components/dashboard/ProjectCard.tsx` -- show both start and completed dates for complete projects
