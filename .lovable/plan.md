## Goal
Make every event on the Gantt view draggable to a new date — including milestone diamonds — and make drags feel precise (the bar lands where you drop it, not jumped to the cursor).

## Current behavior
- Non-milestone bars in `GanttView.tsx` are HTML5-draggable and the row's timeline div accepts drops.
- Milestone diamonds (single-day events like "Sale Closing") are **not** draggable — no `draggable` / `onDragStart` on the diamond element.
- When dropping a multi-day bar, the start date snaps to wherever the cursor lands, ignoring where on the bar the user originally grabbed it. This makes drags feel jumpy.

## Changes (single file: `src/components/calendar/GanttView.tsx`)

1. **Make milestones draggable**
   - Add `draggable`, `onDragStart`, `onDragEnd` to the diamond `<div>` (mirrors the bar branch).
   - Use `cursor-grab active:cursor-grabbing`, plus `opacity-40` while dragging.

2. **Preserve grab-offset on drop**
   - On `onDragStart`, capture the day-offset between the cursor and the task's start (in days) and stash it on the dataTransfer (`text/plain`) and a ref.
   - In `handleTimelineDrop`, subtract that offset from the computed day index before calling `onTaskMove`. Milestones use offset 0.
   - Clamp result to `[0, PAN_RANGE_DAYS - 1 - duration]` (already done).

3. **Use a custom drag image so the row doesn't ghost the whole element awkwardly**
   - Optional polish: `e.dataTransfer.setDragImage(e.currentTarget, e.nativeEvent.offsetX, e.nativeEvent.offsetY)` so the bar follows the cursor cleanly.

## Technical detail
```tsx
const grabOffsetRef = useRef(0);

const onBarDragStart = (e, task) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const cursorPctOfBar = (e.clientX - rect.left) / rect.width;
  const dur = differenceInDays(new Date(task.endDate), new Date(task.startDate));
  grabOffsetRef.current = Math.round(cursorPctOfBar * (dur + 1) - 0.5); // days from start
  setDraggedTask(task.id);
  e.dataTransfer.effectAllowed = 'move';
};

// in handleTimelineDrop:
const dayIdx = Math.floor(((e.clientX - rect.left) / rect.width) * PAN_RANGE_DAYS) - grabOffsetRef.current;
```

For milestones, `grabOffsetRef.current = 0` on dragStart.

## Out of scope
- Resizing bars by dragging the edges (separate feature).
- Touch drag on mobile (HTML5 DnD only).
