
## Plan: Click-to-Open, Hold-and-Drag UX for Document Cards

### Problem
Currently, document cards have a separate drag handle that appears on hover. This is less intuitive than the calendar's approach where:
- **Click** → Opens the item
- **Hold + Move (8px)** → Starts dragging

### Solution
Apply the same `PointerSensor` with `distance` activation constraint pattern used in the calendar views. This eliminates the need for a visible drag handle and makes the entire card both clickable and draggable.

---

### Technical Changes

**1. Add PointerSensor to DocumentsGallery.tsx**

```typescript
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  pointerWithin,
  useSensor,      // Add
  useSensors,     // Add
  PointerSensor   // Add
} from '@dnd-kit/core';

// Inside component:
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // 8px movement before drag activates
    },
  })
);

// Add to DndContext:
<DndContext 
  sensors={sensors}  // Add this
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  collisionDetection={pointerWithin}
>
```

**2. Simplify DraggableDocumentCard.tsx**

- Remove the separate `GripVertical` drag handle div
- Apply drag listeners to the entire card instead of just the handle
- Keep click handler working via dnd-kit's activation constraint

```typescript
// Before: Listeners only on drag handle
<div {...listeners} {...attributes} className="...">
  <GripVertical />
</div>

// After: Listeners on entire card, click still works due to distance constraint
<div
  ref={setNodeRef}
  style={style}
  {...listeners}
  {...attributes}
  onClick={(e) => {
    // Only trigger if not dragging
    if (!isDragging) {
      onSelect();
    }
  }}
  className={cn(...)}
>
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/project/DocumentsGallery.tsx` | Import and configure `useSensor`, `useSensors`, `PointerSensor` with 8px distance constraint |
| `src/components/project/DraggableDocumentCard.tsx` | Remove drag handle, apply listeners to full card, add conditional click handler |

---

### How It Works

| User Action | Result |
|-------------|--------|
| Quick click on card | Opens document preview modal |
| Click + hold + move 8px | Starts drag operation |
| Release while dragging | Drops into folder/root |

This matches the calendar's drag-and-drop behavior and provides a more intuitive experience.

---

### Result
- More intuitive UX - no need to hunt for a drag handle
- Consistent with calendar views
- Cleaner card design without visible grip icons
- Single click still opens documents reliably
