
## Plan: Fix Document-to-Folder Drag-and-Drop + Add Search

### Problems Identified

1. **Drag not completing**: When you release a document over a folder, the drop isn't being detected. This is likely because `rectIntersection` detects the **dragged item itself** as one of the collisions (since it's still in the DOM)

2. **Need search functionality**: User wants to search all documents in the project

---

### Root Cause

When using `rectIntersection`, the algorithm picks the first element that intersects with the dragged item's bounding box. Since the dragged item is still technically in the DOM (with 50% opacity), it can interfere with collision detection.

**The fix**: Use a custom collision detection strategy that excludes the active dragged item from consideration, or switch to `pointerWithin` which requires the pointer itself to be inside the target.

After testing, `pointerWithin` is actually better for this use case because:
- It only considers where your mouse pointer is, not where the full card overlaps
- This means you can precisely drop into small targets like folders
- The folder should highlight when your pointer enters it

---

### Technical Changes

**1. File: `src/components/project/DocumentsGallery.tsx`**

Change collision detection from `rectIntersection` to `pointerWithin`:

```typescript
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  pointerWithin,  // Change from rectIntersection
  useSensor,
  useSensors,
  PointerSensor
} from '@dnd-kit/core';

// In DndContext:
<DndContext 
  sensors={sensors}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  collisionDetection={pointerWithin}  // Changed
>
```

**2. Add Search Bar - File: `src/components/project/DocumentsGallery.tsx`**

Add search state and filter logic:

```typescript
// New state
const [searchQuery, setSearchQuery] = useState('');

// Search filter (applies across ALL documents, even in other folders)
const searchResults = useMemo(() => {
  if (!searchQuery.trim()) return null;
  
  const query = searchQuery.toLowerCase();
  return allDocuments.filter(doc => 
    doc.file_name.toLowerCase().includes(query) ||
    doc.title?.toLowerCase().includes(query) ||
    doc.notes?.toLowerCase().includes(query) ||
    doc.category.toLowerCase().includes(query)
  );
}, [allDocuments, searchQuery]);
```

Add search input in the header and show search results when active:

```typescript
// In header (new Input with Search icon)
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input
    placeholder="Search documents..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-9 w-[200px]"
  />
</div>

// In content - when searching, show results from ALL folders
{searchQuery && searchResults ? (
  <div>
    <p className="text-sm text-muted-foreground mb-4">
      Found {searchResults.length} results for "{searchQuery}"
    </p>
    <div className="grid ...">
      {searchResults.map(doc => (
        <DraggableDocumentCard ... />
      ))}
    </div>
  </div>
) : (
  // Existing folder/document grid
)}
```

---

### Collision Detection Comparison

| Algorithm | Behavior | Best For |
|-----------|----------|----------|
| `closestCenter` | Picks droppable with center closest to pointer | Sortable lists |
| `rectIntersection` | Picks first droppable that overlaps with dragged rect | Large targets, may have issues with overlaps |
| `pointerWithin` | Picks droppable that contains the pointer | Precise drops into containers |

`pointerWithin` is the correct choice because:
- When you drag a PDF card over a folder, you want to drop it **where your mouse is**, not where the card edge overlaps
- It prevents false positives from the dragged item itself interfering

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/project/DocumentsGallery.tsx` | 1. Change `rectIntersection` to `pointerWithin`  2. Add search state, input, and filtered results view |

---

### Expected Behavior After Fix

| Action | Result |
|--------|--------|
| Drag PDF, hover pointer over folder card | Folder highlights with ring |
| Release mouse while pointer is over folder | PDF moves into folder, disappears from current view |
| Type in search box | Shows matching documents from all folders |
| Click search result | Opens document preview |
| Clear search | Returns to normal folder view |
