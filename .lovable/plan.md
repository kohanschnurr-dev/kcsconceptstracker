# Add Gantt view toggle to project-specific calendar

## Goal
On the project's **Schedule** tab, let the user switch between the existing month grid and the Gantt timeline — the same Gantt component used on the global Calendar page — without leaving the project.

## Changes

### `src/components/project/ProjectCalendar.tsx`

**1. Add view toggle state**
```ts
const [view, setView] = useState<'calendar' | 'gantt'>('calendar');
```

**2. Header — add segmented toggle**
Place a small two-button segmented control to the left of the month nav (or inline next to the title), styled to match the app: 1px border, sharp corners, semantic tokens.

```
[ ▦ Calendar | ▭ Gantt ]
```
- `LayoutGrid` icon for Calendar, `BarChart3` icon for Gantt (lucide).
- Active button uses `bg-primary text-primary-foreground`; inactive uses `bg-secondary text-muted-foreground`.

**3. Conditional render**
Wrap the existing `DndContext` + grid + legend in `{view === 'calendar' && (...)}`.

Add a sibling `{view === 'gantt' && (...)}` that renders:
```tsx
<GanttView
  currentDate={currentDate}
  tasks={tasks}                       // already project-scoped
  onTaskClick={(task) => { setSelectedTask(task); setPanelOpen(true); }}
  onTaskMove={async (taskId, newStart, newEnd) => {
    // Persist to supabase like handleDragEnd does, then update local state
  }}
  onAddEvent={() => setQuickCreateOpen(true)}
/>
```

Extract the move-persist logic from `handleDragEnd` into a small helper `persistTaskMove(taskId, newStart, newEnd)` so both the dnd-kit drag handler and the Gantt drag handler share it.

**4. Hide month nav + legend when in Gantt view**
The Gantt has its own zoom slider and navigates via the parent `currentDate` (week-based), so:
- Keep the Prev/Next + MonthYearPicker visible (they still set `currentDate` which Gantt respects).
- Hide the bottom `CalendarLegend` block when in Gantt view (Gantt's own legend area covers it) — or leave it; it's harmless. Recommendation: keep it.

**5. Imports**
Add `GanttView` from `@/components/calendar/GanttView` and `BarChart3`, `LayoutGrid` from `lucide-react`.

## Notes
- `tasks` is already filtered to the current project, so the Gantt will show a single project group — exactly what the user wants for in-project context.
- Reuses the global `useGanttPreferences` hook for collapsed/order state; with a single project that has no real effect but stays consistent.
- No database changes needed.
