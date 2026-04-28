# Persist Gantt collapsed state + reorder projects (synced)

## Two behaviors

1. **Collapsed state persists** — clicking the chevron on a project row stays collapsed across navigation/reloads, until clicked again. Currently lost on every reload because state lives in `useState`.
2. **Reorder projects** — small **up/down arrow buttons** appear on hover on each project header in the Gantt view. One click moves that project up or down by one slot. Order is preserved across sessions.

Both preferences sync **per-account** so they follow the user across devices.

## Backend — new table

Create `public.gantt_preferences` to store per-user UI state for the Gantt view.

```sql
CREATE TABLE public.gantt_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  project_order jsonb NOT NULL DEFAULT '[]'::jsonb,        -- ordered array of project names
  collapsed_projects jsonb NOT NULL DEFAULT '[]'::jsonb,   -- array of project names currently collapsed
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gantt_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own gantt preferences"
  ON public.gantt_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

We use **project names** as keys (not IDs) because `groupedTasks` already keys off `projectName`. Renaming a project resets its preference for that project — acceptable.

## Frontend — new hook `useGanttPreferences`

`src/hooks/useGanttPreferences.ts` — encapsulates load + persist:

- On mount: SELECT row for current user, fall back to defaults.
- Exposes `{ projectOrder, collapsedProjects, toggleCollapsed(name), moveProject(name, direction), isReady }`.
- All mutations: optimistic local update + debounced (~400 ms) `upsert` to Supabase. Toast on error only.

## Frontend — `src/components/calendar/GanttView.tsx`

### 1. Replace local `useState<Set<string>>` for collapsed
Pull `collapsedProjects` (as a Set, derived from the hook's array) and `toggleCollapsed` from `useGanttPreferences`. Remove the existing `useState` line. Adapt `toggleProject` to call the hook.

### 2. Apply ordering to the rendered project list
After computing `mergedTasksByProject`, sort entries by `projectOrder`:
- Projects in `projectOrder` come first in their saved order.
- Any project not yet in `projectOrder` (newly added) appears at the end in alphabetical order.
- This happens in a `useMemo` so render is cheap.

### 3. Add up/down arrow buttons to each project summary row
In the frozen-left cell of the project summary row (currently has only the collapse chevron + name + plus button), add two small icon buttons that appear on row hover (`opacity-0 group-hover:opacity-100`):

- `ChevronUp` — disabled if first project; calls `moveProject(name, 'up')`
- `ChevronDown` (different icon than the collapse chevron — use `ArrowUp` / `ArrowDown` from lucide to avoid confusion) — disabled if last project; calls `moveProject(name, 'down')`

Layout (frozen cell, left to right):
- Collapse caret
- Project name (flex-1, truncate)
- `[on hover]` Up arrow + Down arrow
- Plus button (existing)

Each arrow stops event propagation so it doesn't toggle collapse.

### 4. Reposition logic in the hook
`moveProject(name, dir)`:
- Build the current effective order (saved order + any unsaved trailing projects in alpha order, just like the render).
- Find name's index, swap with neighbor.
- Save the resulting array as the new `projectOrder`.

This avoids the bug where moving a brand-new project would lose previously-saved order.

## Edge cases

- **Empty preferences row** — first load creates the row lazily on first mutation via upsert. No backfill needed.
- **Project deleted/renamed** — stale entries in `projectOrder` and `collapsedProjects` are ignored at render time; we never error on them. Optionally trim them on next save to keep the JSON tidy (cheap one-liner).
- **Multiple tabs** — last write wins; debounce keeps it from thrashing. Realtime sync across tabs is not required for this preference.
- **Other Gantt views (project detail page)** — none currently use this component standalone with project ordering, so scoping the hook to the global Calendar Gantt is fine.

## Result
- Collapsed projects stay collapsed on reload and across devices.
- Each project row has hover-revealed up/down arrows for one-click reordering. The order persists per account, so the user's prioritized projects always sit at the top.
