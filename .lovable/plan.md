

## Add Checkboxes to Subtasks and Remove "(optional)" Label

### What Changes
Add checkboxes next to each subtask so users can check off completed items, and remove the "(optional)" text from the "Subtasks" label across all edit dialogs.

### Data Format Update
Currently subtasks are stored as a simple string array: `["GFCI Outlets", "Concrete Spot"]`. To track completion, the format changes to an array of objects: `[{"text": "GFCI Outlets", "done": false}, {"text": "Concrete Spot", "done": true}]`.

The utility will handle backward compatibility -- if it encounters plain strings (old data), it converts them to `{text, done: false}`.

### Technical Details

**1. Update `src/lib/taskSubtasks.ts`**
- Change the subtask type from `string[]` to `{text: string; done: boolean}[]`
- Update `parseDescription` to handle both old string arrays and new object arrays (backward compatible)
- Update `serializeDescription` to serialize the object format
- Export a `Subtask` type

**2. Update `src/pages/DailyLogs.tsx`**
- Change `editSubtasks` state type from `string[]` to `Subtask[]`
- Add a `Checkbox` before each subtask input
- Toggling the checkbox sets `done: true/false`
- Checked subtasks get a strikethrough style on the input
- Remove "(optional)" from the label -- just show "Subtasks"

**3. Update `src/components/command-center/CommandCenter.tsx`**
- Same changes as DailyLogs

**4. Update `src/components/project/ProjectTasks.tsx`**
- The edit form here uses `PasteableTextarea` for description. The subtask parsing/rendering needs to be added here too with the same checkbox pattern.

**5. Update `src/components/dashboard/AddTaskDialog.tsx`**
- Update the create flow to use the new `Subtask` object format
- Add checkboxes to the subtask inputs
- Remove "(optional)" from label

### UI Pattern
```
Subtasks
[x] [ GFCI Outlets (strikethrough)     ] [X]
[ ] [ Concrete Spot                     ] [X]
[ ] [ Pressure Wash house & sidewalk    ] [X]
[+ Add Subtask                             ]
```

### Files Changed
- `src/lib/taskSubtasks.ts`
- `src/pages/DailyLogs.tsx`
- `src/components/command-center/CommandCenter.tsx`
- `src/components/project/ProjectTasks.tsx`
- `src/components/dashboard/AddTaskDialog.tsx`
