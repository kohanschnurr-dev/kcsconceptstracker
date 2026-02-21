

## Make Subtasks Section Collapsible Across All Task Dialogs

### Problem
The subtasks section in task create/edit dialogs can take up significant vertical space when there are many items. The user wants this section to be collapsible to save space.

### Approach
Use the existing `Collapsible` component from Radix UI (already installed) to wrap the subtasks list. The trigger will be the "Subtasks" label row with a chevron indicator showing the expand/collapse state. The "Add Subtask" button stays visible outside the collapsible content so users can always add new items.

### Files to Change (5 files)

**1. `src/components/project/ProjectTasks.tsx`** (edit dialog)
- Wrap the subtasks list in `Collapsible` / `CollapsibleTrigger` / `CollapsibleContent`
- Make the label row clickable with a chevron icon that rotates on open
- Keep "Add Subtask" button inside the collapsible content
- Default open when subtasks exist, collapsed when empty

**2. `src/components/project/AddTaskModal.tsx`** (add dialog)
- Same collapsible pattern around the subtasks section
- Default collapsed (no subtasks initially)

**3. `src/pages/DailyLogs.tsx`** (edit dialog)
- Same collapsible pattern
- Default open when subtasks exist

**4. `src/components/command-center/CommandCenter.tsx`** (edit dialog)
- Same collapsible pattern
- Default open when subtasks exist

**5. `src/components/dashboard/AddTaskDialog.tsx`** (add dialog)
- Same collapsible pattern
- Default collapsed

### UI Pattern (consistent across all 5 files)

```
[Collapsible defaultOpen={subtasks.length > 0}]
  [CollapsibleTrigger] -- clickable row:
    ListTodo icon + "Subtasks" label + count badge + ChevronDown (rotates)
  [CollapsibleContent]:
    - Subtask rows (checkbox + input + X)
    - "Add Subtask" button
[/Collapsible]
```

- The trigger shows a count badge (e.g., "3") when collapsed so users know items exist
- ChevronDown rotates 180deg when open via `data-[state=open]` CSS
- Smooth animation via the existing `CollapsibleContent` transition

### Technical Details
- Import `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` from `@/components/ui/collapsible`
- Import `ChevronDown` from lucide-react (already available in most files)
- Add `Badge` import for the count indicator
- No new dependencies needed -- all components already exist in the project
