

## Plan: Enable Desktop Drag-and-Drop Upload + Folder-to-Folder Document Moving

### Overview
Add two capabilities to the Documents Gallery:
1. **Desktop drag-and-drop** - Drop PDF/files directly from desktop onto the gallery for instant upload
2. **Cross-folder document moving** - When inside a folder, show other folders as drop targets so documents can be moved between folders

---

### Current Issues

| Issue | Solution |
|-------|----------|
| Can't drag files from desktop onto gallery | Add drop zone handler to CardContent area |
| When inside a folder, can't move docs to other folders | Show folder "chips" as drop targets when inside a folder |
| Desktop drop would need category/date input | Use quick defaults (general category, today's date), allow editing after via preview modal |

---

### UI Design

**Desktop Drop Zone Indicator:**
```text
┌────────────────────────────────────────────────────────────────────────┐
│ 📂 Documents (8)                      [Date ▾] [Category ▾] [+ Add]    │
├────────────────────────────────────────────────────────────────────────┤
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃                                                                    ┃ │
│ ┃        Drop files here to upload                                   ┃ │
│ ┃        ↓  ↓  ↓                                                     ┃ │
│ ┃                                                                    ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Inside Folder - Folder Targets Bar:**
```text
┌────────────────────────────────────────────────────────────────────────┐
│ ← Back     📁 Permits (4 files)                                        │
├────────────────────────────────────────────────────────────────────────┤
│ Move to: [📁 Contracts] [📁 Invoices] [📂 Root]                        │ ← Droppable folder chips
├────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ 📄 PDF   │  │ 📄 PDF   │  │ 📄 PDF   │  │ 📄 PDF   │               │
│  │ Permit 1 │  │ Permit 2 │  │ Permit 3 │  │ Permit 4 │               │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Technical Changes

**1. Desktop Drag-and-Drop Upload**

Add native HTML5 drag event handlers to detect when files from the desktop are dragged over the gallery:

```typescript
const [desktopDragActive, setDesktopDragActive] = useState(false);
const [uploadingDesktopFiles, setUploadingDesktopFiles] = useState(false);

// Handle desktop file drops (native HTML5, not dnd-kit)
const handleDesktopDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  if (e.dataTransfer.types.includes('Files')) {
    setDesktopDragActive(true);
  }
};

const handleDesktopDragLeave = (e: React.DragEvent) => {
  e.preventDefault();
  setDesktopDragActive(false);
};

const handleDesktopDrop = async (e: React.DragEvent) => {
  e.preventDefault();
  setDesktopDragActive(false);
  
  const files = Array.from(e.dataTransfer.files).filter(f => 
    ACCEPTED_FILE_TYPES.includes(f.type)
  );
  
  if (files.length === 0) {
    toast.error('No supported files found');
    return;
  }
  
  // Quick upload with defaults
  setUploadingDesktopFiles(true);
  for (const file of files) {
    await uploadFile(file, 'general', new Date().toISOString().split('T')[0], null, currentFolderId);
  }
  setUploadingDesktopFiles(false);
  toast.success(`${files.length} file(s) uploaded`);
  fetchDocuments();
};
```

**2. Folder Target Bar (when inside a folder)**

Create a new component `FolderTargetBar` that shows other folders as droppable chips:

```tsx
function FolderTargetBar({ folders, currentFolderId, activeDragId }) {
  const otherFolders = folders.filter(f => f.id !== currentFolderId);
  
  if (!activeDragId || otherFolders.length === 0) return null;
  
  return (
    <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-dashed">
      <p className="text-xs text-muted-foreground mb-2">Move to folder:</p>
      <div className="flex flex-wrap gap-2">
        {otherFolders.map(folder => (
          <DroppableFolderChip key={folder.id} folder={folder} />
        ))}
        <RootDropZone compact />
      </div>
    </div>
  );
}
```

**3. Compact Droppable Folder Chip**

```tsx
function DroppableFolderChip({ folder }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
  });
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all",
        isOver 
          ? "bg-primary/20 border-primary ring-2 ring-primary" 
          : "bg-background border-border hover:border-primary/50"
      )}
    >
      <Folder className="h-3.5 w-3.5 text-amber-500" />
      <span className="text-sm">{folder.name}</span>
    </div>
  );
}
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/project/DocumentsGallery.tsx` | Add desktop drop handlers, folder target bar, upload function |
| `src/components/project/DroppableFolder.tsx` | Add compact "chip" variant for inline folder targets |
| `src/components/project/RootDropZone.tsx` | Add compact variant for inline use |

---

### Accepted File Types

Reuse from DocumentUploadModal:
- PDF (`application/pdf`)
- Word docs (`.doc`, `.docx`)
- Excel (`.xls`, `.xlsx`)
- Images (`.jpg`, `.jpeg`, `.png`, `.gif`)
- Text (`.txt`)

---

### User Flow

**Desktop Upload:**
1. User drags PDF from desktop over gallery
2. Blue dashed border appears with "Drop files to upload" message
3. User drops files
4. Files upload immediately with defaults (general category, today's date)
5. User can click on uploaded document to edit category/notes via preview modal

**Cross-Folder Move:**
1. User enters a folder (e.g., "Permits")
2. User starts dragging a document card
3. A bar appears at top showing other folders and "Move to root"
4. User drops on target folder chip
5. Document moves to that folder

---

### Result

| Feature | Before | After |
|---------|--------|-------|
| Desktop drag-drop | Must open modal first | Drop directly onto gallery |
| Move between folders | Exit folder → drag → drop | Folder chips appear while dragging |
| Upload speed | Multiple clicks | Single drag-drop action |

