## Root Cause

The Gantt section dividers display "OTHER" instead of "Fix & Flip" / "New Construction" / "Rentals" because `projectType` is silently dropped from every calendar task before it reaches the Gantt.

In `src/pages/Calendar.tsx`, two separate Supabase queries fetch projects:

1. **Line 116–121** — fetches `id, name, address, project_type` for the projects list. Correct.
2. **Line 135–138** — fetches a second copy (`allProjectsData`) used at line 177 to look up the project for each calendar event:
   ```ts
   .select('id, name, total_budget')   // <-- project_type missing
   ```

Then at line 183, when building each `CalendarTask`:
```ts
projectType: (project as any)?.project_type ?? (project as any)?.projectType,
```
`project` here is from `allProjectsData`, which never contained `project_type` → every task gets `projectType: undefined` → `GanttView`'s `projectTypeMap` falls back to `'other'` for every project → all projects bucket under the "OTHER" header.

The DB confirms the underlying data is correct: every project has a real `project_type` (`fix_flip`, `rental`, or `new_construction`).

## Fix

One-line change in `src/pages/Calendar.tsx`, line 137: add `project_type` to the `allProjectsData` select:

```ts
const { data: allProjectsData } = await supabase
  .from('projects')
  .select('id, name, total_budget, project_type')
  .eq('user_id', user.id);
```

That's it. Once the field is included, line 183's existing `(project as any)?.project_type` resolves correctly, tasks carry the right `projectType`, and `GanttView` renders proper "Fix & Flip" / "New Construction" / "Rentals" section headers in the configured `TYPE_ORDER`.

## Files

- `src/pages/Calendar.tsx` — single select-clause edit on line 137. No other logic, types, or component changes.

## Verification

- Reload the Calendar page → switch to Gantt view.
- Section headers above project groups now read "FIX & FLIP", "NEW CONSTRUCTION", "RENTALS" (matching `TYPE_LABEL` in `GanttView.tsx`).
- "OTHER" only appears if a project genuinely has no `project_type` set in the DB.