

## Plan: Modern Drag-and-Drop with Nested Folders

### Overview
Upgrade the documents gallery to support:
1. Dragging documents directly onto folder cards (not just chips)
2. Making folders draggable so they can be moved into other folders
3. Nested folder hierarchy (folders inside folders)

---

### Database Changes

**Add `parent_id` column to `document_folders`:**

```sql
ALTER TABLE public.document_folders
ADD COLUMN parent_id UUID REFERENCES public.document_folders(id) ON DELETE SET NULL;
```

This enables the folder hierarchy - when a folder is deleted, child folders become root-level.

---

### Component Changes

**1. Create `DraggableDroppableFolder.tsx`** (new component)

A folder that is both draggable (can be picked up) AND droppable (can receive documents/folders):

```text
┌─────────────────────┐
│     📁 Folder       │  ← Can drag this into another folder
│    "Warranties"     │  ← Can drop documents/folders onto it
│     3 items         │
└─────────────────────┘
```

Key implementation:
- Uses both `useDraggable` and `useDroppable` from dnd-kit
- Applies drag listeners to the whole card (8px activation constraint)
- Shows visual feedback when something is hovering over it
- Prevents dropping a folder into itself

**2. Update `DocumentsGallery.tsx`**

- Add `activeDragType` state to track whether dragging a document or folder
- Update `handleDragEnd` to handle folder moves:
  - Folder dropped on another folder → Update `parent_id`
  - Folder dropped on root → Set `parent_id` to null
- Update navigation to support breadcrumb trail
- Replace `DroppableFolder` with `DraggableDroppableFolder`

**3. Update `FolderTargetBar.tsx`**

- Filter out the currently dragged folder from targets
- Show parent folder as a target when inside nested folder
- Prevent circular references (can't drop folder into its own child)

**4. Add Breadcrumb Navigation**

When inside a nested folder, show a breadcrumb trail:

```text
Documents > Warranties > Foundation  [Back]
```

---

### Updated Folder Interface

```typescript
interface DocumentFolder {
  id: string;
  project_id: string;
  name: string;
  color: string | null;
  parent_id: string | null;  // NEW
  created_at: string;
  updated_at: string;
}
```

---

### Drag-and-Drop Logic

**`handleDragEnd` updated flow:**

```text
1. Get active item (document or folder)
2. Get drop target (folder, root, or nothing)
3. Validate:
   - Can't drop folder into itself
   - Can't drop folder into its own descendant
4. Update database:
   - Document → folder: Update document.folder_id
   - Folder → folder: Update folder.parent_id
   - Either → root: Set folder_id/parent_id to null
5. Refresh data
```

---

### Visual Improvements for Modern Feel

**Drag Overlay:**
- Smooth transform with `transition: transform 0.15s ease`
- Subtle shadow elevation when lifted
- Slight rotation (3deg) to indicate movement

**Drop Zones:**
- Scale up slightly (105%) when hovered
- Ring highlight with primary color
- Smooth fade-in for target indicators

**Folder Cards:**
- Cursor changes to `grab` on hover, `grabbing` while dragging
- Subtle bounce animation when item is dropped

---

### Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| Database migration | Create | Add `parent_id` column to `document_folders` |
| `DraggableDroppableFolder.tsx` | Create | Combined draggable + droppable folder component |
| `DocumentsGallery.tsx` | Modify | Handle folder dragging, breadcrumbs, updated drag logic |
| `FolderTargetBar.tsx` | Modify | Support folder-as-drag-item, prevent circular drops |
| `DroppableFolder.tsx` | Delete | Replaced by DraggableDroppableFolder |

---

### Expected User Experience

| Action | Result |
|--------|--------|
| Drag PDF onto folder card | Document moves into that folder |
| Drag folder onto another folder | Folder becomes nested inside target |
| Drag folder to Root chip | Folder moves to root level |
| Click folder | Navigate into it, breadcrumb updates |
| Click breadcrumb segment | Navigate to that level |
| Drag folder into itself | Blocked (no action) |

