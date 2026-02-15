

## Add Reorder Controls to the Trade Group Dropdown

### What Changes
Replace the standard Select dropdown for trade group assignment (shown when adding new expense categories) with a custom popover that displays the groups as a draggable, reorderable list. Users can click a group to select it AND drag groups to reorder them -- all in one place.

### How It Works
1. The current `<Select>` for trade groups becomes a `<Popover>` with a trigger styled like a Select
2. Inside the popover, each group is a row with a grip handle (for drag reorder) and the group name (clickable to select)
3. Dragging a group reorders it and persists the new order via `saveGroupOrder()`
4. Clicking a group selects it for the new category assignment and closes the popover
5. The reorder is reflected everywhere that uses `getAllGroupDefs()` (Budget Calculator, this dropdown, Manage Groups section)

### Technical Details

**File: `src/components/settings/ManageSourcesCard.tsx`**

In the `CategoryListEditor` component (~lines 287-297):

1. Replace the `<Select>` for `tradeGrouped` with a `<Popover>` + `<PopoverTrigger>` + `<PopoverContent>`
2. Inside the popover content, wrap items in a `<DndContext>` + `<SortableContext>` (already imported)
3. Each item is a small sortable row with:
   - A `GripVertical` icon (already imported) for dragging
   - The group label text, clickable to set `selectedTradeGroup` and close the popover
   - A checkmark if it's the currently selected group
4. On drag end, call `saveGroupOrder()` with the new order (same logic as `TradeGroupManager`)
5. Import `Popover`, `PopoverTrigger`, `PopoverContent` from the existing UI components

No new files or dependencies needed -- all building blocks (DnD, Popover, saveGroupOrder) are already in place.
