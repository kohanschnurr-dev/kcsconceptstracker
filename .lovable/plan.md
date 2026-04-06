

## Plan: Make "Add to Calendar" Immediately Save & Open Calendar

**Problem**: The "Add to Calendar" button currently just toggles a boolean flag. The calendar modal only appears after clicking Save separately — making it feel like the button does nothing.

**Fix**: Change "Add to Calendar" from a toggle to a direct action button that saves the task and immediately opens the calendar event modal.

### Changes — `src/components/project/AddTaskModal.tsx`

1. **Remove the `addToCalendar` toggle state** — no longer needed as a separate flag.

2. **Create a new `handleSaveAndCalendar` function** that:
   - Saves the task (same logic as `handleSave`)
   - On success, sets calendar defaults and opens the `NewEventModal` immediately

3. **Update the footer layout**:
   - Replace the toggle-style button with a direct action button: "Add to Calendar" 
   - Keep Cancel and Save as they are
   - "Add to Calendar" calls `handleSaveAndCalendar` (validates title, saves task, opens calendar modal)

4. **Clean up `handleSave`** — remove the `addToCalendar` branching logic; it always just saves and closes.

### Files
- `src/components/project/AddTaskModal.tsx`

