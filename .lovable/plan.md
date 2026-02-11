

## Per-Project-Type Detail Tab Ordering

### What it does
Adds a small gear icon next to the project detail tabs (Schedule, Tasks, Documents, Photos, Logs, Financials, Loan, Team, Info). Clicking it opens a popover with up/down arrows to reorder tabs. The order is saved per project type -- so reordering tabs on a Fix & Flip project only affects all Fix & Flip projects, not Rentals or New Builds.

### Changes

**1. New profile column: `detail_tab_order`**
- Add a `jsonb` column to the `profiles` table
- Stores a JSON object keyed by project type, e.g.:
```text
{
  "fix_flip": ["photos", "schedule", "tasks", ...],
  "rental": ["schedule", "tasks", "documents", ...]
}
```
- When no saved order exists for a project type, the current default is used

**2. Update `src/hooks/useProfile.ts`**
- Add the new column to the `Profile` interface
- Add an `updateDetailTabOrder` mutation that saves the per-type order
- Expose a helper: `getDetailTabOrder(projectType: string) => string[]`

**3. Update `src/pages/ProjectDetail.tsx`**
- Define the default tab order: `['schedule', 'tasks', 'documents', 'photos', 'logs', 'financials', 'loan', 'team', 'info']`
- Read the saved order from profile for the current project's `project_type`
- Render `TabsTrigger` items in the saved order (filtering out "loan" for rentals)
- Add a gear icon + Popover after the TabsList (same pattern as the Projects page reorder)
- The popover shows each tab with up/down arrow buttons
- On reorder, save via `updateDetailTabOrder` which writes to `detail_tab_order[project_type]`

### Technical Details

**Migration SQL:**
```text
ALTER TABLE public.profiles ADD COLUMN detail_tab_order jsonb DEFAULT NULL;
```

**File: `src/hooks/useProfile.ts`**
- Add `detail_tab_order: Record<string, string[]> | null` to Profile interface
- Add `updateDetailTabOrder` mutation that merges the new type order into the existing object
- Example update: reads current `detail_tab_order`, sets the key for the given project type, writes back

**File: `src/pages/ProjectDetail.tsx`**
- Import `Settings, ArrowUp, ArrowDown` icons, `Popover` components, `useProfile`, and `arrayMove` from dnd-kit
- Add state: `reorderOpen`, `localTabOrder`
- Compute effective tab order from profile or default, filtering "loan" for rentals
- Replace hardcoded `TabsTrigger` list with a `.map()` over the ordered array
- Add `TabsContent` blocks remain unchanged (they render by value, not position)
- Add gear Popover UI matching the existing Projects page pattern (compact rows with up/down buttons)
- On move: update local state + call `updateDetailTabOrder(projectType, newOrder)`
