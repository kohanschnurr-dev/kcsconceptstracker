

## Redesign Quick Add Log Form Layout

### Changes

**File: `src/pages/ProjectDetail.tsx`**

1. Make the "Work performed today..." textarea thinner -- change from `rows={2}` to `rows={1}` and reduce `min-h` to keep it a single-line height.

2. Restructure the layout so the work textarea, calendar date picker (using the Popover + Calendar component instead of a plain date input), and "Add Log" button all sit on the **same row**.

3. Replace the native `<Input type="date">` with a Popover + Calendar picker that shows a calendar popout when clicked, displaying the selected date as a button.

4. The issues textarea (inside the collapsible) will also become `rows={1}` to match the thinner style.

### Layout

```text
[Quick Add Log]
[ Work performed today...          ] [Feb 17, 2026 v] [Add Log]
  Add issues?
  [ Any problems or concerns... ] (when expanded, single row height)
```

### Technical Detail

- Import `Popover`, `PopoverTrigger`, `PopoverContent` and `Calendar` components (already available in the project)
- Import `format` from `date-fns` and use `parseDateString`/`formatDateString` from `@/lib/dateUtils`
- Replace the `<div className="flex flex-col gap-2 shrink-0">` wrapper with inline items on the same row
- The calendar button shows the formatted date; clicking opens a calendar popout below it
- On date select, update `quickLogDate` state and close the popover

