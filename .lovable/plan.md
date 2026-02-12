

## Close Popover on Cost Type Selection

### Change
Add controlled `open` state to the cost type `Popover` so it closes immediately when a type is selected.

### Technical Details

**File: `src/pages/ProjectBudget.tsx`**

Since each expense row has its own `Popover`, the simplest approach is to convert the `Popover` to a controlled component using a state map or by using the `onOpenChange` prop combined with closing on click.

The cleanest approach: wrap the popover in a controlled state using `open`/`onOpenChange`, and set `open` to `false` inside `handleCostTypeChange`. Since there are multiple rows, we will track which expense's popover is open via a single `openCostTypeId` state variable (string | null).

1. Add state: `const [openCostTypeId, setOpenCostTypeId] = useState<string | null>(null);`
2. Change `<Popover>` to `<Popover open={openCostTypeId === exp.id} onOpenChange={(open) => setOpenCostTypeId(open ? exp.id : null)}>`
3. In the button `onClick`, after calling `handleCostTypeChange`, also call `setOpenCostTypeId(null)`

This ensures exactly one popover is open at a time and it closes immediately on selection.

