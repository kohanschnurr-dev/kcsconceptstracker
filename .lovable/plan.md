

## Replace Inline Quick-Add with "+ Add Task" Button

### What Changes

The full inline input bar (text input, project dropdown, camera, calendar, submit button, and photo preview strip) on the Checklist tab will be removed and replaced with a compact **"+ Add Task"** button in the page header area (top-right). Clicking it opens the existing `AddTaskDialog` modal that has all the same fields (title, project, priority, status, due date, photos).

### Technical Details

**`src/pages/DailyLogs.tsx`**

1. **Import `AddTaskDialog`** at the top of the file:
   ```tsx
   import { AddTaskDialog } from '@/components/dashboard/AddTaskDialog';
   ```

2. **Add state** for the dialog:
   ```tsx
   const [addTaskOpen, setAddTaskOpen] = useState(false);
   ```

3. **Add "+ Add Task" button to the header** (lines 564-569). Update the header `div` to include the button on the right side:
   ```tsx
   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
     <div>
       <h1 className="text-2xl font-semibold">Daily Logs & Tasks</h1>
       <p className="text-muted-foreground mt-1">Track site visits and manage your checklist</p>
     </div>
     <Button className="gap-2 w-full sm:w-auto h-11 sm:h-10" onClick={() => setAddTaskOpen(true)}>
       <Plus className="h-4 w-4" />
       Add Task
     </Button>
   </div>
   ```

4. **Remove the entire inline quick-add block** (lines 791-931) -- the form with the text input, project select, camera button, calendar popover, submit button, and photo thumbnail strip.

5. **Render the `AddTaskDialog`** at the bottom of the component, passing `onTaskCreated` to refresh the task list after creation:
   ```tsx
   <AddTaskDialog open={addTaskOpen} onOpenChange={setAddTaskOpen} onTaskCreated={fetchTasks} />
   ```

6. **Clean up unused state variables** that were only used by the inline form: `newTaskTitle`, `newTaskProjectId`, `newTaskDueDate`, `newTaskPhotoUrls`, `newTaskUploading`, `newTaskFileRef`, and the `handleCreateTask` function -- if they are not used elsewhere.

This keeps the same task creation capabilities (title, project, priority, status, due date, photos) but moves them into the cleaner dialog experience, matching the dashboard pattern.
