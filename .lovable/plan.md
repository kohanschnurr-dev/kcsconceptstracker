

## Add "Delete This or All" Prompt for Recurring Events

### What Changes
When you delete a calendar event that belongs to a recurring series, instead of the current simple "Are you sure?" dialog, you'll see a choice:
- **Delete this event only** -- removes just that single occurrence
- **Delete all events in this series** -- removes every event sharing the same recurrence group

Non-recurring events keep the current simple delete behavior.

### Technical Details

**1. Pass recurrence data through to the UI**

**File: `src/pages/Calendar.tsx`**
- In the `fetchData` function where events are mapped to `CalendarTask` objects, add `recurrenceGroupId: event.recurrence_group_id` to the mapped object.

**File: `src/pages/Calendar.tsx` (CalendarTask interface)**
- Add `recurrenceGroupId?: string | null` to the `CalendarTask` interface.

**2. Update the `onTaskDelete` callback**

**File: `src/pages/Calendar.tsx`**
- Change `onTaskDelete` to accept an array of deleted task IDs instead of a single one, so it can remove the full series from local state:
  ```
  onTaskDelete={(deletedIds) => {
    setTasks(prev => prev.filter(t => !deletedIds.includes(t.id)));
    setSelectedTask(null);
  }}
  ```

**3. Revamp the delete dialog in TaskDetailPanel**

**File: `src/components/calendar/TaskDetailPanel.tsx`**
- Update `onTaskDelete` prop type to `(taskIds: string[]) => void`
- Replace the current `AlertDialog` with a custom `Dialog` that shows two options when the event has a `recurrenceGroupId`:
  - "Delete This Event" button -- deletes only the single event by its ID (current behavior)
  - "Delete All in Series" button -- deletes all events matching the `recurrence_group_id`
- For non-recurring events (no `recurrenceGroupId`), show the current simple confirmation.

**Delete handlers:**
- `handleDeleteSingle`: deletes by `eq('id', task.id)` -- same as today. Calls `onTaskDelete([task.id])`.
- `handleDeleteSeries`: deletes by `eq('recurrence_group_id', task.recurrenceGroupId)`. Calls `onTaskDelete` with the IDs of all matching tasks from `allTasks`.

### Dialog Layout (Recurring Events)

```text
+------------------------------------------+
|  Delete Recurring Event                  |
|                                          |
|  "Collect Rent" is part of a recurring   |
|  series. What would you like to delete?  |
|                                          |
|  [Delete This Event Only]                |
|  [Delete All Events in Series]           |
|                                          |
|  [Cancel]                                |
+------------------------------------------+
```

### Dialog Layout (Non-Recurring Events)
Same as current -- simple "Are you sure?" with Cancel/Delete buttons.
