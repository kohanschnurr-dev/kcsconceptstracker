

## Add Project and Due Date Filters to Checklist

### What Changes

The filter bar on the Checklist tab currently only has a status dropdown. We will add two more filters beside it:
- **Project filter** -- a dropdown listing all projects the user has, plus "All Projects"
- **Due Date filter** -- a dropdown with presets: "Any Date", "Overdue", "Due Today", "Due This Week", "No Due Date"

The filters will stack nicely on mobile using the existing `flex-wrap` layout.

### Technical Details

**`src/pages/DailyLogs.tsx`**

1. **Add new state variables** (near line 146):
   ```tsx
   const [projectFilter, setProjectFilter] = useState<string>('all');
   const [dueDateFilter, setDueDateFilter] = useState<string>('any');
   ```

2. **Update the filtering logic** for both `dailyTasks` and `masterTasks` (lines 308-330). After the existing status filter check, add:
   - **Project filter**: if `projectFilter !== 'all'`, only include tasks where `task.projectId === projectFilter`
   - **Due date filter**: based on the selected preset:
     - `'any'` -- no filtering
     - `'overdue'` -- `task.dueDate` is before today and task is not completed
     - `'today'` -- `task.dueDate` equals today's date string
     - `'this_week'` -- `task.dueDate` is within the current week (using `startOfWeek`/`endOfWeek` from date-fns)
     - `'no_date'` -- `task.dueDate` is null

3. **Add the two new Select dropdowns** in the filter bar (lines 748-759), after the existing status filter:

   **Project filter:**
   ```tsx
   <Select value={projectFilter} onValueChange={setProjectFilter}>
     <SelectTrigger className="w-40 sm:w-44 h-10">
       <SelectValue placeholder="All Projects" />
     </SelectTrigger>
     <SelectContent>
       <SelectItem value="all">All Projects</SelectItem>
       {projects.map((p) => (
         <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
       ))}
     </SelectContent>
   </Select>
   ```

   **Due Date filter:**
   ```tsx
   <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
     <SelectTrigger className="w-36 sm:w-40 h-10">
       <SelectValue />
     </SelectTrigger>
     <SelectContent>
       <SelectItem value="any">Any Date</SelectItem>
       <SelectItem value="overdue">Overdue</SelectItem>
       <SelectItem value="today">Due Today</SelectItem>
       <SelectItem value="this_week">Due This Week</SelectItem>
       <SelectItem value="no_date">No Due Date</SelectItem>
     </SelectContent>
   </Select>
   ```

4. **Import** `startOfWeek` and `endOfWeek` from `date-fns` (line 53) for the "this week" filter logic.

5. **Move the task count** to stay at the end of the filter row with `ml-auto`.

No database or backend changes needed -- all filtering is client-side on already-fetched task data.
