
## Show Due Dates on Pipeline Tasks

### What's Needed

The `ProjectTasks` component already fetches `due_date` from the database and maps it to `dueDate` on each task object. The data is there — it's just never rendered in the card UI.

### Single File Change: `src/components/project/ProjectTasks.tsx`

In the task row (inside the `.map()`), add a due date display between the task title and the priority badge area.

**Current row layout:**
```
[ Checkbox ] [ Title text ]  [ Priority badge ] [ Status icon ]
```

**New row layout:**
```
[ Checkbox ] [ Title text ]  [ 📅 Jan 15 ] [ Priority badge ] [ Status icon ]
```

**Implementation details:**

- Import `format` from `date-fns` and `Calendar` icon from `lucide-react`
- Add a helper that returns a colored label based on proximity:
  - Overdue (past due): `text-red-500`
  - Due today: `text-amber-500`
  - Due within 7 days: `text-orange-400`
  - Future / no date: `text-muted-foreground`
- Render the date as `MMM d` format (e.g., "Jan 15") with a small `Calendar` icon, only when `task.dueDate` is not null
- Placed between the title and the priority badge in the `shrink-0` flex group on the right side

### Visual Result (matches the screenshot reference)

```
┌────────────────────────────────────────────────────────────────────┐
│  ☐  Tell Jose, Garage, Patio...             📅 Jan 15  [ High ]  ⓘ │
│  ☐  Garage Studs etc, situation             📅 Feb 2   [ High ]  ⓘ │
│  ☐  Adding 2x4s by patio                              [ Medium ] ⓘ │
└────────────────────────────────────────────────────────────────────┘
```

Tasks with no due date simply show nothing in that slot — no empty space or placeholder.

### Files to Modify

| File | Change |
|------|--------|
| `src/components/project/ProjectTasks.tsx` | Add due date display with color coding to each task row |
