

## Plan: Fix Calendar Card Click Events (Drag Blocking Issue)

### Problem
When clicking on calendar event cards (like "Garage Install" or "For Lease Sign"), the click doesn't register because the drag-and-drop listeners (`{...listeners} {...attributes}`) are spread on the entire card wrapper. These listeners capture all pointer events for drag detection, which blocks the `onClick` from reaching the inner `DealCard` button.

---

### Solution
Use **dnd-kit's activator approach** with `useSensor` and `PointerSensor`. This requires a minimum drag distance (e.g., 8 pixels) before a drag starts. Simple clicks (no movement) will be allowed through to trigger `onClick`.

This is the standard pattern for making click and drag work together with dnd-kit.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/calendar/MonthlyView.tsx` | Add `useSensors` with `PointerSensor` distance activation |
| `src/components/calendar/WeeklyView.tsx` | Add `useSensors` with `PointerSensor` distance activation |

---

### Technical Implementation

**1. Import `useSensor`, `useSensors`, and `PointerSensor` from dnd-kit:**

```typescript
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  useDraggable, 
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
```

**2. Configure sensors with activation distance in the view component:**

```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // Drag starts only after 8px movement
    },
  })
);
```

**3. Pass sensors to DndContext:**

```tsx
<DndContext 
  sensors={sensors}
  onDragStart={handleDragStart} 
  onDragEnd={handleDragEnd}
>
```

---

### How It Works

| User Action | Before (Broken) | After (Fixed) |
|-------------|-----------------|---------------|
| Click card | Drag listeners block click, nothing happens | Click fires, opens task detail panel |
| Drag card | Drag starts immediately | Drag starts after 8px movement |
| Tap on mobile | Same as click - blocked | Click fires normally |

---

### Why This Works
The `activationConstraint: { distance: 8 }` tells dnd-kit to wait until the pointer moves 8 pixels before initiating a drag. If the user clicks and releases without moving (or moves less than 8px), it's treated as a click and the `onClick` handler fires normally.

