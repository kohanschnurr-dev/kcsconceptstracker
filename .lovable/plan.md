

## Fix Subtasks: Proper Checklist UI in Edit Task Dialogs

### Problem
When a task has subtasks, the Edit Task dialog shows the raw delimiter text `---LINE_ITEMS---` and JSON array `["GFCI Outlets","Concrete Spot"]` inside the description field. Users see ugly raw data instead of a usable checklist.

### Solution
Create a shared helper to parse/serialize the `---LINE_ITEMS---` format, then update both Edit Task dialogs to split description from subtasks, rendering subtasks as an editable checklist with add/remove capabilities.

### Changes

**1. New utility: `src/lib/taskSubtasks.ts`**

A small helper with two functions:
- `parseDescription(raw: string)` -- returns `{ description: string, subtasks: string[] }`
- `serializeDescription(description: string, subtasks: string[])` -- recombines into the stored format

**2. Update `src/pages/DailyLogs.tsx`**

- Import the parse/serialize helpers
- Add `editSubtasks` state (string array) alongside `editForm`
- In `openDetailModal`: parse `task.description` to split description text and subtasks into separate state
- In `handleSaveDetail`: serialize description + subtasks back before saving
- In the Edit Task dialog UI: replace the single description `Textarea` with:
  - A `Textarea` for just the description text
  - A "Subtasks" section below with checklist inputs (same pattern as `AddTaskDialog`)
  - Each subtask gets an input + remove button
  - An "Add Subtask" button at the bottom

**3. Update `src/components/command-center/CommandCenter.tsx`**

- Same pattern: parse on open, serialize on save, render subtask checklist UI in the edit dialog

### UI Pattern (matching AddTaskDialog)
```
Subtasks (optional)
[ GFCI Outlets                    ] [X]
[ Concrete Spot                   ] [X]
[+ Add Subtask                       ]
```

Each subtask is an `Input` with a remove button, plus an "Add Subtask" button -- identical to the create flow.

### Files Changed
- `src/lib/taskSubtasks.ts` (new)
- `src/pages/DailyLogs.tsx`
- `src/components/command-center/CommandCenter.tsx`
