## Goal
Add subtle section headers in the Gantt chart's project list that group projects by type: **Fix & Flip**, **New Construction**, **Rentals** (and "Other" fallback). Headers visually break up the project rows so users can scan by portfolio category.

## Changes — `src/components/calendar/GanttView.tsx`

### 1. Build a project-type map (after `mergedTasksByProject`, ~line 178)
```ts
const projectTypeMap = useMemo(() => {
  const m: Record<string, string> = {};
  tasks.forEach(t => {
    if (!m[t.projectName]) m[t.projectName] = (t.projectType as string) || 'other';
  });
  return m;
}, [tasks]);

const TYPE_ORDER = ['fix_flip', 'new_construction', 'rental', 'other'];
const TYPE_LABEL = {
  fix_flip: 'Fix & Flip',
  new_construction: 'New Construction',
  rental: 'Rentals',
  other: 'Other',
};
```

### 2. Group `orderedProjectNames` by type (replace existing memo, ~lines 182–187)
Keep user's saved order **within** each type group; types appear in canonical `TYPE_ORDER`. Stable sort so manual reorder still works inside a group.

### 3. Inject section header rows in the render loop (~line 436)
Track `prevType` while iterating `orderedProjectEntries`. When the current project's type differs from `prevType`, emit a header row **before** the project's summary row:

```tsx
{currType !== prevType && (
  <div
    className="flex items-center sticky left-0 z-20 bg-background border-b border-border/40"
    style={{ height: 26 }}
  >
    <div className="px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
      {TYPE_LABEL[currType] ?? 'Other'}
    </div>
  </div>
)}
```

Visual treatment:
- Slim 26px row, no border on top, hairline bottom border
- 10px uppercase letterspaced label in `text-muted-foreground/70` (subtle, non-competing with project names)
- Spans full chart width but content sticks to left frozen area
- No icons, no background fill — purely typographic divider per the project's minimal aesthetic

### 4. Account for header height in `totalBodyH`
Add `26 * (number of distinct type groups present)` to the existing height calculation so the body container reserves space and gridlines/today-line still extend full height.

## Files touched
- `src/components/calendar/GanttView.tsx` only

No DB changes, no new components. The existing `projectType` field on `CalendarTask` is already populated from `src/pages/Calendar.tsx`.
