

## Add Due Date Option to Quick Task Input

Add a date picker button next to the text input in the `QuickTaskInput` component so users can optionally set a due date when quick-adding tasks.

### UI Design
The current layout is: `[+ input field] [Add button]`
The new layout will be: `[+ input field] [calendar icon button] [Add button]`

- A small calendar icon button sits between the input and the Add button
- Clicking it opens a popover with a date picker
- When a date is selected, the button shows the short date (e.g., "Feb 12") instead of just the icon
- Clicking the date text clears it back to no date

### Technical Changes

**File: `src/components/dashboard/QuickTaskInput.tsx`**
- Add `dueDate` state (`Date | undefined`)
- Add a `Popover` with a `Calendar` component (using existing shadcn components with `pointer-events-auto`)
- Pass `due_date` to the Supabase insert (formatted as `yyyy-MM-dd` using `format` from `date-fns`)
- Reset `dueDate` on successful submit
- Style: small outline button with `CalendarIcon`, showing selected date text when set

No other files need changes.
