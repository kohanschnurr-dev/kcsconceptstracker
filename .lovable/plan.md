

## Add Project Column to Tasks Table

### What This Does
Adds a new "Project" column to the Master Pipeline tasks table, showing which project each task is assigned to (or "Other" if none). This column appears between the Task and Priority columns.

---

### Current Columns
| Checkbox | Task | Priority | Status | Due Date | Actions |

### New Columns  
| Checkbox | Task | **Project** | Priority | Status | Due Date | Actions |

---

### Technical Changes

**File: `src/pages/DailyLogs.tsx`**

1. **Update the fetch query** to join with projects table and get project names:
   - Change from: `select('*')`
   - Change to: `select('*, projects(name)')`

2. **Update the Task transformation** to include projectName from the joined data

3. **Add Project column header** after Task column (line ~752):
   ```tsx
   <TableHead className="w-32">Project</TableHead>
   ```

4. **Add Project cell** in each table row after Task cell (line ~823):
   ```tsx
   <TableCell>
     <span className="text-sm text-muted-foreground">
       {task.projectName || 'Other'}
     </span>
   </TableCell>
   ```

5. **Update colspan** in loading and empty states from 6 to 7

6. **Update mobile card view** to also show project name as a subtle label

---

### Visual Result

**Desktop Table:**
```
┌──┬─────────────────────────────┬──────────┬──────────┬──────────┬──────────┬────────┐
│  │ Task                        │ Project  │ Priority │ Status   │ Due Date │        │
├──┼─────────────────────────────┼──────────┼──────────┼──────────┼──────────┼────────┤
│☐ │ hi                          │ Other    │ Medium   │ Pending  │ —        │ 🗓️ 🗑️  │
│☐ │ Pool scenario at Farmers... │ Farmers  │ Medium   │ Pending  │ —        │ 🗓️ 🗑️  │
└──┴─────────────────────────────┴──────────┴──────────┴──────────┴──────────┴────────┘
```

---

### Data Flow

1. Fetch tasks with project join: `tasks` + `projects(name)`
2. Transform response to include `projectName` field
3. Display in table with truncation for long project names

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/DailyLogs.tsx` | Add project column to table header, cells, and fetch query |

---

### Summary

- Join tasks with projects table to get project names
- Add "Project" column between Task and Priority
- Show project name or "Other" for unassigned tasks
- Update mobile card view to include project badge
- Update colspan for loading/empty states

