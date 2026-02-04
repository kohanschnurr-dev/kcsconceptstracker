

## Plan: Add Folder Organization to Documents Gallery with Drag-and-Drop

### Overview
Add the ability to create folders for organizing documents within a project. Users can drag-and-drop documents into folders for better organization. The gallery will display folders alongside loose documents, and clicking a folder opens it to show its contents.

---

### UI Design

**Main Gallery View with Folders:**
```text
┌────────────────────────────────────────────────────────────────────────┐
│ 📂 Documents (12)                     [Date ▾] [Category ▾] [+ Folder] [+ Add] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ 📁       │  │ 📁       │  │ 📄 PDF   │  │ 📊 XLS   │               │
│  │ Permits  │  │ Contracts│  │          │  │          │               │
│  │ 4 files  │  │ 2 files  │  │ Invoice  │  │ Budget   │               │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
│      ↑              ↑                                                  │
│   Folders       Folders         Loose documents at root                │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Inside a Folder:**
```text
┌────────────────────────────────────────────────────────────────────────┐
│ ← Back to Documents     📁 Permits (4 files)                           │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ 📄 PDF   │  │ 📄 PDF   │  │ 📄 PDF   │  │ 📄 PDF   │               │
│  │          │  │          │  │          │  │          │               │
│  │ Permit 1 │  │ Permit 2 │  │ Permit 3 │  │ Permit 4 │               │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Drag-and-Drop Behavior:**
- Dragging a document card over a folder highlights the folder
- Dropping assigns the document to that folder
- Documents can be dragged out of folders back to root (when inside a folder, show a "Move to Root" drop zone)

---

### Database Changes

**New Table: `document_folders`**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| project_id | uuid | Foreign key to projects |
| name | text | Folder name |
| color | text | Optional folder color (hex) |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

**Modify Table: `project_documents`**

| Column | Type | Description |
|--------|------|-------------|
| folder_id | uuid (nullable) | Foreign key to document_folders (null = root level) |

---

### Technical Implementation

**1. Database Migration:**

```sql
-- Create document_folders table
CREATE TABLE public.document_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add folder_id to project_documents
ALTER TABLE public.project_documents
ADD COLUMN folder_id UUID REFERENCES public.document_folders(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as project_documents)
CREATE POLICY "Users can view folders for their projects"
  ON public.document_folders FOR SELECT
  USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can create folders for their projects"
  ON public.document_folders FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their folders"
  ON public.document_folders FOR UPDATE
  USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their folders"
  ON public.document_folders FOR DELETE
  USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
```

**2. New Component: CreateFolderModal**

Simple modal with:
- Folder name input
- Optional color picker
- Create button

**3. Update DocumentsGallery.tsx:**

- Add state for `currentFolderId` (null = root view)
- Add state for `folders` array
- Fetch folders alongside documents
- Wrap gallery in `DndContext` from @dnd-kit/core
- Create `DraggableDocumentCard` component
- Create `DroppableFolder` component
- Handle drag-end to update document's `folder_id`
- Add breadcrumb navigation when inside a folder
- Add "New Folder" button to header

**4. Folder Card Component:**

```tsx
function DroppableFolder({ folder, documentCount, onClick }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    data: { type: 'folder', folderId: folder.id },
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-xl border bg-card transition-all",
        isOver && "ring-2 ring-primary border-primary bg-primary/5"
      )}
    >
      <div className="flex flex-col items-center justify-center py-6 px-4 bg-amber-500/10">
        <Folder className="h-12 w-12 text-amber-500" />
      </div>
      <div className="p-3">
        <p className="font-medium text-sm truncate">{folder.name}</p>
        <p className="text-xs text-muted-foreground">{documentCount} files</p>
      </div>
    </div>
  );
}
```

**5. Draggable Document Card:**

```tsx
function DraggableDocumentCard({ doc, onSelect, onDownload }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: doc.id,
    data: { type: 'document', document: doc },
  });
  
  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {/* Existing document card content */}
    </div>
  );
}
```

**6. Drag End Handler:**

```tsx
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over) return;
  
  const documentId = active.id as string;
  const overId = over.id as string;
  
  // Dropped on a folder
  if (overId.startsWith('folder-')) {
    const folderId = overId.replace('folder-', '');
    await supabase
      .from('project_documents')
      .update({ folder_id: folderId })
      .eq('id', documentId);
    fetchDocuments();
  }
  
  // Dropped on "root" zone (when inside a folder)
  if (overId === 'root-drop-zone') {
    await supabase
      .from('project_documents')
      .update({ folder_id: null })
      .eq('id', documentId);
    fetchDocuments();
  }
};
```

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Database migration | Create | Add `document_folders` table and `folder_id` column |
| `src/components/project/CreateFolderModal.tsx` | Create | Modal for creating new folders |
| `src/components/project/DocumentsGallery.tsx` | Modify | Add folder display, drag-drop, navigation |

---

### User Flow

1. **Create Folder**: Click "+ Folder" → Enter name → Create
2. **Move to Folder**: Drag document card → Drop on folder (folder highlights on hover)
3. **Open Folder**: Click folder card → See folder contents with back button
4. **Move to Root**: While inside a folder, drag document → Drop on "Move to root" zone at top
5. **Delete Folder**: Opens a confirmation modal (documents move back to root)

---

### Edge Cases

| Case | Behavior |
|------|----------|
| Delete folder with documents | Documents move to root (folder_id set to null via ON DELETE SET NULL) |
| Filter by category | Filters apply within current view (root or folder) |
| Upload while in folder | New documents go into current folder |
| Empty folder | Show empty state with message |

