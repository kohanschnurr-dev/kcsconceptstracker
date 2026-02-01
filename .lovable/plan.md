

## Plan: Require Explicit Project Selection for Pipeline Tasks

### Overview

Change the project dropdown behavior so it doesn't auto-select "Other (No Project)" by default. Users must explicitly choose a project or select "Other" before they can add a task to the pipeline.

---

### Current Behavior

- The project dropdown defaults to `'none'` which maps to "Other (No Project)"
- User types task → clicks "Add to Pipeline" → task is created with no project automatically

### New Behavior

- The project dropdown starts with no selection (placeholder shown: "Select project...")
- The "Add to Pipeline" button is disabled until a project is selected
- User must explicitly choose "Other (No Project)" or a specific project
- Once selected, the task can be added

---

### Technical Implementation

**File: `src/pages/DailyLogs.tsx`**

**1. Change initial state (line 71):**
```tsx
// BEFORE:
const [newTaskProjectId, setNewTaskProjectId] = useState<string>('none');

// AFTER:
const [newTaskProjectId, setNewTaskProjectId] = useState<string>('');
```

**2. Update form submission logic (line 242):**
```tsx
// BEFORE:
project_id: newTaskProjectId === 'none' ? null : newTaskProjectId,

// AFTER:
project_id: newTaskProjectId === 'none' || newTaskProjectId === '' ? null : newTaskProjectId,
```

**3. Reset state after creation (line 248):**
```tsx
// BEFORE:
setNewTaskProjectId('none');

// AFTER:
setNewTaskProjectId('');
```

**4. Update button disabled condition (lines 606-609):**
```tsx
// BEFORE:
disabled={!newTaskTitle.trim() || isCreating}

// AFTER (for Master Pipeline):
disabled={!newTaskTitle.trim() || isCreating || (checklistTab === 'master' && !newTaskProjectId)}
```

**5. Update Select placeholder (lines 594-596):**
```tsx
// BEFORE:
<SelectValue placeholder="Project (optional)" />

// AFTER:
<SelectValue placeholder="Select project..." />
```

---

### Changes Summary

| File | Changes |
|------|---------|
| `src/pages/DailyLogs.tsx` | Change default project state from `'none'` to `''`, update button disabled logic, update placeholder text |

---

### Result

- When in Master Pipeline view, the project dropdown shows "Select project..." by default
- The "Add to Pipeline" button is disabled until user selects a project (including "Other")
- Daily Sprint tasks are unaffected (they don't show the project dropdown)
- After adding a task, the dropdown resets to require selection again

