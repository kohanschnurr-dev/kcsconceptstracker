
## Add Click-to-Edit Dialog on Pipeline Task Rows

### What the User Wants

Right now in the **Pipeline Tasks** card on a project page, task rows are only interactive via the checkbox (to mark complete). The user wants clicking anywhere on a task row to open a detail/edit dialog — mirroring the pattern used by Daily Log rows in the same project page, where clicking a row opens an edit dialog with full fields.

### Pattern Being Matched

In `ProjectDetail.tsx`, daily log rows work like this:
- Each row has edit (pencil) and delete (trash) icon buttons on the right
- Clicking the pencil sets `editLog` state, which opens a `<Dialog>` with editable fields
- There is also a separate `<AlertDialog>` for delete confirmation

The **Pipeline Tasks** card will use the exact same UX pattern.

---

### Changes to `src/components/project/ProjectTasks.tsx`

#### 1. Add new state variables
```tsx
const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
const [editTitle, setEditTitle] = useState('');
const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
const [editDueDate, setEditDueDate] = useState('');
const [editStatus, setEditStatus] = useState<TaskStatus>('pending');
const [isSaving, setIsSaving] = useState(false);
const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
```

#### 2. Add handlers
- `openEditDialog(task)` — sets all edit state and opens the dialog
- `handleSaveEdit()` — calls `supabase.from('tasks').update(...)`, refreshes list, closes dialog
- `handleDeleteTask()` — deletes via Supabase, removes from local state, closes confirm dialog

#### 3. Make each task row clickable (whole row)
Wrap the row `<div>` with `onClick={() => openEditDialog(task)}` and add `cursor-pointer` to the className. The checkbox will use `e.stopPropagation()` to prevent the row click firing when checking off.

#### 4. Add "Edit Task" Dialog (after `<AddTaskModal>`)
Fields:
- **Title** — `<Input>`
- **Priority** — `<Select>` (Low / Medium / High / Urgent)
- **Due Date** — date `<Input type="date">` (simple, matching the daily log dialog style)
- **Status** — `<Select>` (Pending / In Progress / Completed)
- Footer: **Delete** button (opens confirm) | **Cancel** | **Save Changes**

#### 5. Add Delete `<AlertDialog>`
Same pattern as `ProjectDetail.tsx` daily log delete confirmation.

---

### New Imports Needed

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { TASK_STATUS_LABELS } from '@/types/task';
```

---

### Visual Result

**Before** — task row, checkbox only interactive:
```
[ ] Tell Jose, Garage, Patio, Finishes...   Due Mar 3   [High] ⏱
```

**After** — entire row is clickable, clicking opens dialog:
```
[ ] Tell Jose, Garage, Patio, Finishes...   Due Mar 3   [High] ⏱
     ↑ clicking anywhere on row (except checkbox) opens:

┌─────────────────────────────────────┐
│ Edit Task                      [X]  │
│ ─────────────────────────────────── │
│ Title                               │
│ [Tell Jose, Garage, Patio...]       │
│                                     │
│ Priority           Status           │
│ [High ▾]          [Pending ▾]      │
│                                     │
│ Due Date                            │
│ [2025-03-03]                        │
│ ─────────────────────────────────── │
│ [🗑 Delete]     [Cancel] [Save]    │
└─────────────────────────────────────┘
```

---

### Files to Modify

| File | Change |
|---|---|
| `src/components/project/ProjectTasks.tsx` | Add click-to-edit behavior on rows, Edit Task dialog, Delete confirmation AlertDialog |

No new files, no database schema changes — tasks table already supports all required fields.
