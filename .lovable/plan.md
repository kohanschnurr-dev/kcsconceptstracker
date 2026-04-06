

## Plan: Add "Upload to Calendar" Button in Edit Task Dialog

Add a calendar icon button in the Edit Task dialog footer that, when clicked, opens the `NewEventModal` with the task's details (title, due date, project) pre-filled. The user then picks a calendar category and finalizes the event.

### Changes

**`src/components/project/ProjectTasks.tsx`**

1. **New state**: `calendarModalOpen` (boolean) and `calendarTask` (stores the task data to pass)
2. **"Add to Calendar" button** in `editFooterContent` — a subtle icon button with `CalendarPlus` icon, placed between Delete and Cancel. On click:
   - Sets `calendarTask` with current edit form values (title, due date, project)
   - Opens the `NewEventModal` via controlled props
   - Closes the edit dialog
3. **Render `NewEventModal`** at the bottom of the component with:
   - `externalOpen={calendarModalOpen}`
   - `onExternalOpenChange` to control visibility
   - `defaultProjectId={projectId}`
   - `defaultStartDate` from the task's due date (or today if none)
   - Pre-filled title passed via a new optional `defaultTitle` prop

**`src/components/calendar/NewEventModal.tsx`**

4. **Add `defaultTitle` prop** to `NewEventModalProps`
5. **Populate title** from `defaultTitle` when the modal opens externally (in the existing `useEffect` that handles `externalOpen`)

### UI Details
- The button sits in the footer row: `[Delete] ... [📅 Add to Calendar] [Cancel] [Save]`
- Uses `CalendarPlus` icon from lucide with tooltip text "Add to Calendar"
- Styled as `variant="outline" size="sm"` to match existing footer buttons
- The `NewEventModal` opens with title and date pre-filled; user picks the category (the key part the user mentioned) and submits

### Files touched
- `src/components/project/ProjectTasks.tsx`
- `src/components/calendar/NewEventModal.tsx`

