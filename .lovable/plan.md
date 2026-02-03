
## Plan: Make Calendar Draggable (Monthly & Weekly Views)

### Overview

Add drag-and-drop functionality to the Monthly and Weekly calendar views using @dnd-kit (already installed). Users will be able to drag events/tasks between days to reschedule them, similar to how the Gantt view already supports dragging.

---

### Current State

| View | Draggable? |
|------|------------|
| Gantt | Yes (native HTML5 drag) |
| Monthly | No |
| Weekly | No |

---

### Target State

| View | Draggable? |
|------|------------|
| Gantt | Yes (existing) |
| Monthly | Yes (new - drag between days) |
| Weekly | Yes (new - drag between days) |

---

### User Flow

1. User hovers over an event card → cursor changes to grab
2. User drags the card to a different day
3. Drop zone highlights on hover
4. On drop → event dates update in database
5. Toast confirms the change

---

### UI Changes

**Monthly View - Drag Interaction:**
```text
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  1  │  2  │  3  │  4  │  5  │  6  │  7  │
│     │     │ [█] │     │     │     │     │  ← Dragging
│     │     │  ↓  │     │     │     │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  8  │  9  │ 10  │ 11  │ 12  │ 13  │ 14  │
│     │     │░░░░░│     │     │     │     │  ← Drop zone highlighted
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

**Visual Feedback:**
- Dragged card: Semi-transparent, slight scale-up
- Valid drop zone: Subtle green/emerald border glow
- Active drag: Cursor changes to grabbing

---

### Technical Approach

Use `@dnd-kit/core` with:
- `DndContext` wrapper for drag-and-drop context
- `useDraggable` hook for DealCard components
- `useDroppable` hook for each calendar day cell

---

### Changes Summary

| File | Changes |
|------|---------|
| `src/pages/Calendar.tsx` | Pass `onTaskMove` to MonthlyView and WeeklyView |
| `src/components/calendar/MonthlyView.tsx` | Add DndContext, make days droppable, wrap DealCards with draggable |
| `src/components/calendar/WeeklyView.tsx` | Add DndContext, make days droppable, wrap DealCards with draggable |
| `src/components/calendar/DealCard.tsx` | Accept optional drag handle props for visual feedback |

---

### Technical Details

#### 1. Calendar.tsx - Already has `handleTaskMove`

The `handleTaskMove` function already exists (lines 228-262) and handles updating dates in the database. Just need to pass it to MonthlyView and WeeklyView.

```tsx
{view === 'monthly' && (
  <MonthlyView
    currentDate={currentDate}
    tasks={filteredTasks}
    onTaskClick={handleTaskClick}
    onTaskMove={handleTaskMove}  // ADD THIS
  />
)}
{view === 'weekly' && (
  <WeeklyView
    currentDate={currentDate}
    tasks={filteredTasks}
    onTaskClick={handleTaskClick}
    onTaskMove={handleTaskMove}  // ADD THIS
  />
)}
```

---

#### 2. MonthlyView.tsx - Add Drag-and-Drop

**Import dnd-kit:**
```tsx
import { DndContext, DragEndEvent, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core';
```

**Add onTaskMove prop:**
```tsx
interface MonthlyViewProps {
  currentDate: Date;
  tasks: CalendarTask[];
  onTaskClick: (task: CalendarTask) => void;
  onTaskMove: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
}
```

**Create DraggableCard wrapper:**
```tsx
function DraggableCard({ task, onTaskClick }: { task: CalendarTask; onTaskClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });
  
  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <DealCard task={task} compact onClick={onTaskClick} />
    </div>
  );
}
```

**Create DroppableDay wrapper:**
```tsx
function DroppableDay({ day, children, isCurrentMonth }: { day: Date; children: React.ReactNode; isCurrentMonth: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: day.toISOString(),
    data: { date: day },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[140px] p-2 rounded-lg border transition-colors',
        isCurrentMonth ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-900/50 border-slate-800',
        isToday(day) && 'ring-2 ring-emerald-500/50',
        isOver && 'ring-2 ring-primary/50 bg-primary/5'  // Drop zone highlight
      )}
    >
      {children}
    </div>
  );
}
```

**Handle drag end:**
```tsx
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over) return;

  const task = tasks.find(t => t.id === active.id);
  if (!task) return;

  const targetDate = new Date(over.id as string);
  const duration = differenceInDays(task.endDate, task.startDate);
  const newEndDate = addDays(targetDate, duration);

  onTaskMove(task.id, targetDate, newEndDate);
};
```

---

#### 3. WeeklyView.tsx - Same Pattern

Apply the same DndContext, DraggableCard, and DroppableDay pattern to the weekly view.

---

#### 4. DealCard.tsx - Add Drag Visual Feedback (Optional)

Add cursor style to indicate draggability:
```tsx
className={cn(
  'cursor-grab active:cursor-grabbing',
  // ... existing classes
)}
```

---

### Drag Behavior

| Scenario | Behavior |
|----------|----------|
| Drag single-day event | Moves to new day, stays 1-day duration |
| Drag multi-day event | Start date changes, end date shifts to maintain same duration |
| Drop on same day | No change |
| Drop outside calendar | Cancels drag, no change |

---

### Files to Modify

| File | Key Changes |
|------|-------------|
| `src/pages/Calendar.tsx` | Pass `onTaskMove` to MonthlyView and WeeklyView |
| `src/components/calendar/MonthlyView.tsx` | Wrap in DndContext, add DraggableCard and DroppableDay components, handle drag end |
| `src/components/calendar/WeeklyView.tsx` | Same pattern as MonthlyView |
| `src/components/calendar/DealCard.tsx` | Add grab cursor styling |
