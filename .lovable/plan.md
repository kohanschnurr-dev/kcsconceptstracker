

## Enable Inline Priority Editing on Tasks

### What This Does
Allows changing task priority directly from the task list by clicking on the priority badge, without needing to open the full edit modal.

---

### Current Behavior
- Priority badges are **display-only** in both the mobile card view and desktop table view
- Users must click the task title to open the detail modal, then change priority there
- This requires extra clicks and is not intuitive

### New Behavior
- Clicking the priority badge opens an inline dropdown to change priority
- Selecting a new priority immediately saves it to the database
- Works on both mobile cards and desktop table

---

### Technical Implementation

**File: `src/pages/DailyLogs.tsx`**

#### 1. Add inline priority change handler

```typescript
const handleInlinePriorityChange = async (taskId: string, newPriority: TaskPriority) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ priority_level: newPriority })
      .eq('id', taskId);

    if (error) throw error;
    fetchTasks();
  } catch (error) {
    console.error('Error updating priority:', error);
    toast({ title: 'Error', description: 'Failed to update priority', variant: 'destructive' });
  }
};
```

#### 2. Replace static Badge with clickable Select in desktop table (around line 724)

Before:
```tsx
<TableCell>
  <Badge variant="secondary" className={`text-xs ${TASK_PRIORITY_COLORS[task.priorityLevel]}`}>
    {TASK_PRIORITY_LABELS[task.priorityLevel]}
  </Badge>
</TableCell>
```

After:
```tsx
<TableCell>
  <Select
    value={task.priorityLevel}
    onValueChange={(v) => handleInlinePriorityChange(task.id, v as TaskPriority)}
  >
    <SelectTrigger className={`h-7 w-24 text-xs border-0 ${TASK_PRIORITY_COLORS[task.priorityLevel]}`}>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="low">Low</SelectItem>
      <SelectItem value="medium">Medium</SelectItem>
      <SelectItem value="high">High</SelectItem>
      <SelectItem value="urgent">Urgent</SelectItem>
    </SelectContent>
  </Select>
</TableCell>
```

#### 3. Replace static Badge with clickable Select in mobile card view (around line 608)

Before:
```tsx
<Badge variant="secondary" className={`text-xs ${TASK_PRIORITY_COLORS[task.priorityLevel]}`}>
  {TASK_PRIORITY_LABELS[task.priorityLevel]}
</Badge>
```

After:
```tsx
<Select
  value={task.priorityLevel}
  onValueChange={(v) => handleInlinePriorityChange(task.id, v as TaskPriority)}
>
  <SelectTrigger className={`h-6 px-2 text-xs border-0 w-auto ${TASK_PRIORITY_COLORS[task.priorityLevel]}`}>
    <SelectValue>{TASK_PRIORITY_LABELS[task.priorityLevel]}</SelectValue>
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="low">Low</SelectItem>
    <SelectItem value="medium">Medium</SelectItem>
    <SelectItem value="high">High</SelectItem>
    <SelectItem value="urgent">Urgent</SelectItem>
  </SelectContent>
</Select>
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/DailyLogs.tsx` | Add `handleInlinePriorityChange` function, replace static Badge with clickable Select in both mobile and desktop views |

---

### Expected Result
- Priority badges become clickable dropdowns
- Changing priority is instant (no modal needed)
- Visual styling matches current priority badge colors
- Works on both mobile and desktop

