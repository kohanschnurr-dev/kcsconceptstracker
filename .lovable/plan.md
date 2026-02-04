

## Plan: Fix Drag-and-Drop to Work on Folder Cards

### The Problem
When you drag a document and hover over a folder card, it doesn't detect the folder as a drop target. This happens because the current collision detection (`closestCenter`) picks the droppable element whose **center** is closest to your cursor - which doesn't work well when you're trying to drop *into* containers like folder cards.

### Solution
Change the collision detection algorithm to `rectIntersection` which detects when the dragged item **overlaps** with a droppable area - this is the standard approach for "drop into container" scenarios.

---

### Technical Changes

**File: `src/components/project/DocumentsGallery.tsx`**

1. **Change collision detection from `closestCenter` to `rectIntersection`:**

```typescript
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  rectIntersection,  // ← Use this instead of closestCenter
  useSensor,
  useSensors,
  PointerSensor
} from '@dnd-kit/core';
```

Then in the DndContext:

```typescript
<DndContext 
  sensors={sensors}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  collisionDetection={rectIntersection}  // ← Changed
>
```

### Why This Works

| Algorithm | Best For | How It Works |
|-----------|----------|--------------|
| `closestCenter` | Sortable lists | Picks target with center closest to pointer |
| `rectIntersection` | **Drop into containers** | Picks target that overlaps with dragged item |
| `pointerWithin` | Small precise targets | Pointer must be inside target |

Since folder cards are "containers" that should receive items when you drag over them, `rectIntersection` is the correct choice.

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/project/DocumentsGallery.tsx` | Replace `closestCenter` with `rectIntersection` import and usage |

---

### Expected Behavior After Fix

| Action | Result |
|--------|--------|
| Drag PDF over folder card | Folder highlights, PDF moves in on release |
| Drag folder over another folder | Target folder highlights, folder nests on release |
| Drag to small chip targets | Still works (chips are also detected via intersection) |

