

## Plan: Fix Document Drag-and-Drop Into/Out of Folders

### Problem Analysis

After reviewing the code, I found the issue: when you drag a document, the `over` target is likely `null` when you release. This can happen because:

1. **Collision detection issue**: The `pointerWithin` collision algorithm requires the pointer to be inside the droppable element, but the drag overlay or other elements might be interfering
2. **Missing DragStartEvent tracking**: The `handleDragStart` only sets `activeDragId` but doesn't store the actual dragged item data needed for validation

### Root Cause

Looking at the `handleDragEnd` function (lines 272-310), it uses `active.id` to get the document ID. However, the issue is likely the **collision detection** - `pointerWithin` is stricter and may not detect small targets like folder chips reliably.

### Solution

1. **Change collision detection** from `pointerWithin` to `closestCenter` - this is more forgiving and works better with small drop targets
2. **Add debug logging** temporarily to confirm the issue (then remove)
3. **Ensure the FolderTargetBar appears at root level too** - currently at root, when dragging, the folders in the grid are the drop targets, but the FolderTargetBar could also help by showing chips for ALL folders when at root

---

### Technical Changes

**File: `src/components/project/DocumentsGallery.tsx`**

1. Change the collision detection algorithm:
```typescript
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  closestCenter,  // Change from pointerWithin
  useSensor,
  useSensors,
  PointerSensor
} from '@dnd-kit/core';

// In DndContext:
<DndContext 
  sensors={sensors}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  collisionDetection={closestCenter}  // Changed
>
```

2. Update `handleDragEnd` to handle edge case where document is dropped on itself or invalid target:
```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  setActiveDragId(null);
  const { active, over } = event;
  
  if (!over || active.id === over.id) return;
  
  const documentId = active.id as string;
  const overId = over.id as string;
  
  // ... rest of logic
};
```

3. **Show FolderTargetBar at root level when there are folders** - this gives a clearer drop target:

**File: `src/components/project/FolderTargetBar.tsx`**

Currently the bar only shows when inside a folder or at root with other folders. Update logic to always show when dragging and there are folders to drop into:

```typescript
export function FolderTargetBar({ folders, currentFolderId, activeDragId }: FolderTargetBarProps) {
  // Only show when actively dragging a document
  if (!activeDragId) return null;
  
  // When at root, show all folders. When inside folder, show other folders + root
  const targetFolders = currentFolderId 
    ? folders.filter(f => f.id !== currentFolderId)
    : folders;
  
  const showRoot = currentFolderId !== null;
  const hasTargets = targetFolders.length > 0 || showRoot;
  
  if (!hasTargets) return null;

  return (
    <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-dashed border-primary/30 animate-in fade-in duration-200">
      <p className="text-xs text-muted-foreground mb-2">Move to:</p>
      <div className="flex flex-wrap gap-2">
        {showRoot && <RootDropChip />}
        {targetFolders.map(folder => (
          <DroppableFolderChip key={folder.id} folder={folder} />
        ))}
      </div>
    </div>
  );
}
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/project/DocumentsGallery.tsx` | Change `pointerWithin` to `closestCenter` collision detection |
| `src/components/project/FolderTargetBar.tsx` | Show all folders as targets when at root level |

---

### Expected Behavior After Fix

| Action | Result |
|--------|--------|
| At root: drag document over folder card | Document moves into that folder |
| At root: drag document over folder chip | Document moves into that folder |
| Inside folder: drag document to Root chip | Document moves to root |
| Inside folder: drag document to other folder chip | Document moves to that folder |

