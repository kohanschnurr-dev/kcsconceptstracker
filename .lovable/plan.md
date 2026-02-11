
## Add Drag-and-Drop to Tab Order Popover

### Change
Replace the up/down arrow buttons in the Tab Order settings popover with drag-and-drop reordering using `@dnd-kit/sortable` (already installed).

### File: `src/pages/ProjectDetail.tsx`

1. **Add imports** for `DndContext`, `closestCenter`, `PointerSensor`, `useSensor`, `useSensors` from `@dnd-kit/core`, and `SortableContext`, `useSortable`, `verticalListSortingStrategy` from `@dnd-kit/sortable`, plus `CSS` from `@dnd-kit/utilities` and `GripVertical` from `lucide-react`

2. **Create a `SortableTabItem` component** (inline in the file) that uses `useSortable` to make each tab row draggable:
   - Shows a grip handle icon on the left
   - Displays the tab label
   - Removes the up/down arrow buttons
   - Applies transform/transition styles from dnd-kit

3. **Replace the popover content** (lines 611-628) with:
   - Wrap the list in `DndContext` + `SortableContext` with `verticalListSortingStrategy`
   - Use `PointerSensor` with a small activation distance (5px) to avoid accidental drags
   - On `onDragEnd`, compute the new order using `arrayMove` and call `updateDetailTabOrder.mutate()` (reusing the existing rental/loan logic from `moveDetailTab`)

4. **Remove** the `ArrowUp`/`ArrowDown` icon imports if no longer used elsewhere (they may still be used -- will check and keep if needed)

### Technical Details

The `SortableTabItem` component:
```text
function SortableTabItem({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted">
      <GripVertical {...attributes} {...listeners} className="h-3.5 w-3.5 text-muted-foreground cursor-grab" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
```

The `DndContext` handler reuses the existing rental/loan preservation logic from `moveDetailTab`.
