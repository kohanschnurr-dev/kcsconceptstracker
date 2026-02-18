
## Two Changes: Remove autoFocus + Add Photo Attachment to Tasks

### Change 1 — Remove `autoFocus` from Add Task Modal

**The problem:** `autoFocus` on the Title input fires immediately when the modal opens, triggering the mobile keyboard before the user has oriented themselves on the screen.

**The fix:** Remove `autoFocus` from the `<Input>` in `src/components/project/AddTaskModal.tsx` (line 94). The field is still tappable — users just tap into it when ready. No other change needed.

---

### Change 2 — Photo Attachment on Tasks (hidden until you drill in)

**Design philosophy:** Photos do NOT appear on the task row list or the Daily Log card. They are only visible and manageable inside the task detail/edit dialog — exactly as requested.

#### Step A — Database migration

The `tasks` table has no `photo_urls` column. We need to add one:

```sql
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}';
```

No RLS changes needed — photos live on the task row, protected by existing task RLS policies.

#### Step B — Update the Task types

Add `photoUrls: string[]` to the `Task` interface in `src/types/task.ts` so TypeScript knows about the new field.

#### Step C — Update data fetching

In `src/pages/DailyLogs.tsx`, the task fetch query (`select('*, projects(name)')`) already fetches all columns, so `photo_urls` will come back automatically. Map `t.photo_urls` → `photoUrls` in the transform.

In `src/components/project/ProjectTasks.tsx`, the fetch is `select('id, title, status, priority_level, due_date')` — an explicit column list. Add `photo_urls` to it and map it.

#### Step D — Add photo upload UI inside the Task Detail modals only

There are TWO places where tasks are edited in a detail dialog:

**1. `src/pages/DailyLogs.tsx` — Task Detail Modal (lines 1086–1171)**

Inside the dialog, after the existing fields (Title, Description, Priority, Status, Due Date), add a "Photos" section:

```tsx
<div className="space-y-2">
  <Label className="flex items-center gap-2">
    <Camera className="h-4 w-4" />
    Photos
  </Label>
  <PasteableTextarea
    value=""  // photos only, no text
    onChange={() => {}}
    bucketName="project-photos"
    folderPath="task-photos"
    uploadedImages={editForm.photoUrls}
    onImagesChange={(imgs) => setEditForm({ ...editForm, photoUrls: imgs })}
    placeholder=""
  />
</div>
```

Actually — since we only want the image upload/preview part (not a textarea), we'll use a lightweight inline uploader: a camera icon button that opens a hidden `<input type="file" accept="image/*">`, an inline thumbnail strip showing attached photos, and paste-to-upload support. This is simpler and takes less space than a full PasteableTextarea.

The section inside the detail dialog will look like:
- Label: `📷 Photos (optional)`
- A row of existing photo thumbnails (each tapable to remove)
- A small "+ Attach Photo" button (triggers file picker)
- Paste support on the dialog itself

When saved (`handleSaveDetail` / `handleSaveEdit`), include `photo_urls: editForm.photoUrls` in the Supabase update.

**2. `src/components/project/ProjectTasks.tsx` — Edit Task Dialog (lines 256–330)**

Same photo section added inside the dialog, same behavior.

#### Step E — Update AddTaskModal (no photos on create)

We do NOT add photo upload to the Add Task Modal. The `autoFocus` removal is the only change there. Photos can be attached after creation via the edit dialog — this keeps the "Add Task" flow fast and keyboard-friendly.

---

### What the user will see

- **Task list rows** — No change. No photo indicators. Clean and compact as before.
- **Daily Log cards** — No change. Photo count badge still shows for logs (as today), but task photos are never surfaced there.
- **Task detail dialog** — After tapping a task row to edit it, a "Photos" section appears at the bottom with thumbnails and an attach button. This is the ONLY place photos are visible.

---

### Files to Change

| File | Change |
|---|---|
| DB migration | `ALTER TABLE tasks ADD COLUMN photo_urls text[] DEFAULT '{}'` |
| `src/types/task.ts` | Add `photoUrls: string[]` to Task interface |
| `src/components/project/AddTaskModal.tsx` | Remove `autoFocus` from Input |
| `src/pages/DailyLogs.tsx` | Map `photo_urls` in fetch transform; add photo section to Task Detail modal; import Camera icon |
| `src/components/project/ProjectTasks.tsx` | Add `photo_urls` to fetch query; map it; add photo section to Edit Task dialog |
