

## Rebrand Line Items as Subtasks

### What's Changing

Line items are being reframed as **subtasks** -- a checklist of things to do under the main task (e.g., "Frank's to-do list" with multiple items underneath). No dollar amounts needed.

### UI Changes

- Rename label from "Line Items (optional)" to "Subtasks (optional)"
- Remove the dollar amount input from each row -- each subtask is just a single text input + X button
- Rename placeholder from "Item description" to "Subtask..."
- Rename button from "+ Add Line Item" to "+ Add Subtask"
- Each row: full-width text Input + X remove button (no amount column)

### Data Changes

- Change state from `{ text: string; amount: string }[]` to simple `string[]`
- Update the JSON encoding in `handleSave` to store subtasks as a string array instead of objects (delimiter stays `---LINE_ITEMS---` for backwards compat, but payload is `["subtask1", "subtask2"]`)
- Update `resetForm`, `addLineItem`, `removeLineItem`, `updateLineItem` helpers accordingly

### File Changed

- `src/components/dashboard/AddTaskDialog.tsx` -- simplify line items into subtask strings, remove amount inputs, update labels
