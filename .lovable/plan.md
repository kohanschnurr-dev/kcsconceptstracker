

## Replace Drag-and-Drop Tabs with Gear Icon Order Picker

### Overview

Remove the drag-and-drop tab reordering and replace it with a small gear icon next to the tabs. Clicking the gear opens a popover where users can reorder tabs using up/down arrows in a simple list.

### Changes

**File: `src/pages/Projects.tsx`**

1. **Remove DnD imports**: Remove `DndContext`, `closestCenter`, `DragEndEvent`, `SortableContext`, `horizontalListSortingStrategy`, `arrayMove` from `@dnd-kit/*`. Remove `SortableTab` import.
2. **Add new imports**: Add `Settings` from `lucide-react`, `Popover`/`PopoverTrigger`/`PopoverContent` from `@/components/ui/popover`, `ArrowUp`/`ArrowDown` from `lucide-react`, and `arrayMove` from `@dnd-kit/sortable` (still needed for reorder logic).
3. **Add local reorder state**: Add a `[reorderOpen, setReorderOpen]` state for the popover.
4. **Remove `handleDragEnd`** and replace with `moveTab(index, direction)` that swaps a tab up or down and calls `updateTabOrder.mutate(newOrder)`.
5. **Replace the DndContext/SortableContext/SortableTab block** with plain `TabsTrigger` elements plus a gear icon button:

```tsx
<div className="flex items-center gap-2">
  <TabsList className="w-full max-w-2xl flex">
    {tabOrder.map((type) => {
      const config = TAB_CONFIG[type];
      const counts = getStatusCounts(type);
      return (
        <TabsTrigger key={type} value={type} className="gap-1.5">
          <config.icon className="h-4 w-4" />
          {config.label} ({counts.total})
        </TabsTrigger>
      );
    })}
  </TabsList>
  <Popover open={reorderOpen} onOpenChange={setReorderOpen}>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Settings className="h-4 w-4 text-muted-foreground" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-56 p-2" align="end">
      <p className="text-xs text-muted-foreground mb-2 px-2">Tab Order</p>
      {tabOrder.map((type, index) => (
        <div key={type} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted">
          <span className="text-sm flex items-center gap-2">
            <TAB_CONFIG[type].icon className="h-3.5 w-3.5" />
            {TAB_CONFIG[type].label}
          </span>
          <div className="flex gap-0.5">
            <Button size="icon" variant="ghost" className="h-6 w-6"
              disabled={index === 0} onClick={() => moveTab(index, 'up')}>
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6"
              disabled={index === tabOrder.length - 1} onClick={() => moveTab(index, 'down')}>
              <ArrowDown className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </PopoverContent>
  </Popover>
</div>
```

**File: `src/components/projects/SortableTab.tsx`**

- Delete this file (no longer needed).

### Summary

| Area | Change |
|------|--------|
| DnD removal | Remove DndContext/SortableContext wrappers, SortableTab component |
| Gear icon | Small Settings icon next to tabs opens a Popover |
| Reorder UI | List of tabs with up/down arrow buttons in the popover |
| Persistence | Same `updateTabOrder` mutation, triggered on arrow click |

