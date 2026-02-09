
## Plan: Add Multi-Select with Bulk Delete to Photo Gallery

### Overview

Add the ability to select multiple photos in the gallery and delete them in bulk. This will include:
- A "Select" mode toggle in the header
- Checkboxes on each photo when in selection mode
- A floating action bar showing selected count with Delete button
- Select All / Deselect All options

---

### User Experience

1. **Normal Mode**: Gallery works as before - clicking a photo opens the preview modal
2. **Selection Mode**: 
   - Click "Select" button in header to enter selection mode
   - Checkboxes appear on all photos
   - Click photos to toggle selection
   - Floating action bar appears at bottom with:
     - Selected count (e.g., "3 selected")
     - Delete button
     - Cancel button to exit selection mode
   - "Select All" / "Clear" quick actions in header

---

### Technical Changes

**File: `src/components/project/PhotoGallery.tsx`**

#### 1. Add New Imports

```typescript
import { Plus, Image, Loader2, Calendar, ImageIcon, CheckSquare, Square, Trash2, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
```

#### 2. Add Selection State

```typescript
const [isSelectionMode, setIsSelectionMode] = useState(false);
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [isDeleting, setIsDeleting] = useState(false);
```

#### 3. Add Selection Helper Functions

```typescript
const togglePhotoSelection = (photoId: string) => {
  setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(photoId)) {
      next.delete(photoId);
    } else {
      next.add(photoId);
    }
    return next;
  });
};

const handleSelectAll = () => {
  const allIds = filteredPhotos.map(p => p.id);
  setSelectedIds(new Set(allIds));
};

const handleDeselectAll = () => {
  setSelectedIds(new Set());
};

const exitSelectionMode = () => {
  setIsSelectionMode(false);
  setSelectedIds(new Set());
};
```

#### 4. Add Bulk Delete Function

```typescript
const handleBulkDelete = async () => {
  if (selectedIds.size === 0) return;
  
  setIsDeleting(true);
  
  // Get file paths for selected photos
  const selectedPhotos = photos.filter(p => selectedIds.has(p.id));
  const filePaths = selectedPhotos.map(p => p.file_path);
  
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('project-photos')
    .remove(filePaths);
  
  if (storageError) {
    console.error('Storage delete error:', storageError);
  }
  
  // Delete from database
  const { error } = await supabase
    .from('project_photos')
    .delete()
    .in('id', Array.from(selectedIds));
  
  if (error) {
    toast({
      title: 'Error',
      description: 'Failed to delete some photos',
      variant: 'destructive',
    });
  } else {
    toast({
      title: 'Photos deleted',
      description: `Successfully deleted ${selectedIds.size} photo(s)`,
    });
    exitSelectionMode();
    fetchPhotos();
  }
  
  setIsDeleting(false);
};
```

#### 5. Update Header UI

Add Select mode toggle button in header:

```typescript
<div className="flex items-center gap-2 flex-wrap">
  {/* Filter dropdowns... */}
  
  {isSelectionMode ? (
    <>
      <Button variant="outline" size="sm" onClick={handleSelectAll}>
        <CheckSquare className="h-4 w-4 mr-1" />
        Select All
      </Button>
      <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
        <X className="h-4 w-4 mr-1" />
        Clear
      </Button>
      <Button variant="ghost" size="sm" onClick={exitSelectionMode}>
        Cancel
      </Button>
    </>
  ) : (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsSelectionMode(true)}>
        <CheckSquare className="h-4 w-4 mr-1" />
        Select
      </Button>
      <Button size="sm" onClick={() => setIsUploadOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Add Photos
      </Button>
    </>
  )}
</div>
```

#### 6. Update Photo Card UI

Modify photo card to show checkbox and handle selection:

```typescript
<div 
  key={photo.id} 
  className={cn(
    "relative group cursor-pointer aspect-square rounded-lg overflow-hidden bg-muted",
    isSelectionMode && selectedIds.has(photo.id) && "ring-2 ring-primary"
  )}
  onClick={() => {
    if (isSelectionMode) {
      togglePhotoSelection(photo.id);
    } else {
      setSelectedPhoto(photo);
    }
  }}
>
  <img ... />
  
  {/* Selection Checkbox - top right */}
  {isSelectionMode && (
    <div 
      className="absolute top-2 right-2 z-10"
      onClick={(e) => e.stopPropagation()}
    >
      <Checkbox 
        checked={selectedIds.has(photo.id)}
        onCheckedChange={() => togglePhotoSelection(photo.id)}
        className="h-5 w-5 bg-background/80 border-2"
      />
    </div>
  )}
  
  {/* Category Badge - existing code */}
  ...
</div>
```

#### 7. Add Floating Action Bar

Add at bottom of CardContent when in selection mode with items selected:

```typescript
{isSelectionMode && selectedIds.size > 0 && (
  <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg p-3 flex items-center gap-4">
    <span className="text-sm font-medium">
      {selectedIds.size} photo{selectedIds.size !== 1 ? 's' : ''} selected
    </span>
    <div className="flex gap-2">
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={handleBulkDelete}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        {isDeleting ? 'Deleting...' : 'Delete'}
      </Button>
      <Button variant="outline" size="sm" onClick={exitSelectionMode}>
        Cancel
      </Button>
    </div>
  </div>
)}
```

---

### Visual Result

**Normal Mode:**
```text
Photo Gallery (7)  [All ▼] [All Dates ▼] [Select] [+ Add Photos]
```

**Selection Mode:**
```text
Photo Gallery (7)  [All ▼] [All Dates ▼] [✓ Select All] [× Clear] [Cancel]
```

**Photos with checkboxes:**
```text
┌──────────────┐  ┌──────────────┐
│ [Before]  ☑ │  │ [During]  ☐ │
│              │  │              │
│   [photo]    │  │   [photo]    │
└──────────────┘  └──────────────┘
```

**Floating Action Bar (when items selected):**
```text
┌──────────────────────────────────────┐
│  3 photos selected  [🗑 Delete] [Cancel] │
└──────────────────────────────────────┘
```

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/components/project/PhotoGallery.tsx` | Add Checkbox, Trash2, CheckSquare, X imports |
| `src/components/project/PhotoGallery.tsx` | Add isSelectionMode, selectedIds, isDeleting state |
| `src/components/project/PhotoGallery.tsx` | Add togglePhotoSelection, handleSelectAll, handleDeselectAll, exitSelectionMode, handleBulkDelete functions |
| `src/components/project/PhotoGallery.tsx` | Update header with Select mode toggle and actions |
| `src/components/project/PhotoGallery.tsx` | Update photo cards with checkboxes and selection ring |
| `src/components/project/PhotoGallery.tsx` | Add floating action bar for bulk actions |

---

### No Database Changes Needed

All operations use existing database structure - just bulk delete on `project_photos` table and storage bucket.
