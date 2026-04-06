

## Plan: Add "Add to Calendar" Button to Add Task Modal

After creating a task, the user will have the option to also add it as a calendar event — all from the same modal.

### Changes — `src/components/project/AddTaskModal.tsx`

1. **Add state** for calendar modal (`calendarModalOpen`, `calendarDefaults`, `calendarProjects`)

2. **Modify `handleSave`** — after successful task creation, if the user toggled "Add to Calendar", fetch projects and open the `NewEventModal` with the task's title and due date pre-filled

3. **Add a checkbox or button** in the modal footer (next to Save) with a `CalendarPlus` icon labeled "Add to Calendar" — toggling sets a flag so that after save, the calendar modal opens

4. **Render `NewEventModal`** at the bottom of the component (same pattern as `ProjectTasks.tsx`), passing `defaultTitle`, `defaultStartDate`, `defaultProjectId`, and the project list

### Approach
- Add a `addToCalendar` boolean state, defaulting to `false`
- In the footer, add a toggle button before Save: `CalendarPlus` icon + "Add to Calendar"
- On save success, if `addToCalendar` is true, fetch projects, close the Add Task modal, then open `NewEventModal`
- Import `NewEventModal` and `CalendarPlus`

### Files
- `src/components/project/AddTaskModal.tsx`

