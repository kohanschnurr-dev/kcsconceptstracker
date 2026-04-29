## Change

Reverse the Gantt task row order so the **newest tasks appear at the top** and the **oldest at the bottom** of each project group. This way users see current/upcoming work without scrolling.

## Edit

**`src/components/calendar/GanttView.tsx`** — `mergedTasksByProject` (lines 150–153):

After grouping merged rows per project, sort by the row's earliest instance `startDate` **descending**:

```ts
out[projectName] = Array.from(buckets.values())
  .map(r => ({
    ...r,
    instances: [...r.instances].sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate)),
  }))
  // Newest first, oldest last
  .sort((a, b) => +new Date(b.instances[0].startDate) - +new Date(a.instances[0].startDate));
```

Project order, dependency arrows, and row Y math all derive from this list, so they update automatically.
