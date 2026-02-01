

## Plan: Replace Overview Tab with Tasks Tab

### Overview

Remove the "Overview" tab from the Project Detail page and replace it with a dedicated "Tasks" tab that shows only the Pipeline Tasks component (no Milestones or Notes & Reminders).

### Current Structure

```
Tabs: Schedule | Overview | Financials | Team | Photos | Logs
                    |
                    └── Overview Content:
                        ├── MilestonesTimeline
                        ├── ProjectNotes
                        └── ProjectTasks
```

### New Structure

```
Tabs: Schedule | Tasks | Financials | Team | Photos | Logs
                   |
                   └── Tasks Content:
                       └── ProjectTasks (full width, no Card wrapper)
```

---

### Technical Changes

**File: `src/pages/ProjectDetail.tsx`**

| Line | Change |
|------|--------|
| 535 | Rename "overview" tab to "tasks" |
| 542-548 | Replace Overview tab content with just ProjectTasks |

Changes to make:

1. **TabsTrigger (line 535)**:
   ```typescript
   // Before
   <TabsTrigger value="overview">Overview</TabsTrigger>
   
   // After
   <TabsTrigger value="tasks">Tasks</TabsTrigger>
   ```

2. **TabsContent (lines 542-548)**:
   ```typescript
   // Before
   <TabsContent value="overview" className="space-y-6">
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       <MilestonesTimeline projectId={id!} />
       <ProjectNotes projectId={id!} />
     </div>
     <ProjectTasks projectId={id!} />
   </TabsContent>
   
   // After
   <TabsContent value="tasks">
     <ProjectTasks projectId={id!} />
   </TabsContent>
   ```

3. **Cleanup imports** - Remove unused imports for `MilestonesTimeline` and `ProjectNotes` (lines 43-44)

---

### Component Updates

The `ProjectTasks` component already has:
- Card wrapper with header "Pipeline Tasks (count)"
- "Add Task" button linking to `/logs`
- Task list with checkboxes and priority badges
- Empty state message

No changes needed to `ProjectTasks.tsx` - it's already self-contained.

---

### Result

| Before | After |
|--------|-------|
| Overview tab with 3 sections | Tasks tab with Pipeline Tasks only |
| Milestones, Notes, Tasks | Just Tasks |
| Cluttered view | Clean, focused task list |

