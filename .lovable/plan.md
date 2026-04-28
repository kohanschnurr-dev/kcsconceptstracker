## Goal

Order projects in the Gantt chart according to the user's saved project-type tab order from the Projects page (e.g., New Construction → Fix & Flips → Rentals if that's how they arranged it), instead of the current hardcoded `new_construction → fix_flip → rental` ordering.

## Source of truth

`useProfile()` exposes `profile.project_tab_order: string[] | null`, which the Projects page already reads/writes when the user reorders their tabs. We reuse the same value here.

## Changes

**File: `src/pages/Calendar.tsx`**

1. Import `useProfile` from `@/hooks/useProfile`.
2. Add a constant `DEFAULT_PROJECT_TYPE_ORDER = ['fix_flip', 'new_construction', 'rental']` (matches `Projects.tsx`).
3. Inside the `Calendar` component, call `const { profile } = useProfile();`.
4. Compute the effective order:
   ```ts
   const projectTypeOrder = useMemo(() => {
     const saved = (profile?.project_tab_order as string[] | null) ?? [];
     const merged = [...saved];
     for (const t of DEFAULT_PROJECT_TYPE_ORDER) if (!merged.includes(t)) merged.push(t);
     return merged;
   }, [profile?.project_tab_order]);
   ```
5. Replace the hardcoded `order = { new_construction: 0, fix_flip: 1, rental: 2 }` block in `fetchData` with a sort that uses `projectTypeOrder.indexOf(projectType)` (unknown types fall to the end).
6. Move the project-type sort out of `fetchData` and into a `useMemo` so it re-runs when `profile.project_tab_order` changes after fetch. Source list: the raw mapped projects stored in state; resorted whenever `projectTypeOrder` updates.

## Why this works

The Projects page persists user reordering to `profiles.project_tab_order`. By reading the same field in Calendar, the Gantt section ordering automatically tracks the user's preferred order across the app, with a stable fallback when the field is empty.

## Out of scope

No DB migration, no changes to `GanttView.tsx`, no changes to project-name ordering within a type (current `created_at desc` preserved).
