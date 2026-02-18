
## Add Delete & Edit to Daily Logs (with Confirmation)

### Where Logs Appear

Daily logs are rendered in two places:
1. **`src/pages/DailyLogs.tsx`** — the main "Daily Logs & Tasks" page, full log cards (lines 487–534)
2. **`src/pages/ProjectDetail.tsx`** — the "Logs" tab on each project detail page (lines 1252–1274)

Both need delete and edit support.

### What Gets Built

**Delete** — A trash icon button on each log card. Clicking it opens a confirmation `AlertDialog` ("Are you sure you want to delete this log? This cannot be undone."). Only on confirming does the DELETE hit the database.

**Edit** — A pencil icon button on each log card. Clicking it opens a `Dialog` with two textareas: "Work Performed" and "Issues Encountered" (both pre-filled with existing values). A "Save" button calls `UPDATE` on `daily_logs`. Date is shown but not editable (dates are reference data; editing them would corrupt log history).

### Changes — `src/pages/DailyLogs.tsx`

**New state:**
```ts
const [deleteLogId, setDeleteLogId] = useState<string | null>(null);
const [editLog, setEditLog] = useState<DailyLog | null>(null);
const [editWork, setEditWork] = useState('');
const [editIssues, setEditIssues] = useState('');
const [isSavingEdit, setIsSavingEdit] = useState(false);
```

**New handlers:**
```ts
const handleDeleteLog = async () => { /* DELETE from daily_logs */ };
const handleSaveEdit = async () => { /* UPDATE daily_logs */ };
```

**Each log card** — add a small icon row in the top-right (replacing the existing Issue badge area with a flex group):
```
[ 📅 Jan 31, 2026   Project Name ]   [  ✏  🗑  ]  [Issue badge if applicable]
```

Two icons: `Pencil` (edit) and `Trash2` (delete), both `ghost` size `icon` buttons.

**Add at the bottom of the tab** (or as portals):
- `AlertDialog` — fires when `deleteLogId` is set, confirmation text, "Delete" button calls `handleDeleteLog`
- `Dialog` — fires when `editLog` is set, two textareas, "Save Changes" button calls `handleSaveEdit`

### Changes — `src/pages/ProjectDetail.tsx`

Same approach applied to the smaller log cards in the project detail "Logs" tab (lines 1252–1274):

**New state** (alongside existing `dailyLogs` state — approx line 160):
```ts
const [deleteLogId, setDeleteLogId] = useState<string | null>(null);
const [editLog, setEditLog] = useState<...> | null>(null);
```

**New handlers** + same AlertDialog + Dialog components added inside the Logs TabsContent.

The project detail cards are simpler (no photo count, no project name since we're already in the project context) — same icon row pattern in top-right of each card.

### Imports to Add

Both files need:
```ts
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Pencil, Trash2 } from 'lucide-react'; // Trash2 already imported in DailyLogs.tsx
```

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/DailyLogs.tsx` | Add edit + delete state, handlers, icon buttons on log cards, AlertDialog + Edit Dialog |
| `src/pages/ProjectDetail.tsx` | Add edit + delete state, handlers, icon buttons on log cards, AlertDialog + Edit Dialog |

### Visual Result (each log card)

```
┌──────────────────────────────────────────────────────┐
│  📅 Jan 31, 2026   Roofing Project      [✏] [🗑]    │
│                                                       │
│  Work Performed:                                      │
│  Foundation & HVAC done, Roofing Started              │
└──────────────────────────────────────────────────────┘
```

Delete confirmation:
```
┌─────────────────────────────────┐
│  Delete Daily Log?              │
│  This cannot be undone.         │
│                                 │
│  [Cancel]  [Delete]             │
└─────────────────────────────────┘
```

Edit dialog:
```
┌─────────────────────────────────┐
│  Edit Log — Jan 31, 2026        │
│                                 │
│  Work Performed                 │
│  [Foundation & HVAC done…     ] │
│                                 │
│  Issues (optional)              │
│  [                            ] │
│                                 │
│  [Cancel]  [Save Changes]       │
└─────────────────────────────────┘
```
