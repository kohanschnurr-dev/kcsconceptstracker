

## Change "Move to Today" to "Assign to Day" Behavior

### What This Does
When you assign a task from the Master Pipeline to today's Daily Sprint, the task will now appear in **both** lists instead of disappearing from the Master Pipeline. This allows you to track progress on priority items while keeping them visible in your long-term pipeline.

---

### Current Behavior (Problem)
- Task in Master Pipeline → Click "Move to Today" 
- Task sets `is_daily = true`
- Task **disappears** from Master Pipeline
- Task only shows in Daily Sprint

### New Behavior (Solution)
- Task in Master Pipeline → Click "Assign to Day" 
- Task sets `scheduled_date = today` (but keeps `is_daily = false`)
- Task **stays** in Master Pipeline (with a visual indicator it's assigned today)
- Task **also appears** in Daily Sprint

---

### Technical Implementation

**File: `src/pages/DailyLogs.tsx`**

#### 1. Update the `handleMoveToToday` function

Change from setting `is_daily = true` to just setting `scheduled_date`:

```typescript
const handleAssignToToday = async (task: Task) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ 
        scheduled_date: todayStr  // Only set date, keep is_daily unchanged
      })
      .eq('id', task.id);

    if (error) throw error;

    toast({ title: 'Assigned to Today', description: `"${task.title}" added to today's sprint` });
    fetchTasks();
  } catch (error) {
    console.error('Error assigning task:', error);
    toast({ title: 'Error', description: 'Failed to assign task', variant: 'destructive' });
  }
};
```

#### 2. Update the Daily Sprint filter

Show tasks where `scheduled_date = today` (regardless of `is_daily` flag):

```typescript
// Daily Sprint: tasks scheduled for today (regardless of is_daily flag)
const dailyTasks = allTasks.filter((task) => {
  const isScheduledToday = task.scheduledDate === todayStr;
  
  if (taskFilter === 'pending') {
    return isScheduledToday && task.status !== 'completed';
  } else if (taskFilter === 'completed') {
    return isScheduledToday && task.status === 'completed';
  }
  return isScheduledToday;
});
```

#### 3. Update the Master Pipeline filter

Show ALL non-daily tasks (no longer exclude based on `is_daily`):

```typescript
// Master Pipeline: All tasks (is_daily = false), regardless of scheduled_date
const masterTasks = allTasks.filter((task) => {
  if (!task.isDaily) {
    if (taskFilter === 'pending') {
      return task.status !== 'completed';
    } else if (taskFilter === 'completed') {
      return task.status === 'completed';
    }
    return true;
  }
  return false;
});
```

#### 4. Add visual indicator in Master Pipeline

Show a badge when a task is scheduled for today:

```tsx
{task.scheduledDate === todayStr && (
  <Badge variant="outline" className="text-xs text-primary border-primary/50">
    Today
  </Badge>
)}
```

#### 5. Rename button from "Move to Today" to "Assign to Day"

Update button tooltip and icon to be clearer:

```tsx
<Button
  variant="ghost"
  size="icon"
  className="h-9 w-9 text-primary hover:text-primary/80"
  onClick={() => handleAssignToToday(task)}
  title="Assign to Today"
>
  <Calendar className="h-4 w-4" />  {/* Changed from ArrowRight */}
</Button>
```

#### 6. Add "Unassign from Day" option in Daily Sprint

Allow removing the scheduled date to send it back:

```tsx
{checklistTab === 'daily' && !task.isDaily && (
  <Button
    variant="ghost"
    size="icon"
    onClick={() => handleUnassignFromDay(task)}
    title="Remove from Today"
  >
    <X className="h-4 w-4" />
  </Button>
)}
```

---

### Visual Result

**Master Pipeline View:**
| ☐ | Fix plumbing issue | High | Pending | Today | 📅 |

**Daily Sprint View:**
| ☐ | Fix plumbing issue | High | Pending | - | ✕ |

- Same task appears in both lists
- Master Pipeline shows "Today" badge
- Daily Sprint shows option to unassign

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/DailyLogs.tsx` | Update filters, rename handler, add visual indicators |

---

### Summary of Changes

1. **Filter logic**: Daily Sprint shows tasks by `scheduled_date`, not `is_daily`
2. **Handler rename**: `handleMoveToToday` → `handleAssignToToday` (only sets date)
3. **Master Pipeline**: Keeps showing tasks even when assigned to a day
4. **Visual indicator**: "Today" badge in Master Pipeline for assigned tasks
5. **Unassign option**: Remove scheduled date to take task off Daily Sprint

