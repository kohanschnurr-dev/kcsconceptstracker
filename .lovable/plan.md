
## Fix Main Calendar Page Mobile UI

### What's Wrong (from the screenshot)

The main Calendar page (`/calendar`) uses `MonthlyView.tsx` which renders full `DealCard` components inside every calendar cell on mobile. At ~375px wide, each cell is only ~50px wide — far too narrow for the card text and icons, causing overflow, squishing, and an unreadable layout.

The header also has crowding issues: the "Project Calendar" title + view selector + "+ Add Project Event" button all compete for one row.

### What Already Works (the reference)

`ProjectCalendar.tsx` (in the project detail Schedule tab) already has an excellent mobile pattern:
- **Single-letter day headers**: S, M, T, W, T, F, S on mobile
- **Compact 60px cells** on mobile (vs 100px desktop)
- **"X tasks" badge → Popover** on mobile instead of rendering cards in the cell
- **Swipe gestures** to navigate months

### Plan: Port the ProjectCalendar mobile pattern into MonthlyView

#### 1. `src/components/calendar/MonthlyView.tsx`

The MonthlyView currently uses full `DealCard` components for all screen sizes. Add responsive mobile behavior:

**Day header row**: Show single-letter day labels (`S`, `M`, `T`, `W`, `T`, `F`, `S`) on mobile instead of `Sun`, `Mon`, etc.

**Cell height**: Reduce from `min-h-[140px]` to `min-h-[60px] sm:min-h-[140px]` on mobile.

**Cell padding**: Reduce from `p-2` to `p-0.5 sm:p-2`.

**Date number**: Reduce to `text-[10px] sm:text-sm`.

**Mobile card rendering**: Replace the current card rendering inside cells with the same popover pattern from `ProjectCalendar`:
- Mobile (`sm:hidden`): Show a small "X tasks" badge that opens a Popover with the full list of DealCards
- Desktop (`hidden sm:block`): Keep the existing DealCard rendering with the "+N more" popover

**Touch swipe support**: Add `onTouchStart`/`onTouchEnd` handlers to the calendar grid to swipe between months (same as ProjectCalendar).

**Ring styling**: Use `ring-1` instead of `ring-2` on mobile for today's highlight.

#### 2. `src/components/calendar/CalendarHeader.tsx`

Looking at the screenshot, the header has two issues on mobile:
1. The "+ Add Project Event" button text is too long — it pushes past the row
2. The view selector + add button need to fit next to "Project Calendar"

The header already has a mobile layout (`sm:hidden`) — but the `onAddEvent` slot renders the full `NewEventModal` button which has long text "+ Add Project Event". 

Fix: In the mobile row 1, wrap the `onAddEvent` slot and override the button's text via CSS on small screens. Since `NewEventModal` is passed as a React node, instead apply a responsive CSS override at the layout level:

Add `[&_button]:text-xs [&_button]:px-2 sm:[&_button]:text-sm sm:[&_button]:px-4` to the wrapper `div` on the mobile row — this will make the "Add Project Event" button compact without changing `NewEventModal.tsx` directly.

Alternatively (cleaner), pass the mobile add button size via a prop to the header. But since the button text "+  Add Project Event" is the problem, the simplest fix is to show just "＋ Add" on mobile using a `<span className="sm:hidden">Add</span><span className="hidden sm:inline">Add Project Event</span>` inside `NewEventModal.tsx`.

#### 3. `src/components/calendar/NewEventModal.tsx` (minor)

Add responsive button text:
```tsx
// Trigger button inside NewEventModal
<Plus className="h-4 w-4 sm:mr-2" />
<span className="hidden sm:inline">Add Project Event</span>
<span className="sm:hidden">Add</span>
```

### Files to Modify

| File | Change |
|---|---|
| `src/components/calendar/MonthlyView.tsx` | Add mobile cell compaction, single-letter day headers, "X tasks" badge + Popover for mobile, touch swipe for month navigation |
| `src/components/calendar/NewEventModal.tsx` | Shorten trigger button text on mobile to just "Add" |

### Technical Snippet — MonthlyView mobile cell pattern

```tsx
// Day headers — single letter on mobile
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekDaysShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

{weekDays.map((day, i) => (
  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
    <span className="hidden sm:inline">{day}</span>
    <span className="sm:hidden">{weekDaysShort[i]}</span>
  </div>
))}

// Cell height reduced on mobile
<DroppableDay> → min-h-[60px] sm:min-h-[140px], p-0.5 sm:p-2

// Mobile: badge → popover
<div className="sm:hidden">
  {dayTasks.length > 0 && (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-[9px] font-medium text-primary/80 hover:text-primary 
                           w-full text-center rounded hover:bg-primary/10 px-0.5 py-0.5">
          {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 overflow-hidden z-50" align="center">
        <div className="px-3 py-2 border-b border-border bg-muted/30">
          <p className="text-xs font-semibold">{format(day, 'EEEE, MMM d')}</p>
          <p className="text-[10px] text-muted-foreground">{dayTasks.length} event{dayTasks.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="p-2 space-y-1.5 max-h-[240px] overflow-y-auto">
          {dayTasks.map(task => (
            <DealCard key={task.id} task={task} compact onClick={() => onTaskClick(task)} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )}
</div>

// Desktop: existing DealCard layout
<div className="hidden sm:block space-y-1">
  {dayTasks.slice(0, 3).map(task => (
    <DraggableCard key={task.id} task={task} onTaskClick={() => onTaskClick(task)} />
  ))}
  {dayTasks.length > 3 && ( /* existing "+N more" popover */ )}
</div>
```

### Visual Result

**Before (mobile):**
```
Sun  Mon  Tue  Wed  Thu  Fri  Sat   ← 3-letter headers too wide
[140px tall cells with squished DealCards overflowing]
```

**After (mobile):**
```
S    M    T    W    T    F    S      ← single-letter, fits perfectly
[60px compact cells]
 1    2    3    4    5    6    7
      2    1         3              ← "X tasks" badges (tap → popover)
```

Clean, matches the project detail Schedule tab mobile experience exactly.
