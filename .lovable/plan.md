

## Rename to "Active Pipeline Tasks" + Add Completed Tasks Filter

### Changes — `src/components/project/ProjectTasks.tsx`

1. **Rename header** from "Pipeline Tasks" to "Active Pipeline Tasks"

2. **Add a toggle/filter** next to the title — a small button or tab toggle ("Active" / "Completed") that switches between viewing active tasks and completed tasks

3. **Update `fetchTasks`** to accept a filter parameter:
   - Active mode (default): query `.in('status', ['pending', 'in_progress'])` — current behavior
   - Completed mode: query `.eq('status', 'completed')`, ordered by `updated_at` desc

4. **Add state**: `showCompleted` boolean, default `false`
   - When toggled, re-fetch with the appropriate filter
   - Update header to show "Active Pipeline Tasks (N)" or "Completed Tasks (N)" based on mode

5. **In completed view**: checkboxes are checked, clicking unchecks (moves back to pending). The empty state message changes to "No completed tasks yet."

### UI
- A small segmented toggle or outline buttons ("Active" | "Completed") placed in the card header next to the Add Task button
- Single file change, display-only logic

