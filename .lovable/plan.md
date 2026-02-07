

## Plan: Inline "Add Task" Modal for Project Tasks Tab

### Overview
Replace the current "+ Add Task" button (which navigates away to `/logs`) with an inline modal that opens directly on the Project Detail page. The modal will have the project pre-selected, allowing quick task creation without leaving the page.

---

### Current Flow
```text
User clicks "+ Add Task" → Navigates to /logs page → Must select project manually
```

### New Flow
```text
User clicks "+ Add Task" → Modal opens with project pre-filled → Quick task entry → Done!
```

---

### Visual Design

```text
┌─────────────────────────────────────────────────────┐
│ ✕                                                   │
│   Add Task to Wales Rental                          │
│   ─────────────────────────────────────────         │
│                                                     │
│   Task Title *                                      │
│   ┌───────────────────────────────────────────┐     │
│   │ Enter task description...                 │     │
│   └───────────────────────────────────────────┘     │
│                                                     │
│   Priority                                          │
│   ┌─────────────┐                                   │
│   │ Medium    ▼ │                                   │
│   └─────────────┘                                   │
│                                                     │
│   Due Date (optional)                               │
│   ┌─────────────┐                                   │
│   │ Select...   │                                   │
│   └─────────────┘                                   │
│                                                     │
│              ┌──────────────────────────────┐       │
│              │       Add to Pipeline        │       │
│              └──────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

---

### File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/project/AddTaskModal.tsx` | CREATE | New modal component for adding tasks inline |
| `src/components/project/ProjectTasks.tsx` | MODIFY | Add modal, accept projectName prop, replace Link button |
| `src/pages/ProjectDetail.tsx` | MODIFY | Pass project.name to ProjectTasks |

---

### Component Details

#### 1. AddTaskModal.tsx (New)

Props:
- `open: boolean` - Modal visibility
- `onOpenChange: (open: boolean) => void` - Toggle callback
- `projectId: string` - Pre-filled project ID
- `projectName: string` - Displayed in the modal title
- `onTaskCreated: () => void` - Callback to refresh the task list

Features:
- Title input (required)
- Priority dropdown (Low/Medium/High/Urgent) - defaults to Medium
- Optional due date picker
- Submits directly to `tasks` table with `project_id` pre-set
- Shows success toast and closes on creation
- Calls `onTaskCreated` to refresh the parent list

#### 2. ProjectTasks.tsx (Modify)

Changes:
- Add `projectName: string` to `ProjectTasksProps`
- Import and render `AddTaskModal`
- Add state: `isAddModalOpen`
- Replace `<Link to="/logs">` button with:
  ```tsx
  <Button size="sm" variant="outline" onClick={() => setIsAddModalOpen(true)}>
    <Plus className="h-4 w-4 mr-1" />
    Add Task
  </Button>
  ```
- Include the modal at component end:
  ```tsx
  <AddTaskModal
    open={isAddModalOpen}
    onOpenChange={setIsAddModalOpen}
    projectId={projectId}
    projectName={projectName}
    onTaskCreated={fetchTasks}
  />
  ```

#### 3. ProjectDetail.tsx (Modify)

Change line 557:
```tsx
// Before
<ProjectTasks projectId={id!} />

// After
<ProjectTasks projectId={id!} projectName={project.name} />
```

---

### Task Creation Logic

The modal will create tasks with these defaults:
- `user_id`: Current authenticated user
- `project_id`: The pre-filled project ID (passed as prop)
- `status`: 'pending'
- `priority_level`: User-selected (default 'medium')
- `is_daily`: false (Master Pipeline task)
- `scheduled_date`: null
- `due_date`: Optional user input

This matches the existing task creation pattern from DailyLogs.tsx (lines 233-243).

---

### Empty State Update

Also update the empty state message (line 118):
```tsx
// Before
"No tasks linked to this project yet. Add them from the Daily Logs page!"

// After  
"No tasks linked to this project yet. Click 'Add Task' to create one!"
```

---

### Technical Notes

- Uses existing UI components: Dialog, Input, Select, Button
- Follows the existing task creation pattern from DailyLogs
- Modal is lightweight - only the essential fields (title, priority, due date)
- Keeps project_id validation simple - it's always pre-set

