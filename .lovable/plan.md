# Make Events Draggable from "+more" Popover

## Problem
On the Monthly calendar, when a day has more than 3 events, the extra events live behind the "+N more" popover. Inside that popover they currently render as plain `DealCard` components — not wrapped in `DraggableCard` — so they can't be dragged onto another day. Even when wrapped, the Radix Popover would close on pointer-down outside, killing the drag mid-gesture.

## Fix (single file: `src/components/calendar/MonthlyView.tsx`)

### 1. Wrap popover events in `DraggableCard`
Replace `DealCard` with `DraggableCard` inside both popovers (mobile compact badge popover, line 207, and desktop "+more" popover, line 242). Same for the mobile popover so overflow-events on touch are also draggable.

```tsx
{dayTasks.map(task => (
  <DraggableCard key={task.id} task={task} onTaskClick={() => onTaskClick(task)} />
))}
```

### 2. Close the popover when a drag begins
Lift the popover's open state into local state and close it on `onDragStart`. This prevents Radix from auto-dismissing mid-drag (which cancels dnd-kit) and cleans the UI so the user sees the day grid while dragging.

- Track `openPopoverDay: string | null` at the `MonthlyView` component level.
- Each `+more` Popover becomes controlled: `open={openPopoverDay === day.toISOString()} onOpenChange={(o) => setOpenPopoverDay(o ? day.toISOString() : null)}`.
- In the `DndContext` `onDragStart` handler, call `setOpenPopoverDay(null)` so the popover dismisses cleanly the moment the gesture starts.

### 3. Compact `DraggableCard` styling already matches
`DraggableCard` already uses `<DealCard ... compact />`, so the popover layout stays visually identical — just becomes interactive.

## Out of scope
- No changes to `DealCard`, `DroppableDay`, or drag-end logic — the existing `onTaskMove` flow already handles repositioning.
- Weekly/Gantt views are unaffected.

## Result
Events from a day's overflow popover can now be dragged onto any day cell, identical to the first three visible events. The popover auto-closes when a drag starts so the drop target is fully visible.
