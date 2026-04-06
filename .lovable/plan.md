

## Plan: Fix "No Projects Found" in Calendar Modal from Add Task

**Root Causes** (two bugs):

1. **Projects invisible in dropdown**: `AddTaskModal` passes the project as `{ id, name, address: '' }` with no `status` or `projectType`. The `ProjectAutocomplete` component groups projects by `projectType` (`fix_flip` / `rental`), so projects without a type are silently dropped — showing "No projects found."

2. **Project not pre-selected**: The `useEffect` in `NewEventModal` (line 73-83) sets `title` and `startDate` when opened externally, but never updates `projectId` from the `defaultProjectId` prop.

### Changes

#### 1. `src/components/project/AddTaskModal.tsx` — Fetch full project data
Instead of passing a manually constructed project object with missing fields, query the actual project data from the database (or use the existing props more completely). The simplest fix: use `useProjectOptions()` to get the full project list with `status` and `projectType` fields, and pass that to `NewEventModal`.

- Replace `projects={[{ id: projectId, name: projectName, address: '' }]}` with the full project list from `useProjectOptions()`
- Import `useProjectOptions` hook

#### 2. `src/components/calendar/NewEventModal.tsx` — Pre-select project on external open
Add `defaultProjectId` to the `useEffect` that fires when `externalOpen` becomes true:

```typescript
useEffect(() => {
  if (externalOpen) {
    if (defaultStartDate) { setStartDate(defaultStartDate); setEndDate(defaultStartDate); }
    if (defaultTitle) { setTitle(defaultTitle); }
    if (defaultProjectId) { setProjectId(defaultProjectId); } // ADD THIS
  }
}, [externalOpen, defaultStartDate, defaultTitle, defaultProjectId]);
```

### Files
- `src/components/project/AddTaskModal.tsx` (1 import + 1 line change)
- `src/components/calendar/NewEventModal.tsx` (1 line addition in useEffect)

